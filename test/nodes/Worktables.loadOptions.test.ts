import { NodeApiError } from 'n8n-workflow';
import { Worktables } from '../../nodes/Worktables/Worktables.node';
import { createMockContext, jsonResponse, requestedQuery, squash, TEST_API_KEY } from '../helpers/mockContext';

const node = new Worktables();
const load = node.methods.loadOptions;

describe('Worktables loadOptions', () => {
	describe('getWorkspaces', () => {
		it('throws when no API key is configured', async () => {
			const mock = createMockContext({ credentials: {} });
			await expect(load.getWorkspaces.call(mock.asLoadOptions())).rejects.toThrow(NodeApiError);
		});

		it('paginates until an empty page, sorts by name and prepends Main Workspace', async () => {
			const mock = createMockContext();
			mock.request
				.mockResolvedValueOnce(
					jsonResponse({
						data: {
							workspaces: [
								{ id: '2', name: 'Zeta' },
								{ id: '-1', name: 'Main workspace from API' },
							],
						},
					}),
				)
				.mockResolvedValueOnce(jsonResponse({ data: { workspaces: [{ id: '3', name: 'Alpha' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { workspaces: [] } }));

			const result = await load.getWorkspaces.call(mock.asLoadOptions());

			expect(mock.request).toHaveBeenCalledTimes(3);
			expect(requestedQuery(mock.request, 0)).toContain('page: 1');
			expect(requestedQuery(mock.request, 1)).toContain('page: 2');
			expect(requestedQuery(mock.request, 2)).toContain('page: 3');
			expect(mock.request.mock.calls[0][0].headers.Authorization).toBe(`Bearer ${TEST_API_KEY}`);
			expect(result).toEqual([
				{ name: 'Main Workspace', value: '-1' },
				{ name: 'Alpha', value: '3' },
				{ name: 'Zeta', value: '2' },
			]);
		});
	});

	describe('getBoards', () => {
		it('keeps only boards and sub-item boards, sorted by name', async () => {
			const mock = createMockContext({ params: { workspace: '-1', boardKind: 'all', orderBy: 'none', state: '' } });
			mock.request.mockResolvedValueOnce(
				jsonResponse({
					data: {
						boards: [
							{ id: '1', name: 'Zulu', type: 'board' },
							{ id: '2', name: 'Doc', type: 'document' },
							{ id: '3', name: 'Alpha subitems', type: 'sub_items_board' },
						],
					},
				}),
			);

			const result = await load.getBoards.call(mock.asLoadOptions());

			expect(result).toEqual([
				{ name: 'Alpha subitems', value: '3' },
				{ name: 'Zulu', value: '1' },
			]);
			const query = squash(requestedQuery(mock.request));
			expect(query).toContain('state: active');
			expect(query).not.toContain('order_by');
			expect(query).not.toContain('board_kind');
		});

		it('applies the order and kind filters and paginates full pages', async () => {
			const mock = createMockContext({
				params: { workspace: '-1', boardKind: 'private', orderBy: 'used_at', state: 'archived' },
			});
			const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: String(i), name: `B${i}`, type: 'board' }));
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: fullPage } }))
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ id: 'x', name: 'Last', type: 'board' }] } }));

			const result = await load.getBoards.call(mock.asLoadOptions());

			expect(mock.request).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(101);
			const query = squash(requestedQuery(mock.request));
			expect(query).toContain('state: archived');
			expect(query).toContain(', order_by: used_at');
			expect(query).toContain(', board_kind: private');
			expect(requestedQuery(mock.request, 1)).toContain('page: 2');
		});
	});

	describe('getGroupsFromBoard', () => {
		it('requires a board id', async () => {
			const mock = createMockContext({ params: {} });
			await expect(load.getGroupsFromBoard.call(mock.asLoadOptions())).rejects.toThrow(/Board ID is required/);
		});

		it('maps groups to options', async () => {
			const mock = createMockContext({ params: { boardId: '777' } });
			mock.request.mockResolvedValueOnce(
				jsonResponse({
					data: { boards: [{ groups: [{ id: 'topics', title: 'Topics' }, { id: 'done', title: 'Done' }] }] },
				}),
			);

			const result = await load.getGroupsFromBoard.call(mock.asLoadOptions());

			expect(squash(requestedQuery(mock.request))).toContain('boards(ids: 777 )');
			expect(result).toEqual([
				{ name: 'Topics', value: 'topics' },
				{ name: 'Done', value: 'done' },
			]);
		});
	});

	describe('getUsers', () => {
		it('paginates users until an empty page', async () => {
			const mock = createMockContext();
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { users: [{ id: '1', name: 'Ana' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { users: [] } }));

			const result = await load.getUsers.call(mock.asLoadOptions());

			expect(result).toEqual([{ name: 'Ana', value: '1' }]);
			expect(mock.request).toHaveBeenCalledTimes(2);
		});
	});

	describe('getTeams', () => {
		it('maps teams to options', async () => {
			const mock = createMockContext();
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { teams: [{ id: '9', name: 'Engineering' }] } }));

			const result = await load.getTeams.call(mock.asLoadOptions());

			expect(result).toEqual([{ name: 'Engineering', value: '9' }]);
		});

		it('throws when no API key is configured', async () => {
			const mock = createMockContext({ credentials: null });
			await expect(load.getTeams.call(mock.asLoadOptions())).rejects.toThrow(/API Key not found/);
		});
	});
});
