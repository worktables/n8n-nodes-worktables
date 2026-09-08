import { Worktables } from '../../nodes/Worktables/Worktables.node';
import { createMockContext, jsonResponse, requestedQuery } from '../helpers/mockContext';
const node = new Worktables();
function values(query: string) {
	const match = query.match(/column_values: "((?:[^"\\]|\\.)*)"/);
	if (!match) throw new Error('Missing column values');
	return JSON.parse(JSON.parse(`"${match[1]}"`));
}
const cases: Array<[string, Record<string, unknown>, unknown]> = [
	['board_relation', { columnValue: '1, 2' }, { item_ids: ['1', '2'] }],
	['connect_boards', { columnValue: '2' }, { item_ids: ['2'] }],
	['dependency', { columnValue: '1, 2' }, { item_ids: ['1', '2'] }],
	[
		'people',
		{ peopleValue: ['1'], teamsValue: ['2'] },
		{
			personsAndTeams: [
				{ id: 1, kind: 'person' },
				{ id: 2, kind: 'team' },
			],
		},
	],
	['people', {}, undefined],
	[
		'timeline',
		{ startDate: '2026-01-01T12:00:00', endDate: '2026-01-02T13:00:00' },
		{ from: '2026-01-01', to: '2026-01-02' },
	],
	['checkbox', { columnValue: 'true', checkboxValue: 'true' }, { checked: 'true' }],
	['hour', { columnValue: '12:30' }, { hour: 12, minute: 30 }],
	['hour', { columnValue: '12' }, { hour: 12, minute: 0 }],
	['status', { statusLabel: 'Done' }, { label: 'Done' }],
	[
		'location',
		{ latitude: '1', longitude: '2', address: 'Office' },
		{ lat: '1', lng: '2', address: 'Office' },
	],
	['dropdown', { dropdownValue: 'One, , Two' }, { labels: ['One', 'Two'] }],
	['dropdown', {}, undefined],
	['dropdown', { dropdownValue: ', ' }, undefined],
	['date', { dateValue: '2026-01-02' }, { date: '2026-01-02' }],
	['date', { dateValue: '2026-01-02T12:34' }, { date: '2026-01-02', time: '12:34:00' }],
	['date', { dateValue: '2026-01-02T12:34:56Z' }, { date: '2026-01-02', time: '12:34:56' }],
	[
		'email',
		{ emailText: 'Ana', emailValue: 'ana@example.com' },
		{ text: 'Ana', email: 'ana@example.com' },
	],
	['email', {}, { text: '', email: '' }],
	[
		'link',
		{ linkText: 'Docs', url: 'https://example.com' },
		{ text: 'Docs', url: 'https://example.com' },
	],
	['link', {}, { text: '', url: '' }],
	[
		'phone',
		{ countryCode: '+55 BR', phoneValue: '(11) 1234-5678' },
		{ phone: '+551112345678', countryShortName: 'BR' },
	],
	['phone', {}, { phone: '', countryShortName: '' }],
	['numbers', { columnValue: '12' }, '12'],
	['text', { columnValue: 'hello' }, 'hello'],
	['simple', { columnValue: 12 }, 12],
	['text', {}, undefined],
];

describe.each(['createItem', 'updateItem'])('%s column encoding', (operation) => {
	function setup(column: Record<string, unknown>) {
		const mock = createMockContext({
			params: {
				resource: 'item',
				operation,
				boardId: '42',
				itemId: '51',
				itemName: 'Task',
				isSubitem: false,
				columnValues: { column: [{ columnId: 'field', ...column }] },
			},
		});
		if (operation === 'createItem')
			mock.request.mockResolvedValueOnce(
				jsonResponse({
					data: { boards: [{ columns: [{ id: 'field', type: column.columnType }] }] },
				}),
			);
		return mock;
	}
	function success(mock: ReturnType<typeof setup>) {
		if (operation === 'createItem')
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Roadmap' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { create_item: { id: '51' } } }))
				.mockResolvedValueOnce(
					jsonResponse({ data: { items: [{ id: '51', column_values: [] }] } }),
				);
		else
			mock.request.mockResolvedValueOnce(
				jsonResponse({ data: { change_multiple_column_values: { id: '51' } } }),
			);
	}
	it.each(cases)('encodes %s with %j', async (columnType, fields, expected) => {
		const mock = setup({ columnType, ...fields });
		success(mock);
		await node.execute.call(mock.asExecute());
		expect(values(requestedQuery(mock.request, operation === 'createItem' ? 2 : 0))).toEqual(
			expected === undefined ? {} : { field: expected },
		);
	});
	it('rejects invalid dates before mutating', async () => {
		const mock = setup({ columnType: 'date', dateValue: 'bad-date' });
		await expect(node.execute.call(mock.asExecute())).rejects.toThrow(
			'Invalid date format for column field',
		);
		expect(mock.request).toHaveBeenCalledTimes(operation === 'createItem' ? 1 : 0);
	});
	it.each([undefined, '{"label":"Done"}', '{bad'])(
		'parses object values: %s',
		async (objectValue) => {
			const mock = setup({ columnType: 'objectValue', objectValue });
			success(mock);
			if (objectValue === '{bad')
				await expect(node.execute.call(mock.asExecute())).rejects.toThrow('Invalid JSON format');
			else {
				await node.execute.call(mock.asExecute());
				expect(values(requestedQuery(mock.request, operation === 'createItem' ? 2 : 0))).toEqual({
					field: objectValue ? { label: 'Done' } : {},
				});
			}
		},
	);
});

describe('update column special cases', () => {
	async function update(column: Record<string, unknown>, response?: unknown) {
		const mock = createMockContext({
			params: {
				resource: 'item',
				operation: 'updateItem',
				itemId: '51',
				boardId: '42',
				columnValues: { column: [{ columnId: 'field', ...column }] },
			},
		});
		if (response !== undefined) mock.request.mockResolvedValueOnce(jsonResponse(response));
		mock.request.mockResolvedValueOnce(
			jsonResponse({ data: { change_multiple_column_values: { id: '51' } } }),
		);
		await node.execute.call(mock.asExecute());
		return { mock, encoded: values(requestedQuery(mock.request, response === undefined ? 0 : 1)) };
	}
	it.each([{}, { data: { items: [{ column_values: [{ linked_item_ids: ['1', '2'] }] }] } }])(
		'merges connection IDs without duplicates: %j',
		async (response) => {
			const { encoded } = await update(
				{ columnType: 'board_relation', columnValue: '2, 3', addConnections: true },
				response,
			);
			expect(encoded).toEqual({
				field: { item_ids: 'data' in response ? ['1', '2', '3'] : ['2', '3'] },
			});
		},
	);
	it.each([
		{},
		{ fileLinks: {} },
		{ fileLinks: { file: [{ linkToFile: 'https://example.com/a', name: 'A' }] } },
	])('encodes file links: %j', async (fields) => {
		const { encoded } = await update({ columnType: 'fileLink', ...fields });
		expect(encoded).toEqual(
			fields.fileLinks && 'file' in fields.fileLinks
				? {
						field: {
							files: [{ fileType: 'LINK', linkToFile: 'https://example.com/a', name: 'A' }],
						},
				  }
				: {},
		);
	});
	it('parses file URLs and names', async () => {
		const { encoded } = await update({
			columnType: 'file',
			columnValue: 'https://example.com/a First report, https://example.com/b Second',
		});
		expect(encoded.field.files).toEqual([
			{ fileType: 'LINK', linkToFile: 'https://example.com/a', name: 'First report' },
			{ fileType: 'LINK', linkToFile: 'https://example.com/b', name: 'Second' },
		]);
	});
	it.each(['{"clicks":2}', '{}', 'bad'])(
		'increments button clicks or skips malformed values: %s',
		async (value) => {
			jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
			try {
				const { encoded } = await update(
					{ columnType: 'button' },
					{ data: { items: [{ column_values: [{ value }] }] } },
				);
				expect(encoded).toEqual(
					value === 'bad'
						? {}
						: { field: { clicks: value === '{}' ? 1 : 3, changed_at: '2026-01-01T00:00:00.000Z' } },
				);
			} finally {
				jest.useRealTimers();
			}
		},
	);
});

describe('createItem additional column inputs', () => {
	it.each([
		[
			'file',
			{ fileLinks: { file: [{ linkToFile: 'https://example.com/a', name: 'Report' }] } },
			{ files: [{ fileType: 'LINK', linkToFile: 'https://example.com/a', name: 'Report' }] },
		],
		['file', {}, undefined],
		['file', { fileLinks: {} }, undefined],
		[
			'file',
			{ columnType: 'simple', columnValue: 'https://example.com/a Report' },
			{ files: [{ fileType: 'LINK', linkToFile: 'https://example.com/a', name: 'Report' }] },
		],
		[
			'people',
			{ peopleValue: '1, ,2', teamsValue: '3, ' },
			{
				personsAndTeams: [
					{ id: 1, kind: 'person' },
					{ id: 2, kind: 'person' },
					{ id: 3, kind: 'team' },
				],
			},
		],
		['board_relation', { columnValue: ['1', '2'] }, { item_ids: ['1', '2'] }],
		['dependency', { columnValue: ['1', '2'] }, { item_ids: ['1', '2'] }],
		['board_relation', {}, { item_ids: [''] }],
		['dependency', {}, { item_ids: [''] }],
		['timeline', {}, { from: '', to: '' }],
		['hour', {}, { hour: null, minute: 0 }],
		['location', {}, { lat: '', lng: '', address: '' }],
		['unknown', {}, undefined],
	] as Array<[string, Record<string, unknown>, unknown]>)(
		'encodes %s with %j',
		async (type, fields, expected) => {
			const mock = createMockContext({
				params: {
					resource: 'item',
					operation: 'createItem',
					boardId: '42',
					itemName: 'Task',
					columnValues: { column: [{ columnId: 'field', ...fields }] },
				},
			});
			mock.request
				.mockResolvedValueOnce(
					jsonResponse({ data: { boards: [{ columns: [{ id: 'field', type }] }] } }),
				)
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Board' }] } }))
				.mockResolvedValueOnce(
					jsonResponse({ data: { create_item: { id: '51', board: { id: '42' } } } }),
				)
				.mockResolvedValueOnce('{}');
			await node.execute.call(mock.asExecute());
			expect(values(requestedQuery(mock.request, 2))).toEqual(
				expected === undefined ? {} : { field: expected },
			);
		},
	);
});

it.each([
	['timeline', {}, {}],
	['location', {}, { address: '' }],
	['simple', { columnValue: false }, false],
] as Array<[string, Record<string, unknown>, unknown]>)(
	'updateItem handles optional %s fields',
	async (columnType, fields, expected) => {
		const mock = createMockContext({
			params: {
				resource: 'item',
				operation: 'updateItem',
				itemId: '51',
				boardId: '42',
				columnValues: { column: [{ columnId: 'field', columnType, ...fields }] },
			},
		});
		mock.request.mockResolvedValueOnce(
			jsonResponse({ data: { change_multiple_column_values: { id: '51' } } }),
		);
		await node.execute.call(mock.asExecute());
		expect(values(requestedQuery(mock.request))).toEqual({ field: expected });
	},
);
