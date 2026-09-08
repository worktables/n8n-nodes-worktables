import type { INodeExecutionData } from 'n8n-workflow';
import { Worktables } from '../../nodes/Worktables/Worktables.node';
import { createMockContext, jsonResponse, requestedQuery } from '../helpers/mockContext';

const node = new Worktables();
const textColumn = { id: 'text', type: 'text', text: 'Ready', value: '"Ready"' };
const ignored = ['subtasks', 'formula', 'auto_number', 'creation_log', 'last_updated'].map(
	(type) => ({ id: type, type, text: '', value: null }),
);
const item = {
	id: '51',
	name: 'Ship',
	board: { id: '42' },
	group: { id: 'topics', title: 'Topics', color: '#fff', position: '1' },
	column_values: [textColumn, ...ignored],
};

describe.each(['listBoardItems', 'listGroupItems'])('%s pagination', (operation) => {
	const params = { resource: 'item', operation, boardId: '42', groupId: 'topics', limit: 0 };
	function page(items: unknown[], cursor: string | null = null) {
		const items_page = { items, cursor };
		return jsonResponse({
			data: {
				boards: [operation === 'listBoardItems' ? { items_page } : { groups: [{ items_page }] }],
			},
		});
	}

	it('follows cursors, formats columns and preserves item order', async () => {
		const mock = createMockContext({ params });
		mock.request
			.mockResolvedValueOnce(page([item], 'next'))
			.mockResolvedValueOnce(page([{ id: '52' }]));
		const result = await node.execute.call(mock.asExecute());
		expect(result?.[0].map((i: INodeExecutionData) => i.json.id)).toEqual(['51', '52']);
		expect(result?.[0][0].json).toMatchObject({
			board: { id: '42' },
			group: item.group,
			column_values: { text: { type: 'text', text: 'Ready', value: 'Ready' } },
		});
		expect(result?.[0][0].json.column_values).toEqual({
			text: { type: 'text', text: 'Ready', value: 'Ready' },
		});
		expect(result?.[0][1].json.column_values).toEqual({});
		expect(mock.request).toHaveBeenCalledTimes(2);
		expect(requestedQuery(mock.request, 1)).toContain('items_page(limit: 100, cursor: "next")');
	});

	it('requests only the remaining count and trims an oversized final page', async () => {
		const mock = createMockContext({ params: { ...params, limit: 101 } });
		mock.request
			.mockResolvedValueOnce(
				page(
					Array.from({ length: 100 }, (_, i) => ({ id: String(i) })),
					'next',
				),
			)
			.mockResolvedValueOnce(page([{ id: '100' }, { id: '101' }], 'unused'));
		const result = await node.execute.call(mock.asExecute());
		expect(result?.[0]).toHaveLength(101);
		expect(result?.[0][100].json.id).toBe('100');
		expect(requestedQuery(mock.request, 1)).toContain('items_page(limit: 1, cursor: "next")');
		expect(mock.request).toHaveBeenCalledTimes(2);
	});

	it.each(['', '   ', ', ,', ' text, status, '])(
		'selects requested columns: %j',
		async (columnIds) => {
			const mock = createMockContext({ params: { ...params, fetchAllColumns: false, columnIds } });
			mock.request.mockResolvedValueOnce(page([]));
			await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[]]);
			const query = requestedQuery(mock.request);
			if (columnIds.includes('text'))
				expect(query).toContain('column_values(ids: ["text", "status"])');
			else expect(query).not.toContain('column_values');
		},
	);

	it('returns no items when the board is absent', async () => {
		const mock = createMockContext({ params });
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { boards: [] } }));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[]]);
	});

	it('rejects a missing board before making a request', async () => {
		const mock = createMockContext({ params: { ...params, boardId: '' } });
		await expect(node.execute.call(mock.asExecute())).rejects.toThrow(/required/);
		expect(mock.request).not.toHaveBeenCalled();
	});
});

it('listBoardItems accepts object responses and formats nested subitems', async () => {
	const mock = createMockContext({
		params: { resource: 'item', operation: 'listBoardItems', boardId: '42', limit: 1 },
	});
	mock.request.mockResolvedValueOnce({
		data: {
			boards: [
				{
					items_page: {
						items: [
							{
								...item,
								subitems: [
									{ id: '60', board: { id: '99' }, column_values: [textColumn, ...ignored] },
									{ id: '61' },
								],
							},
						],
					},
				},
			],
		},
	});
	const result = await node.execute.call(mock.asExecute());
	expect(result?.[0][0].json.subitems).toEqual([
		expect.objectContaining({
			id: '60',
			board: { id: '99' },
			column_values: { text: { type: 'text', text: 'Ready', value: 'Ready' } },
		}),
		expect.objectContaining({ id: '61', column_values: {} }),
	]);
});
