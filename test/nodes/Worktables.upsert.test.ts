import { Worktables } from '../../nodes/Worktables/Worktables.node';
import { createMockContext, jsonResponse, requestedQuery, squash } from '../helpers/mockContext';
const node = new Worktables();
const params = {
	resource: 'item',
	operation: 'createOrUpdateItem',
	boardId: '42',
	itemName: 'New task',
	isSubitem: false,
	columnValues: { column: [] },
};
const boardItems = (items: unknown[]) => ({ data: { boards: [{ items_page: { items } }] } });
const updated = {
	data: {
		change_multiple_column_values: { id: '51', url: 'https://example.com/51', board: { id: '42' } },
	},
};

describe('createOrUpdateItem', () => {
	it.each([false, true])(
		'creates when no identifier is provided, subitem=%s',
		async (isSubitem) => {
			const mock = createMockContext({
				params: { ...params, isSubitem, parentId: '50', groupName: 'ready' },
			});
			mock.request.mockResolvedValueOnce(
				jsonResponse({
					data: {
						[isSubitem ? 'create_subitem' : 'create_item']: {
							id: '51',
							name: 'Created',
							url: 'url',
							board: { id: '99' },
						},
					},
				}),
			);
			const result = await node.execute.call(mock.asExecute());
			expect(result?.[0][0].json).toEqual({
				id: '51',
				name: 'Created',
				url: 'url',
				operation: 'create',
				board_id: '99',
				column_values: {},
				...(isSubitem ? { parent_item: { id: '50' } } : {}),
			});
			expect(squash(requestedQuery(mock.request))).toContain(
				isSubitem
					? 'create_subitem( parent_item_id: 50'
					: 'create_item( board_id: 42, group_id: "ready"',
			);
			expect(mock.request).toHaveBeenCalledTimes(1);
		},
	);

	describe.each([false, true])('matching with parent subitem=%s', (isSubitem) => {
		it.each(['name', 'Name', 'text', 'status', 'board_relation', 'mirror'])(
			'matches %s exactly and ignores partial matches',
			async (type) => {
				const identifierColumn = type === 'Name' || type === 'name' ? type : 'key';
				const mock = createMockContext({
					params: {
						...params,
						isSubitem,
						parentId: '50',
						identifierColumn,
						itemIdOptional: ' Ready now ',
					},
				});
				const isName = type.toLowerCase() === 'name';
				if (!isName)
					mock.request.mockResolvedValueOnce(
						jsonResponse({ data: { boards: [{ columns: [{ type }] }] } }),
					);
				const candidates = [
					{ id: 'no-name' },
					{
						id: 'partial',
						name: 'Ready now later',
						column_values: [
							{ id: 'other', text: 'Ready now' },
							{ id: 'key', type, text: '', display_value: '' },
						],
					},
					{
						id: '51',
						name: 'READY NOW',
						board: { id: '99' },
						column_values: [
							{
								id: 'key',
								type,
								text: type === 'status' ? 'READY   NOW' : 'READY NOW',
								display_value: 'READY NOW',
							},
						],
					},
				];
				mock.request
					.mockResolvedValueOnce(
						jsonResponse(
							isSubitem ? { data: { items: [{ subitems: candidates }] } } : boardItems(candidates),
						),
					)
					.mockResolvedValueOnce(jsonResponse(updated));
				await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
					[
						{
							json: {
								id: '51',
								url: 'https://example.com/51',
								operation: 'update',
								board_id: '42',
								column_values: {},
							},
						},
					],
				]);
				const mutationIndex = isName ? 1 : 2;
				expect(squash(requestedQuery(mock.request, mutationIndex))).toContain(
					`board_id: ${isSubitem ? '99' : '42'}, item_id: "51"`,
				);
				expect(mock.request).toHaveBeenCalledTimes(mutationIndex + 1);
				if (!isSubitem)
					expect(requestedQuery(mock.request, isName ? 0 : 1)).toContain(
						`operator: ${type === 'status' ? 'contains_terms' : 'contains_text'}`,
					);
			},
		);

		it('creates after no exact match and uses response fallbacks', async () => {
			const mock = createMockContext({
				params: {
					...params,
					isSubitem,
					parentId: '50',
					identifierColumn: 'name',
					itemIdOptional: 'Missing',
				},
			});
			mock.request
				.mockResolvedValueOnce(
					jsonResponse(
						isSubitem
							? { data: { items: [{ subitems: [{ id: '1', name: 'partial' }] }] } }
							: boardItems([{ id: '1', name: 'partial' }]),
					),
				)
				.mockResolvedValueOnce(
					jsonResponse({ data: { [isSubitem ? 'create_subitem' : 'create_item']: { id: '51' } } }),
				);
			const result = await node.execute.call(mock.asExecute());
			expect(result?.[0][0].json).toMatchObject({
				id: '51',
				name: 'New task',
				url: '',
				board_id: '42',
				operation: 'create',
			});
			if (!isSubitem) expect(requestedQuery(mock.request, 1)).toContain('group_id: "topics"');
		});
	});

	it.each(['discovered', 'missing-board', 'empty', 'failed'])(
		'discovers subitem board without a parent: %s',
		async (mode) => {
			const mock = createMockContext({
				params: { ...params, isSubitem: true, identifierColumn: 'name', itemIdOptional: 'Task' },
			});
			if (mode === 'failed') mock.request.mockRejectedValueOnce(new Error('Unavailable'));
			else
				mock.request.mockResolvedValueOnce(
					jsonResponse(
						mode === 'empty'
							? {}
							: boardItems([{ subitems: [mode === 'discovered' ? { board: { id: '99' } } : {}] }]),
					),
				);
			mock.request
				.mockResolvedValueOnce(jsonResponse(boardItems([{ id: '51', name: 'Task' }])))
				.mockResolvedValueOnce(
					jsonResponse({ data: { change_multiple_column_values: { id: '51' } } }),
				);
			await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
				[{ json: { id: '51', url: '', operation: 'update', board_id: '42', column_values: {} } }],
			]);
			expect(requestedQuery(mock.request, 1)).toContain(
				`boards(ids: [${mode === 'discovered' ? '99' : '42'}])`,
			);
		},
	);

	it('uses the main board when matched subitem lacks board metadata', async () => {
		const mock = createMockContext({
			params: {
				...params,
				isSubitem: true,
				parentId: '50',
				identifierColumn: 'name',
				itemIdOptional: 'Task',
			},
		});
		mock.request
			.mockResolvedValueOnce(
				jsonResponse({ data: { items: [{ subitems: [{ id: '51', name: 'Task' }] }] } }),
			)
			.mockResolvedValueOnce(jsonResponse(updated));
		await node.execute.call(mock.asExecute());
		expect(requestedQuery(mock.request, 1)).toContain('board_id: 42');
	});

	it.each(['failed', 'empty'])(
		'falls back to text search when column lookup is %s',
		async (mode) => {
			const mock = createMockContext({
				params: { ...params, identifierColumn: 'key', itemIdOptional: 'Ready' },
			});
			if (mode === 'failed') mock.request.mockRejectedValueOnce(new Error('Unavailable'));
			else mock.request.mockResolvedValueOnce('{}');
			mock.request
				.mockResolvedValueOnce(
					jsonResponse(boardItems([{ id: '51', column_values: [{ id: 'key', text: 'Ready' }] }])),
				)
				.mockResolvedValueOnce(jsonResponse(updated));
			await node.execute.call(mock.asExecute());
			expect(requestedQuery(mock.request, 1)).toContain('operator: contains_text');
		},
	);

	it.each([
		{ errors: [{ message: 'Denied' }, { code: 'OTHER' }] },
		{},
		{ data: {} },
		{ data: { change_multiple_column_values: {} } },
	])('does not create a duplicate when updating a match fails: %j', async (payload) => {
		const mock = createMockContext({
			params: { ...params, identifierColumn: 'name', itemIdOptional: 'Task' },
		});
		mock.request
			.mockResolvedValueOnce(jsonResponse(boardItems([{ id: '51', name: 'Task' }])))
			.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).rejects.toThrow(
			/Item found \(ID: 51\) but update failed/,
		);
		expect(mock.request).toHaveBeenCalledTimes(2);
	});

	it.each([false, true])('reports creation failures for subitem=%s', async (isSubitem) => {
		for (const payload of [
			{ errors: [{ message: 'Denied' }] },
			{},
			{ data: { create_item: {}, create_subitem: {} } },
		]) {
			const mock = createMockContext({ params: { ...params, isSubitem, parentId: '50' } });
			mock.request.mockResolvedValueOnce(jsonResponse(payload));
			await expect(node.execute.call(mock.asExecute())).rejects.toThrow(
				`Error creating ${isSubitem ? 'subitem' : 'item'}`,
			);
		}
	});

	it('requires a parent to create a subitem', async () => {
		const mock = createMockContext({ params: { ...params, isSubitem: true } });
		await expect(node.execute.call(mock.asExecute())).rejects.toThrow('Parent Item is required');
		expect(mock.request).not.toHaveBeenCalled();
	});
});

it.each([false, true])(
	'createOrUpdateItem creates on missing search data, subitem=%s',
	async (isSubitem) => {
		for (const payload of [
			null,
			{},
			{ data: {} },
			{ data: { boards: [] } },
			{ data: { boards: [{}] } },
		]) {
			const mock = createMockContext({
				params: {
					...params,
					isSubitem,
					parentId: '50',
					identifierColumn: 'name',
					itemIdOptional: 'Task',
				},
			});
			mock.request
				.mockResolvedValueOnce(jsonResponse(payload))
				.mockResolvedValueOnce(
					jsonResponse({ data: { [isSubitem ? 'create_subitem' : 'create_item']: { id: '51' } } }),
				);
			const result = await node.execute.call(mock.asExecute());
			expect(result?.[0][0].json).toMatchObject({ id: '51', operation: 'create' });
			expect(mock.request).toHaveBeenCalledTimes(2);
		}
	},
);
