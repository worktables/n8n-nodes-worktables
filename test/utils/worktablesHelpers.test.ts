import { NodeApiError } from 'n8n-workflow';
import {
	buildMentionsGraphQL,
	parseBinaryNames,
	makeGraphQLRequest,
	formatColumnValue,
	formatFileName,
	escapeGraphQLString,
	escapeGraphQLJSONString,
	processColumnValues,
} from '../../utils/worktablesHelpers';
import { createMockContext, jsonResponse, requestedQuery, squash, TEST_API_KEY } from '../helpers/mockContext';

describe('buildMentionsGraphQL', () => {
	it('returns an empty string when mentions are disabled', () => {
		expect(buildMentionsGraphQL(false, { mention: [{ id: '1', type: 'User' }] })).toBe('');
	});

	it('returns an empty string when the mention list is empty', () => {
		expect(buildMentionsGraphQL(true, { mention: [] })).toBe('');
	});

	it('builds a mentions_list argument for each mention', () => {
		const result = buildMentionsGraphQL(true, {
			mention: [
				{ id: '123', type: 'User' },
				{ id: '456', type: 'Team' },
				{ id: '789', type: 'Board' },
			],
		});
		expect(result).toBe(
			', mentions_list: [{id: 123, type: User}, {id: 456, type: Team}, {id: 789, type: Board}]',
		);
	});
});

describe('parseBinaryNames', () => {
	it('splits on commas and trims whitespace', () => {
		expect(parseBinaryNames('data, attachment ,file2')).toEqual(['data', 'attachment', 'file2']);
	});

	it('drops empty entries', () => {
		expect(parseBinaryNames('data,,  ,file')).toEqual(['data', 'file']);
		expect(parseBinaryNames('')).toEqual([]);
	});
});

describe('makeGraphQLRequest', () => {
	const headers = { Authorization: 'Bearer x', 'Content-Type': 'application/json' };

	it('posts the query without variables when none are given', async () => {
		const { asExecute, request } = createMockContext();
		request.mockResolvedValueOnce('{"data":{}}');

		const result = await makeGraphQLRequest(asExecute(), 'query { me { id } }', headers);

		expect(result).toBe('{"data":{}}');
		expect(request).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://api.monday.com/v2',
			headers,
			body: { query: 'query { me { id } }' },
		});
	});

	it('includes variables when provided', async () => {
		const { asExecute, request } = createMockContext();
		request.mockResolvedValueOnce('{"data":{}}');

		await makeGraphQLRequest(asExecute(), 'mutation ($id: ID!) { x(id: $id) }', headers, { id: '1' });

		expect(request.mock.calls[0][0].body).toEqual({
			query: 'mutation ($id: ID!) { x(id: $id) }',
			variables: { id: '1' },
		});
	});
});

describe('formatColumnValue', () => {
	it.each(['subtasks', 'formula', 'auto_number', 'creation_log', 'last_updated'])(
		'returns null for non-updateable column type %s',
		async (type) => {
			await expect(formatColumnValue({ id: 'c', type, text: '', value: null })).resolves.toBeNull();
		},
	);

	it('parses the JSON value for regular columns', async () => {
		const result = await formatColumnValue({
			id: 'status',
			type: 'status',
			text: 'Done',
			value: '{"index":1,"post_id":null}',
		});
		expect(result).toEqual({ type: 'status', text: 'Done', value: { index: 1, post_id: null } });
	});

	it('keeps non-JSON values as strings and null values as null', async () => {
		await expect(
			formatColumnValue({ id: 't', type: 'text', text: 'hello', value: 'hello' }),
		).resolves.toEqual({ type: 'text', text: 'hello', value: 'hello' });
		await expect(formatColumnValue({ id: 't', type: 'text', text: '', value: null })).resolves.toEqual({
			type: 'text',
			text: '',
			value: null,
		});
	});

	it.each(['board_relation', 'connect_boards', 'dependency'])(
		'nulls the value and copies linked_item_ids for relation type %s',
		async (type) => {
			const result = await formatColumnValue({
				id: 'rel',
				type,
				text: 'Item A, Item B',
				value: '{"linkedPulseIds":[{"linkedPulseId":1}]}',
				display_value: 'Item A, Item B',
				linked_item_ids: ['1', '2'],
			});
			expect(result).toEqual({
				type,
				text: 'Item A, Item B',
				value: null,
				linked_item_ids: ['1', '2'],
				display_value: 'Item A, Item B',
			});
		},
	);

	it('omits linked_item_ids for relation columns when the API did not return it', async () => {
		const result = await formatColumnValue({ id: 'rel', type: 'board_relation', text: '', value: null });
		expect(result).toEqual({ type: 'board_relation', text: '', value: null });
		expect(result).not.toHaveProperty('linked_item_ids');
	});

	it('includes linked_items for dependency columns', async () => {
		const result = await formatColumnValue({
			id: 'dep',
			type: 'dependency',
			text: 'Task 1',
			value: null,
			linked_item_ids: ['10'],
			linked_items: [{ id: '10', name: 'Task 1' }],
		});
		expect(result?.linked_items).toEqual([{ id: '10', name: 'Task 1' }]);
	});

	it('includes mirror metadata', async () => {
		const result = await formatColumnValue({
			id: 'mirror',
			type: 'mirror',
			text: '',
			value: null,
			display_value: 'Mirrored text',
			mirrored_items: [{ linked_board_id: '555' }],
		});
		expect(result).toEqual({
			type: 'mirror',
			text: '',
			value: null,
			display_value: 'Mirrored text',
			mirrored_items: [{ linked_board_id: '555' }],
		});
	});

	it('copies linked_item_ids on non-relation columns that expose it', async () => {
		const result = await formatColumnValue({
			id: 'x',
			type: 'text',
			text: 'a',
			value: '"a"',
			linked_item_ids: ['1'],
		});
		expect(result).toEqual({ type: 'text', text: 'a', value: 'a', linked_item_ids: ['1'] });
	});
});

describe('formatFileName', () => {
	it('falls back to upload.dat when nothing is provided', () => {
		expect(formatFileName(undefined, undefined)).toBe('upload.dat');
	});

	it('appends the extension when the name has none', () => {
		expect(formatFileName('report', 'pdf')).toBe('report.pdf');
	});

	it('leaves names that already contain an extension untouched', () => {
		expect(formatFileName('report.pdf', 'pdf')).toBe('report.pdf');
		expect(formatFileName('archive.tar.gz', 'zip')).toBe('archive.tar.gz');
	});

	it('uses the default extension when none is provided', () => {
		expect(formatFileName('report', undefined)).toBe('report.dat');
	});

	it('honours custom defaults', () => {
		expect(formatFileName(undefined, undefined, 'image', 'png')).toBe('image.png');
		expect(formatFileName(undefined, 'jpg', 'image', 'png')).toBe('image.jpg');
	});
});

describe('escapeGraphQLString', () => {
	it('escapes backslashes before other characters', () => {
		expect(escapeGraphQLString('a\\b')).toBe('a\\\\b');
		expect(escapeGraphQLString('say \\"hi\\"')).toBe('say \\\\\\"hi\\\\\\"');
	});

	it('escapes double quotes', () => {
		expect(escapeGraphQLString('He said "hello"')).toBe('He said \\"hello\\"');
	});

	it('escapes newlines, carriage returns and tabs', () => {
		expect(escapeGraphQLString('line1\nline2\r\n\tindented')).toBe('line1\\nline2\\r\\n\\tindented');
	});

	it('leaves plain strings unchanged', () => {
		expect(escapeGraphQLString('plain text 123')).toBe('plain text 123');
		expect(escapeGraphQLString('')).toBe('');
	});
});

describe('escapeGraphQLJSONString', () => {
	it('stringifies and escapes an object for embedding in a GraphQL literal', () => {
		expect(escapeGraphQLJSONString({ status: { label: 'Done' } })).toBe(
			'{\\"status\\":{\\"label\\":\\"Done\\"}}',
		);
	});

	it('round-trips through JSON.parse after unescaping', () => {
		const original = { text: 'multi\nline "quoted"', n: 1 };
		const escaped = escapeGraphQLJSONString(original);
		// Simulate what a GraphQL parser does with the escaped literal
		const unescaped = JSON.parse(`"${escaped}"`);
		expect(JSON.parse(unescaped)).toEqual(original);
	});
});

describe('processColumnValues', () => {
	const BOARD_ID = '1234567890';

	const boardColumns = [
		{ id: 'text_col', type: 'text' },
		{ id: 'status_col', type: 'status' },
		{ id: 'people_col', type: 'people' },
		{ id: 'timeline_col', type: 'timeline' },
		{ id: 'checkbox_col', type: 'checkbox' },
		{ id: 'hour_col', type: 'hour' },
		{ id: 'location_col', type: 'location' },
		{ id: 'dropdown_col', type: 'dropdown' },
		{ id: 'date_col', type: 'date' },
		{ id: 'email_col', type: 'email' },
		{ id: 'link_col', type: 'link' },
		{ id: 'phone_col', type: 'phone' },
		{ id: 'file_col', type: 'file' },
		{ id: 'relation_col', type: 'board_relation' },
		{ id: 'dependency_col', type: 'dependency' },
		{ id: 'numbers_col', type: 'numbers' },
		{ id: 'long_text_col', type: 'long_text' },
	];

	function setup() {
		const mock = createMockContext();
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ columns: boardColumns }] } }));
		return mock;
	}

	async function run(columnValues: Parameters<typeof processColumnValues>[1]) {
		const mock = setup();
		const result = await processColumnValues(mock.asExecute(), columnValues, BOARD_ID, TEST_API_KEY);
		return { result, mock };
	}

	it('returns an empty object without hitting the API when there are no column values', async () => {
		const mock = createMockContext();
		await expect(processColumnValues(mock.asExecute(), [], BOARD_ID, TEST_API_KEY)).resolves.toEqual({});
		await expect(
			processColumnValues(mock.asExecute(), undefined as any, BOARD_ID, TEST_API_KEY),
		).resolves.toEqual({});
		expect(mock.request).not.toHaveBeenCalled();
	});

	it('fetches the board column types with the API key and board id', async () => {
		const { mock } = await run([{ columnId: 'text_col', columnValue: 'x' }]);

		const call = mock.request.mock.calls[0][0];
		expect(call.method).toBe('POST');
		expect(call.url).toBe('https://api.monday.com/v2');
		expect(call.headers.Authorization).toBe(`Bearer ${TEST_API_KEY}`);
		expect(call.headers['API-Version']).toBe('2026-01');
		expect(squash(requestedQuery(mock.request))).toContain(`boards(ids: ${BOARD_ID})`);
	});

	it('passes text columns through as plain strings', async () => {
		const { result } = await run([{ columnId: 'text_col', columnValue: 'Hello' }]);
		expect(result).toEqual({ text_col: 'Hello' });
	});

	it('treats columnType "simple" as a raw value regardless of board type', async () => {
		const { result } = await run([{ columnId: 'status_col', columnType: 'simple', columnValue: 'Done' }]);
		expect(result).toEqual({ status_col: 'Done' });
	});

	it('uses a raw value for columns the board does not know about', async () => {
		const { result } = await run([{ columnId: 'unknown_col', columnValue: 'anything' }]);
		expect(result).toEqual({ unknown_col: 'anything' });
	});

	it('skips text columns when no value is given', async () => {
		const { result } = await run([{ columnId: 'text_col' }]);
		expect(result).toEqual({});
	});

	it('parses objectValue JSON', async () => {
		const { result } = await run([
			{ columnId: 'status_col', columnType: 'objectValue', objectValue: '{"label":"Working on it"}' },
		]);
		expect(result).toEqual({ status_col: { label: 'Working on it' } });
	});

	it('defaults objectValue to an empty object when omitted', async () => {
		const { result } = await run([{ columnId: 'status_col', columnType: 'objectValue' }]);
		expect(result).toEqual({ status_col: {} });
	});

	it('throws a NodeApiError for invalid objectValue JSON', async () => {
		const mock = setup();
		await expect(
			processColumnValues(
				mock.asExecute(),
				[{ columnId: 'status_col', columnType: 'objectValue', objectValue: '{oops' }],
				BOARD_ID,
				TEST_API_KEY,
			),
		).rejects.toThrow(NodeApiError);
	});

	it('builds item_ids for board relation columns from a comma list or an array', async () => {
		const { result } = await run([
			{ columnId: 'relation_col', columnValue: '111, 222,333' },
			{ columnId: 'dependency_col', columnValue: ['444', '555'] as any },
		]);
		expect(result).toEqual({
			relation_col: { item_ids: ['111', '222', '333'] },
			dependency_col: { item_ids: ['444', '555'] },
		});
	});

	it('honours an explicit columnType over the board type', async () => {
		const { result } = await run([{ columnId: 'text_col', columnType: 'connect_boards', columnValue: '9' }]);
		expect(result).toEqual({ text_col: { item_ids: ['9'] } });
	});

	it('builds personsAndTeams for people columns from strings and arrays', async () => {
		const { result } = await run([
			{ columnId: 'people_col', peopleValue: '10, 20', teamsValue: ['30'] },
		]);
		expect(result).toEqual({
			people_col: {
				personsAndTeams: [
					{ id: 10, kind: 'person' },
					{ id: 20, kind: 'person' },
					{ id: 30, kind: 'team' },
				],
			},
		});
	});

	it('omits people columns when no ids are provided', async () => {
		const { result } = await run([{ columnId: 'people_col', peopleValue: '', teamsValue: '' }]);
		expect(result).toEqual({});
	});

	it('strips the time part from timeline dates', async () => {
		const { result } = await run([
			{ columnId: 'timeline_col', startDate: '2026-01-05T10:00:00.000Z', endDate: '2026-01-09' },
		]);
		expect(result).toEqual({ timeline_col: { from: '2026-01-05', to: '2026-01-09' } });
	});

	it('maps checkbox values', async () => {
		const { result } = await run([{ columnId: 'checkbox_col', checkboxValue: true }]);
		expect(result).toEqual({ checkbox_col: { checked: true } });
	});

	it('splits hour columns into hour and minute', async () => {
		const { result } = await run([{ columnId: 'hour_col', columnValue: '14:30' }]);
		expect(result).toEqual({ hour_col: { hour: 14, minute: 30 } });
	});

	it('defaults the minute to zero when only an hour is given', async () => {
		const { result } = await run([{ columnId: 'hour_col', columnValue: '9' }]);
		expect(result).toEqual({ hour_col: { hour: 9, minute: 0 } });
	});

	it('maps status labels and skips status columns without a label', async () => {
		const { result } = await run([
			{ columnId: 'status_col', statusLabel: 'Done' },
			{ columnId: 'status_col2', columnType: 'status' },
		]);
		expect(result).toEqual({ status_col: { label: 'Done' } });
	});

	it('maps location columns and defaults missing parts to empty strings', async () => {
		const { result } = await run([
			{ columnId: 'location_col', latitude: '40.7128', longitude: '-74.0060', address: 'New York' },
			{ columnId: 'location_col2', columnType: 'location' },
		]);
		expect(result).toEqual({
			location_col: { lat: '40.7128', lng: '-74.0060', address: 'New York' },
			location_col2: { lat: '', lng: '', address: '' },
		});
	});

	it('splits, trims and filters dropdown labels', async () => {
		const { result } = await run([
			{ columnId: 'dropdown_col', dropdownValue: ' Red, Blue ,, Green ' },
			{ columnId: 'dropdown_col2', columnType: 'dropdown', dropdownValue: ' , ' },
		]);
		expect(result).toEqual({ dropdown_col: { labels: ['Red', 'Blue', 'Green'] } });
	});

	describe('date columns', () => {
		it('sends only the date when no time part is given', async () => {
			const { result } = await run([{ columnId: 'date_col', dateValue: '2026-03-15' }]);
			expect(result).toEqual({ date_col: { date: '2026-03-15' } });
		});

		it('preserves the local time and ignores the timezone suffix', async () => {
			const { result } = await run([{ columnId: 'date_col', dateValue: '2026-03-15T23:45:10+02:00' }]);
			expect(result).toEqual({ date_col: { date: '2026-03-15', time: '23:45:10' } });
		});

		it('pads missing seconds', async () => {
			const { result } = await run([{ columnId: 'date_col', dateValue: '2026-03-15T08:05' }]);
			expect(result).toEqual({ date_col: { date: '2026-03-15', time: '08:05:00' } });
		});

		it('skips the column when the date is empty', async () => {
			const { result } = await run([{ columnId: 'date_col', dateValue: '' }]);
			expect(result).toEqual({});
		});

		it('throws a NodeApiError for an unparseable date', async () => {
			const mock = setup();
			await expect(
				processColumnValues(
					mock.asExecute(),
					[{ columnId: 'date_col', dateValue: 'not-a-date' }],
					BOARD_ID,
					TEST_API_KEY,
				),
			).rejects.toThrow(/Invalid date format for column date_col/);
		});
	});

	it('maps email and link columns', async () => {
		const { result } = await run([
			{ columnId: 'email_col', emailText: 'Support', emailValue: 'support@example.com' },
			{ columnId: 'link_col', linkText: 'Docs', url: 'https://example.com/docs' },
		]);
		expect(result).toEqual({
			email_col: { text: 'Support', email: 'support@example.com' },
			link_col: { text: 'Docs', url: 'https://example.com/docs' },
		});
	});

	it('normalises phone numbers with the country code prefix', async () => {
		const { result } = await run([
			{ columnId: 'phone_col', countryCode: '+55 BR', phoneValue: '(11) 99999-8888' },
		]);
		expect(result).toEqual({ phone_col: { phone: '+5511999998888', countryShortName: 'BR' } });
	});

	it('handles phone columns without a country code', async () => {
		const { result } = await run([{ columnId: 'phone_col', phoneValue: '555 0100' }]);
		expect(result).toEqual({ phone_col: { phone: '5550100', countryShortName: '' } });
	});

	it('maps file link collections', async () => {
		const { result } = await run([
			{
				columnId: 'file_col',
				fileLinks: {
					file: [
						{ linkToFile: 'https://example.com/a.pdf', name: 'A' },
						{ linkToFile: 'https://example.com/b.pdf', name: 'B' },
					],
				},
			},
		]);
		expect(result).toEqual({
			file_col: {
				files: [
					{ fileType: 'LINK', linkToFile: 'https://example.com/a.pdf', name: 'A' },
					{ fileType: 'LINK', linkToFile: 'https://example.com/b.pdf', name: 'B' },
				],
			},
		});
	});

	it('supports the fileLink alias type', async () => {
		const { result } = await run([
			{
				columnId: 'text_col',
				columnType: 'fileLink',
				fileLinks: { file: [{ linkToFile: 'https://example.com/a.pdf', name: 'A' }] },
			},
		]);
		expect(result.text_col.files).toHaveLength(1);
	});

	it('skips file columns without links', async () => {
		const { result } = await run([{ columnId: 'file_col' }]);
		expect(result).toEqual({});
	});

	it('passes unknown column types through as their raw value', async () => {
		const { result } = await run([
			{ columnId: 'numbers_col', columnValue: '42' },
			{ columnId: 'long_text_col', columnValue: 'A long note' },
			{ columnId: 'numbers_col2', columnType: 'numbers' },
		]);
		expect(result).toEqual({ numbers_col: '42', long_text_col: 'A long note' });
	});
});
