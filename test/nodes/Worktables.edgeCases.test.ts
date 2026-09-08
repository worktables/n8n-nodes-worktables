import { Worktables } from '../../nodes/Worktables/Worktables.node';
import { createMockContext, jsonResponse } from '../helpers/mockContext';
const node = new Worktables();

it.each(['item', 'update'])('rejects unsupported %s operations', async (resource) => {
	const mock = createMockContext({ params: { resource, operation: 'invalid' } });
	await expect(node.execute.call(mock.asExecute())).rejects.toThrow(
		'Unsupported operation: invalid',
	);
});
it('rejects null execution credentials', async () => {
	const mock = createMockContext({ credentials: null });
	await expect(node.execute.call(mock.asExecute())).rejects.toThrow('API Key not found');
});
it('rejects credentials removed before listing boards', async () => {
	const mock = createMockContext({ params: { resource: 'board', operation: 'listBoards' } });
	mock.context.getCredentials.mockResolvedValueOnce({ apiKey: 'test' }).mockResolvedValueOnce(null);
	await expect(node.execute.call(mock.asExecute())).rejects.toThrow('API Key not found');
});
it('rejects missing credentials for status labels', async () => {
	const mock = createMockContext({
		credentials: null,
		params: {
			boardId: '42',
			columnValues: { column: [{ columnId: 'status', columnType: 'status' }] },
		},
	});
	await expect(
		node.methods.loadOptions.getAllLabelStatus.call(mock.asLoadOptions()),
	).rejects.toThrow('API Key not found');
});
it('getItemActivityLogs requires an item ID', async () => {
	const mock = createMockContext({
		params: { resource: 'item', operation: 'getItemActivityLogs', itemId: '' },
	});
	await expect(node.execute.call(mock.asExecute())).rejects.toThrow('Item ID is required');
});
it.each([{}, { data: {} }, { data: { items: [] } }])(
	'getItemActivityLogs returns no logs for absent items: %j',
	async (payload) => {
		const mock = createMockContext({
			params: { resource: 'item', operation: 'getItemActivityLogs', itemId: '51' },
		});
		mock.request.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
			[{ json: { item_id: '51', activity_logs: [] } }],
		]);
	},
);
it('getItemActivityLogs propagates log query errors', async () => {
	const mock = createMockContext({
		params: { resource: 'item', operation: 'getItemActivityLogs', itemId: '51' },
	});
	mock.request
		.mockResolvedValueOnce(jsonResponse({ data: { items: [{ id: '51', board: { id: '42' } }] } }))
		.mockResolvedValueOnce({ errors: [{ message: 'Denied' }] });
	await expect(node.execute.call(mock.asExecute())).rejects.toThrow('Denied');
});

// The legacy operation contains only a break and reaches the response parser with no response.
it('updateColumnValues reports failure without sending a mutation', async () => {
	const mock = createMockContext({ params: { resource: 'item', operation: 'updateColumnValues' } });
	await expect(node.execute.call(mock.asExecute())).rejects.toThrow(SyntaxError);
	expect(mock.request).not.toHaveBeenCalled();
});

it.each(['getColumnsItemsForIdentifier', 'getColumnsItemsForCreateOrUpdate'] as const)(
	'%s tolerates absent parent response data',
	async (method) => {
		for (const payload of [
			null,
			{},
			{ data: {} },
			{ data: { items: [{}] } },
			{ data: { items: [{ subitems: [{}] }] } },
		]) {
			const mock = createMockContext({
				params: { boardId: '42', isSubitem: true, parentId: '51' },
			});
			mock.request
				.mockResolvedValueOnce(jsonResponse(payload))
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [] } }));
			await expect(node.methods.loadOptions[method].call(mock.asLoadOptions())).resolves.toEqual(
				[],
			);
			expect(mock.request).toHaveBeenCalledTimes(2);
		}
	},
);

it.each(['listBoardItems', 'listGroupItems'])(
	'%s tolerates absent board response data',
	async (operation) => {
		for (const payload of [null, {}, { data: {} }]) {
			const mock = createMockContext({
				params: { resource: 'item', operation, boardId: '42', groupId: 'topics', limit: 0 },
			});
			mock.request.mockResolvedValueOnce(jsonResponse(payload));
			await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[]]);
		}
	},
);

it.each(['listUpdates', 'pinUpdate', 'createItem', 'listTeams'])(
	'%s uses the fallback message for errors without a message',
	async (operation) => {
		for (const continueOnFail of [true, false]) {
			const mock = createMockContext({
				params: {
					resource:
						operation === 'createItem' ? 'item' : operation === 'listTeams' ? 'team' : 'update',
					operation,
					itemId: '51',
					updateId: '70',
					boardId: '42',
					itemName: 'Task',
					columnValues: { column: [] },
				},
				continueOnFail,
			});
			if (operation === 'createItem')
				mock.request.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Board' }] } }));
			mock.request.mockResolvedValueOnce(jsonResponse({ errors: [{}] }));
			const run = node.execute.call(mock.asExecute());
			if (continueOnFail)
				await expect(run).resolves.toEqual([
					[{ json: { error: { message: 'Unknown error', details: {} } } }],
				]);
			else
				await expect(run).rejects.toThrow(
					operation === 'listUpdates' ? 'Failed to list updates' : 'Unknown error',
				);
		}
	},
);

it.each([{ data: { items: [{}] } }, {}, { data: {} }, { data: { items: [] } }])(
	'listUpdates handles absent updates: %j',
	async (payload) => {
		const mock = createMockContext({
			params: { resource: 'update', operation: 'listUpdates', itemId: '51' },
		});
		mock.request.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[]]);
	},
);

it.each([{}, { data: {} }, { data: { items: [] } }])(
	'getItem returns no output for absent item data: %j',
	async (payload) => {
		const mock = createMockContext({
			params: { resource: 'item', operation: 'getItem', itemId: '51' },
		});
		mock.request.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[]]);
	},
);
it('getItem formats relatives without column values', async () => {
	const mock = createMockContext({
		params: { resource: 'item', operation: 'getItem', itemId: '51', columnIds: '' },
	});
	mock.request.mockResolvedValueOnce(
		jsonResponse({
			data: {
				items: [{ id: '51', group: {}, subitems: [{ id: '52' }], parent_item: { id: '50' } }],
			},
		}),
	);
	const result = await node.execute.call(mock.asExecute());
	expect(result?.[0][0].json).toMatchObject({
		id: '51',
		column_values: {},
		subitems: [{ id: '52', column_values: {} }],
		parent_item: { id: '50', column_values: {} },
	});
});
it.each([null, {}, { data: {} }, { data: { change_multiple_column_values: null } }])(
	'updateItem handles absent mutation data: %j',
	async (payload) => {
		const mock = createMockContext({
			params: {
				resource: 'item',
				operation: 'updateItem',
				itemId: '51',
				boardId: '42',
				columnValues: {},
			},
		});
		mock.request.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
			[{ json: { column_values: {} } }],
		]);
	},
);
it.each(['cursor', 'page'])(
	'query %s pagination stops on absent response data',
	async (paginationType) => {
		for (const payload of [
			null,
			{},
			{ data: {} },
			{ data: { boards: [] } },
			{ data: { boards: [{}] } },
		]) {
			const mock = createMockContext({
				params: {
					resource: 'query',
					operation: 'query',
					runQuery: '{ boards(page: 1) { items_page(limit: 100) { items { id } cursor } } }',
					includePagination: true,
					paginationType,
				},
			});
			// A boards array is itself a result page in page pagination; terminate with an empty page.
			mock.request.mockResolvedValueOnce(payload).mockResolvedValueOnce({ data: { boards: [] } });
			const result = await node.execute.call(mock.asExecute());
			expect(result?.[0][0].json.totalCount).toBe(
				paginationType === 'page' &&
					payload?.data &&
					'boards' in payload.data &&
					payload.data.boards?.length
					? 1
					: 0,
			);
		}
	},
);
it.each([{}, { data: {} }, { data: { assets: [] } }])(
	'downloadFile rejects absent asset data: %j',
	async (payload) => {
		const mock = createMockContext({ params: { resource: 'downloadFile', fileId: '8' } });
		mock.request.mockResolvedValueOnce(payload);
		await expect(node.execute.call(mock.asExecute())).rejects.toThrow('Public URL not found');
	},
);
it.each(['searchItems', 'searchItemsAdvanced'])(
	'%s handles absent sort collections and response',
	async (operation) => {
		const mock = createMockContext({
			params: {
				resource: 'item',
				operation,
				boardId: '42',
				sortOptions: null,
				advancedSortOptions: null,
			},
		});
		mock.request.mockResolvedValue('null');
		const result = await node.execute.call(mock.asExecute());
		expect(result?.[0][0].json).toEqual(
			operation === 'searchItems'
				? []
				: { items: [], pagination: { hasMore: false, totalReturned: 0 } },
		);
	},
);
