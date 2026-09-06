import { Worktables } from '../../nodes/Worktables/Worktables.node';
import { createMockContext, jsonResponse, requestedQuery, squash } from '../helpers/mockContext';
const node = new Worktables();
const base = { resource: 'board', boardId: '42' };

describe('board mutations', () => {
	it.each(['-1', '9'])('duplicates a board with folder %s', async (folder) => {
		const mock = createMockContext({
			params: {
				...base,
				operation: 'duplicateBoard',
				folder,
				workspace: '7',
				duplicateType: 'duplicate_board_with_structure',
				boardName: 'Copy',
				keepSubscribers: true,
			},
		});
		const payload = { data: { duplicate_board: { board: { id: '43', name: 'Copy' } } } };
		mock.request.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[{ json: payload }]]);
		const query = squash(requestedQuery(mock.request));
		expect(query).toContain(
			'duplicate_board(board_id: 42, workspace_id: 7, duplicate_type: duplicate_board_with_structure, board_name: "Copy", keep_subscribers: true',
		);
		if (folder === '-1') expect(query).not.toContain('folder_id');
		else expect(query).toContain('folder_id: 9');
	});
	it.each([false, true])('duplicates a group with addToTop=%s', async (addToTop) => {
		const mock = createMockContext({
			params: {
				...base,
				operation: 'duplicateGroup',
				groupId: 'topics',
				groupName: 'Copy',
				addToTop,
			},
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { duplicate_group: { id: 'copy' } } }));
		await node.execute.call(mock.asExecute());
		expect(squash(requestedQuery(mock.request))).toContain(
			'duplicate_group(board_id: 42, group_id: "topics", group_title: "Copy"',
		);
		expect(requestedQuery(mock.request).includes('add_to_top: true')).toBe(addToTop);
	});
	it.each(['duplicateBoard', 'duplicateGroup', 'addBoardSubscribers'])(
		'%s requires board ID',
		async (operation) => {
			const mock = createMockContext({ params: { ...base, operation, boardId: '' } });
			await expect(node.execute.call(mock.asExecute())).rejects.toThrow(/required/);
			expect(mock.request).not.toHaveBeenCalled();
		},
	);
	it('adds owners and subscribers separately for users and teams', async () => {
		const mock = createMockContext({
			params: {
				...base,
				operation: 'addBoardSubscribers',
				usersBoardIds: {
					usersBoardIds: [
						{ userId: '1', isOwner: true },
						{ userId: '2', isOwner: false },
					],
				},
				teamBoardIds: {
					teamBoardIds: [
						{ teamId: '3', isOwner: true },
						{ teamId: '4', isOwner: false },
					],
				},
			},
		});
		const responses = ['1', '2', '3', '4'].map((id) =>
			jsonResponse({ data: { subscribers: [{ id }] } }),
		);
		responses.forEach((r) => mock.request.mockResolvedValueOnce(r));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
			[
				{
					json: {
						boardId: '42',
						ownerUsers: responses[0],
						subscriberUsers: responses[1],
						ownerTeams: responses[2],
						subscriberTeams: responses[3],
					},
				},
			],
		]);
		[
			'user_ids: [1], kind: owner',
			'user_ids: [2], kind: subscriber',
			'team_ids: [3], kind: owner',
			'team_ids: [4], kind: subscriber',
		].forEach((fragment, index) =>
			expect(squash(requestedQuery(mock.request, index))).toContain(fragment),
		);
	});
	it.each([{}, { usersBoardIds: { usersBoardIds: [] }, teamBoardIds: { teamBoardIds: [] } }])(
		'skips empty subscriber collections: %j',
		async (fields) => {
			const mock = createMockContext({
				params: { ...base, operation: 'addBoardSubscribers', ...fields },
			});
			await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
				[
					{
						json: {
							boardId: '42',
							ownerUsers: [],
							subscriberUsers: [],
							ownerTeams: [],
							subscriberTeams: [],
						},
					},
				],
			]);
			expect(mock.request).not.toHaveBeenCalled();
		},
	);
	it.each([
		['board', 'listBoardSubscribers', 'boards(ids: [42])'],
		['board', 'removeBoardSubscribers', 'user_ids: [1,2]'],
		['item', 'listItemSubscribers', 'items (ids: ["51"])'],
	])('%s %s targets the selected IDs', async (resource, operation, fragment) => {
		const mock = createMockContext({
			params: { ...base, resource, operation, itemId: '51', removeSubscribers: '1,2' },
		});
		const payload = { data: { subscribers: [{ id: '1' }] } };
		mock.request.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[{ json: payload }]]);
		expect(squash(requestedQuery(mock.request))).toContain(fragment);
	});
});

describe('board listing', () => {
	it.each([false, true])(
		'applies optional workspace and ordering filters: %s',
		async (filtered) => {
			const mock = createMockContext({
				params: {
					...base,
					operation: 'listBoards',
					filterByWorkspace: filtered,
					workspace: '7',
					limit: 10,
					boardKind: filtered ? 'private' : 'all',
					orderBy: filtered ? 'used_at' : 'none',
					state: 'active',
					requestTimeout: filtered ? 5000 : 0,
				},
			});
			mock.request.mockResolvedValueOnce(
				jsonResponse({
					data: {
						boards: [
							{ id: '2', name: 'Zulu', items_count: 3 },
							{ id: '1', name: 'Alpha', board_kind: 'private' },
						],
					},
				}),
			);
			const result = await node.execute.call(mock.asExecute());
			expect(result?.[0]).toMatchObject([
				{ json: { name: 'Alpha', value: '1', boardKind: 'private' } },
				{ json: { name: 'Zulu', value: '2', itemsCount: 3 } },
			]);
			const query = requestedQuery(mock.request);
			expect(query.includes('workspace_ids: "7"')).toBe(filtered);
			expect(query.includes('order_by: used_at')).toBe(filtered);
			expect(query.includes('board_kind: private')).toBe(filtered);
			expect(mock.request.mock.calls[0][0].timeout).toBe(filtered ? 5000 : undefined);
		},
	);
	it('paginates all boards', async () => {
		const mock = createMockContext({
			params: {
				...base,
				operation: 'listBoards',
				limit: 0,
				boardKind: 'all',
				orderBy: 'none',
				state: 'active',
			},
		});
		mock.request
			.mockResolvedValueOnce(
				jsonResponse({
					data: {
						boards: Array.from({ length: 100 }, (_, i) => ({ id: String(i), name: `Board ${i}` })),
					},
				}),
			)
			.mockResolvedValueOnce(jsonResponse({ data: { boards: [] } }));
		const result = await node.execute.call(mock.asExecute());
		expect(result?.[0]).toHaveLength(100);
		expect(requestedQuery(mock.request, 1)).toContain('page: 2');
	});
});

describe.each(['listBoardActivityLogs', 'getItemActivityLogs'])('%s', (operation) => {
	const params = {
		...base,
		resource: operation === 'getItemActivityLogs' ? 'item' : 'board',
		operation,
		itemId: '51',
	};
	function setup(extra = {}) {
		const mock = createMockContext({ params: { ...params, ...extra } });
		if (operation === 'getItemActivityLogs')
			mock.request.mockResolvedValueOnce({
				data: { items: [{ id: '51', name: 'Task', board: { id: '42' } }] },
			});
		return mock;
	}
	it.each([0, 100, 101, 50])('paginates with limit %s', async (limit) => {
		const mock = setup({
			limit,
			from: '2026-01-01T00:00:00',
			to: '2026-01-02T00:00:00',
			itemIds: '51, ,52',
			columnIdsFilter: 'text, ,status',
			groupIdsFilter: 'topics, ,done',
			userIdsFilter: ['1', '2'],
		});
		const logs = Array.from({ length: 100 }, (_, id) => ({
			id: String(id),
			data: id === 0 ? '{"value":1}' : id === 1 ? 'plain text' : { value: id },
		}));
		mock.request
			.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ activity_logs: logs }] } }))
			.mockResolvedValueOnce({ data: { boards: [{ activity_logs: [] }] } });
		const result = await node.execute.call(mock.asExecute());
		const output = result?.[0][0].json;
		const resultLogs =
			operation === 'getItemActivityLogs'
				? output.activity_logs
				: output.data.boards[0].activity_logs;
		expect(resultLogs).toHaveLength(limit === 50 ? 50 : 100);
		if (operation === 'getItemActivityLogs') {
			expect(resultLogs[0].data).toEqual({ value: 1 });
			expect(resultLogs[1].data).toBe('plain text');
		}
		const offset = operation === 'getItemActivityLogs' ? 1 : 0;
		expect(requestedQuery(mock.request, offset)).toContain('from: "2026-01-01T00:00:00Z"');
		expect(requestedQuery(mock.request, offset)).toContain('to: "2026-01-02T00:00:00Z"');
		expect(mock.request).toHaveBeenCalledTimes(offset + (limit === 0 || limit === 101 ? 2 : 1));
	});
	it.each([{}, { data: {} }, { data: { boards: [] } }, { data: { boards: [{}] } }])(
		'handles absent log data: %j',
		async (payload) => {
			const mock = setup({ itemIds: ', ,', columnIdsFilter: ', ,', groupIdsFilter: ', ,' });
			mock.request.mockResolvedValueOnce(jsonResponse(payload));
			const result = await node.execute.call(mock.asExecute());
			expect(JSON.stringify(result)).toContain('"activity_logs":[]');
		},
	);
});

it.each([
	[{ errors: [{ message: 'Denied' }] }, 'Denied'],
	[{ data: { items: [{ id: '51' }] } }, 'Could not retrieve board ID'],
])('getItemActivityLogs rejects failed item lookups: %j', async (payload, message) => {
	const mock = createMockContext({
		params: { resource: 'item', operation: 'getItemActivityLogs', itemId: '51' },
	});
	mock.request.mockResolvedValueOnce(jsonResponse(payload));
	await expect(node.execute.call(mock.asExecute())).rejects.toThrow(String(message));
});
