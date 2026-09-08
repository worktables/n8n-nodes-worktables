import { Worktables } from '../../nodes/Worktables/Worktables.node';
import { createMockContext, jsonResponse, requestedQuery, squash } from '../helpers/mockContext';
const node = new Worktables();
const page = (items: unknown[] = [], cursor: string | null = null) => ({
	data: { boards: [{ items_page: { items, cursor } }] },
});

const simpleRules = [
	['is_empty', 'ignored', '""'],
	['is_not_empty', 'ignored', '""'],
	['between', '[1,2]', '[1,2]'],
	['between', 'a, b', '["a","b"]'],
	['any_of', '[1,2]', '[1,2]'],
	['any_of', '1', '["1"]'],
	['not_any_of', 'a, b', '["a","b"]'],
	['contains_text', 'hello', '"hello"'],
];
const advancedRules = [
	['is_empty', '', '""', 'is_empty'],
	['between', '["1/2/2026","2/3/2026"]', '["EXACT","2026-01-02","EXACT","2026-02-03"]', 'between'],
	['between', '1/2/2026,2/3/2026', '["EXACT","2026-01-02","EXACT","2026-02-03"]', 'between'],
	['between', '[1,2]', '[1,2]', 'between'],
	['between', '[1]', '[1]', 'between'],
	['between', 'a,b', '["a","b"]', 'between'],
	['within_the_next', '{"days":3}', '{"days":3}', 'within_the_next'],
	['within_the_last', '3 days', '{"days":3}', 'within_the_last'],
	['within_the_next', 'unknown', '{"days":7}', 'within_the_next'],
	['greater_than', '1/2/2026', '2026-01-02', 'greater_than'],
	['lower_than', '2026-01-02', '2026-01-02', 'lower_than'],
	['greater_than_or_equals', '5', '5', 'greater_than_or_equals'],
	['equals', '["1/2/2026","2/3/2026"]', '["EXACT","2026-01-02","EXACT","2026-02-03"]', 'between'],
	['equals', '1/2/2026,2/3/2026', '["EXACT","2026-01-02","EXACT","2026-02-03"]', 'between'],
	['equals', '2026-01-02,2026-02-03', '["EXACT","2026-01-02","EXACT","2026-02-03"]', 'between'],
	['equals', '[1,2]', '[1,2]', 'between'],
	['equals', '[1]', '[1]', 'between'],
	['equals', 'a,b', '["a","b"]', 'between'],
	['equals', '1/2/2026', '["EXACT","2026-01-02"]', 'any_of'],
	['equals', '2026-01-02', '["EXACT","2026-01-02"]', 'any_of'],
	['equals', '5', '5', 'equals'],
	['equals', '["EXACT","2026-01-02"]', '["EXACT","2026-01-02"]', 'any_of'],
	[
		'any_of',
		'1/2/2026,2026-02-03,other',
		'["EXACT","2026-01-02","EXACT","2026-02-03","EXACT","other"]',
		'any_of',
	],
	['any_of', '1/2/2026', '["EXACT","2026-01-02"]', 'any_of'],
	['not_any_of', '2026-01-02', '["EXACT","2026-01-02"]', 'not_any_of'],
	['any_of', '[1]', '[1]', 'any_of'],
	['not_any_of', '1', '["1"]', 'not_any_of'],
	['any_of', 'label', '["label"]', 'any_of'],
	['contains_text', '1/2/2026', '["EXACT","2026-01-02"]', 'contains_text'],
	['contains_text', '2026-01-02', '["EXACT","2026-01-02"]', 'contains_text'],
	['contains_text', '"hello"', '"hello"', 'contains_text'],
];

describe.each(['searchItems', 'searchItemsAdvanced'])('%s', (operation) => {
	const advanced = operation === 'searchItemsAdvanced';
	function setup(extra: Record<string, unknown> = {}) {
		return createMockContext({ params: { resource: 'item', operation, boardId: '42', ...extra } });
	}
	it.each(advanced ? advancedRules : simpleRules.map((row) => [...row, row[0]]))(
		'encodes %s filter %s',
		async (operator, compareValue, expected, actualOperator) => {
			const mock = setup({
				[advanced ? 'advancedFilterRules' : 'filterRules']: {
					rule: [{ columnId: 'field', operator, compareValue, compareAttribute: 'START_DATE' }],
				},
			});
			mock.request.mockResolvedValue(jsonResponse(page()));
			await node.execute.call(mock.asExecute());
			const query = squash(requestedQuery(mock.request, advanced ? 1 : 0));
			expect(query).toContain(
				`compare_value: ${expected}, operator: ${actualOperator || operator}`,
			);
			expect(query).toContain('column_id: "field"');
			if (advanced) expect(query).toContain('compare_attribute: "START_DATE"');
		},
	);
	it.each([false, true])('formats results with column values enabled=%s', async (fetch) => {
		const mock = setup({
			fetchColumnValues: fetch,
			fetchColumnValuesAdvanced: fetch,
			cursor: 'previous',
			searchTerm: 'Ship',
			logicalOperator: 'and',
			logicalOperatorAdvanced: 'or',
			sortOptions: { sortBy: [{ columnId: 'name', direction: 'asc' }] },
			advancedSortOptions: { sortBy: [{ columnId: 'name', direction: 'desc' }] },
		});
		const columns = [
			{ id: 'text', type: 'text', value: '"Hello"', text: 'Hello' },
			{
				id: 'mirror',
				type: 'mirror',
				value: null,
				text: '',
				display_value: 'Ready',
				linked_item_ids: ['8'],
				mirrored_items: [{ linked_board_id: '9' }],
			},
			...['subtasks', 'formula', 'auto_number', 'creation_log', 'last_updated'].map((type) => ({
				id: type,
				type,
				value: null,
				text: '',
			})),
		];
		mock.request.mockResolvedValue(
			jsonResponse(
				page([{ id: '51', name: 'Ship', column_values: columns }, { id: '52' }], 'next'),
			),
		);
		const result = await node.execute.call(mock.asExecute());
		const output = result?.[0][0].json;
		const items = advanced ? output.items : output;
		expect(items[0].id).toBe('51');
		if (fetch) {
			expect(items[0].column_values.text).toEqual({ type: 'text', value: 'Hello', text: 'Hello' });
			expect(Object.keys(items[0].column_values)).toEqual(['text', 'mirror']);
			expect(items[1].column_values).toEqual({});
		} else expect(items[0].column_values).toBeUndefined();
		const query = squash(requestedQuery(mock.request, advanced ? 1 : 0));
		expect(query).toContain('order_by: [{ column_id: "name", direction:');
		if (advanced) {
			expect(output.pagination).toEqual({ nextCursor: 'next', hasMore: true, totalReturned: 2 });
			expect(query).toContain('cursor: "previous"');
			expect(query).toContain('search_term: "Ship"');
			if (fetch)
				expect(items[0].column_values.mirror).toMatchObject({
					display_value: 'Ready',
					linked_item_ids: ['8'],
					mirrored_items: [{ linked_board_id: '9' }],
				});
		}
	});
	it('handles absent search data', async () => {
		const mock = setup();
		mock.request.mockResolvedValue('{}');
		const result = await node.execute.call(mock.asExecute());
		expect(result).toEqual([
			[{ json: advanced ? { items: [], pagination: { hasMore: false, totalReturned: 0 } } : [] }],
		]);
	});
});

it.each(['', ' ', ', ,', ' text, status, '])(
	'searchItems selects columns %j',
	async (columnIds) => {
		const mock = createMockContext({
			params: {
				resource: 'item',
				operation: 'searchItems',
				boardId: '42',
				fetchColumnValues: true,
				fetchAllColumns: false,
				columnIds,
			},
		});
		mock.request.mockResolvedValueOnce(jsonResponse(page()));
		await node.execute.call(mock.asExecute());
		if (columnIds.includes('text'))
			expect(requestedQuery(mock.request)).toContain('column_values(ids: ["text", "status"])');
		else expect(requestedQuery(mock.request)).not.toContain('column_values');
	},
);
