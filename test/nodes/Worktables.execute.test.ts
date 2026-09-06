import { NodeApiError } from 'n8n-workflow';
import { Worktables } from '../../nodes/Worktables/Worktables.node';
import {
	createMockContext,
	jsonResponse,
	requestedQuery,
	requestedVariables,
	squash,
	TEST_API_KEY,
	MockContextOptions,
} from '../helpers/mockContext';

const node = new Worktables();

function execute(options: MockContextOptions) {
	const mock = createMockContext(options);
	return { mock, run: () => node.execute.call(mock.asExecute()) };
}

describe('Worktables.execute', () => {
	describe('guards and error handling', () => {
		it('throws when the credential has no API key', async () => {
			const { run } = execute({ credentials: {}, params: { resource: 'team', operation: 'listTeams' } });
			await expect(run()).rejects.toThrow(/API Key not found/);
		});

		it('throws for an unsupported resource', async () => {
			const { run } = execute({ params: { resource: 'nope', operation: 'x' } });
			await expect(run()).rejects.toThrow(/Unsupported resource: nope/);
		});

		it('sends the auth and API version headers on every request', async () => {
			const { mock, run } = execute({ params: { resource: 'team', operation: 'listTeams' } });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { teams: [] } }));

			await run();

			expect(mock.request.mock.calls[0][0]).toMatchObject({
				method: 'POST',
				url: 'https://api.monday.com/v2',
				headers: {
					Authorization: `Bearer ${TEST_API_KEY}`,
					'Content-Type': 'application/json',
					'API-Version': '2026-01',
				},
			});
		});

		it('returns the parsed payload as a single output item on success', async () => {
			const { mock, run } = execute({ params: { resource: 'team', operation: 'listTeams' } });
			const payload = { data: { teams: [{ id: '1', name: 'Eng', users: [] }] } };
			mock.request.mockResolvedValueOnce(jsonResponse(payload));

			await expect(run()).resolves.toEqual([[{ json: payload }]]);
		});

		it('throws a NodeApiError carrying the first API error when continueOnFail is off', async () => {
			const { mock, run } = execute({ params: { resource: 'team', operation: 'listTeams' } });
			mock.request.mockResolvedValueOnce(
				jsonResponse({
					errors: [
						{ message: 'Not Authenticated', extensions: { code: 'UNAUTHENTICATED' } },
						{ message: 'second' },
					],
				}),
			);

			const error = await run().catch((e: NodeApiError) => e);

			expect(error).toBeInstanceOf(NodeApiError);
			expect(error.message).toBe('Not Authenticated');
			expect(error.description).toContain('UNAUTHENTICATED');
		});

		it('returns an error item instead of throwing when continueOnFail is on', async () => {
			const { mock, run } = execute({
				continueOnFail: true,
				params: { resource: 'team', operation: 'listTeams' },
			});
			const apiError = { message: 'Rate limited', extensions: { code: 'ComplexityException' } };
			mock.request.mockResolvedValueOnce(jsonResponse({ errors: [apiError] }));

			await expect(run()).resolves.toEqual([
				[{ json: { error: { message: 'Rate limited', details: apiError } } }],
			]);
		});

		it('falls back to "Unknown error" when the API error has no message', async () => {
			const { mock, run } = execute({
				continueOnFail: true,
				params: { resource: 'team', operation: 'listTeams' },
			});
			mock.request.mockResolvedValueOnce(jsonResponse({ errors: [{ extensions: {} }] }));

			const result = await run();

			expect((result as any)[0][0].json.error.message).toBe('Unknown error');
		});
	});

	describe('board resource', () => {
		const baseParams = {
			resource: 'board',
			operation: 'createBoard',
			boardName: 'Roadmap',
			boardKind: 'public',
			workspace: '55',
			folder: '-1',
			teamBoardIds: { teamBoardIds: [] },
			usersBoardIds: { usersBoardIds: [] },
			description: '',
			templateId: '',
		};

		it('createBoard builds a minimal mutation', async () => {
			const { mock, run } = execute({ params: baseParams });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_board: { id: '1', url: 'u' } } }));

			await run();

			const mutation = squash(requestedQuery(mock.request));
			expect(mutation).toContain('create_board( board_name: "Roadmap", board_kind: public, workspace_id: 55 )');
			expect(mutation).not.toContain('folder_id');
			expect(mutation).not.toContain('description');
			expect(mutation).not.toContain('template_id');
		});

		it('createBoard adds owners, subscribers, folder, description and template when set', async () => {
			const { mock, run } = execute({
				params: {
					...baseParams,
					folder: '900',
					description: 'Q3 plan',
					templateId: '12',
					usersBoardIds: {
						usersBoardIds: [
							{ userId: '1', isOwner: true },
							{ userId: '2', isOwner: false },
							{ userId: '3', isOwner: false },
						],
					},
					teamBoardIds: {
						teamBoardIds: [
							{ teamId: '10', isOwner: true },
							{ teamId: '20', isOwner: false },
						],
					},
				},
			});
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_board: { id: '1', url: 'u' } } }));

			await run();

			const mutation = squash(requestedQuery(mock.request));
			expect(mutation).toContain('board_owner_ids: ["1"]');
			expect(mutation).toContain('board_subscriber_ids: ["2","3"]');
			expect(mutation).toContain('board_owner_team_ids: ["10"]');
			expect(mutation).toContain('board_subscriber_teams_ids: ["20"]');
			expect(mutation).toContain('description: "Q3 plan"');
			expect(mutation).toContain('template_id: 12');
			expect(mutation).toContain('folder_id: 900');
		});
	});

	describe('item resource', () => {
		it('deleteItem requires an item id', async () => {
			const { mock, run } = execute({ params: { resource: 'item', operation: 'deleteItem', itemId: '' } });
			await expect(run()).rejects.toThrow(/Item ID is required/);
			expect(mock.request).not.toHaveBeenCalled();
		});

		it('deleteItem sends the delete mutation', async () => {
			const { mock, run } = execute({ params: { resource: 'item', operation: 'deleteItem', itemId: '4242' } });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { delete_item: { id: '4242' } } }));

			const result = await run();

			expect(squash(requestedQuery(mock.request))).toBe('mutation { delete_item(item_id: 4242) { id } }');
			expect(result).toEqual([[{ json: { data: { delete_item: { id: '4242' } } } }]]);
		});

		it('duplicateItem requires both item and board ids', async () => {
			const { run } = execute({
				params: { resource: 'item', operation: 'duplicateItem', itemId: '1', boardId: '', withUpdates: false },
			});
			await expect(run()).rejects.toThrow(/Item ID and Board ID are required/);
		});

		it('duplicateItem sends the with_updates flag', async () => {
			const { mock, run } = execute({
				params: { resource: 'item', operation: 'duplicateItem', itemId: '1', boardId: '2', withUpdates: true },
			});
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { duplicate_item: { id: '3' } } }));

			await run();

			expect(squash(requestedQuery(mock.request))).toContain(
				'duplicate_item( item_id: 1, board_id: 2, with_updates: true )',
			);
		});

		describe('getItem', () => {
			const rawItem = {
				id: '100',
				name: 'Ship v2',
				created_at: '2026-01-01T00:00:00Z',
				updated_at: '2026-01-02T00:00:00Z',
				group: { id: 'g1', title: 'Backlog', color: '#000', position: '1' },
				column_values: [
					{ id: 'status', type: 'status', text: 'Done', value: '{"index":1}' },
					{ id: 'subtasks', type: 'subtasks', text: '', value: null },
					{ id: 'auto', type: 'auto_number', text: '3', value: null },
					{ id: 'created', type: 'creation_log', text: '', value: null },
					{ id: 'updated', type: 'last_updated', text: '', value: null },
					{ id: 'formula', type: 'formula', text: '', value: null },
					{
						id: 'mirror',
						type: 'mirror',
						text: '',
						value: null,
						display_value: 'Mirrored',
						mirrored_items: [{ linked_board_id: '7' }],
					},
					{
						id: 'link',
						type: 'board_relation',
						text: 'X',
						value: '{"linkedPulseIds":[{"linkedPulseId":9}]}',
						display_value: 'X',
						linked_item_ids: ['9'],
					},
				],
			};

			const params = {
				resource: 'item',
				operation: 'getItem',
				itemId: '100',
				isSubitem: false,
				fetchAllColumns: true,
				fetchSubitems: false,
				fetchParentItems: false,
			};

			it('returns an empty output when the item does not exist', async () => {
				const { mock, run } = execute({ params });
				mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [] } }));

				await expect(run()).resolves.toEqual([[]]);
			});

			it('formats the item and drops non-updateable column types', async () => {
				const { mock, run } = execute({ params });
				mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [rawItem] } }));

				const result = await run();

				const query = squash(requestedQuery(mock.request));
				expect(query).toContain('items(ids: ["100"])');
				expect(query).toContain('column_values {');
				expect(query).not.toContain('subitems {');
				expect(query).not.toContain('parent_item {');

				expect(result).toEqual([
					[
						{
							json: {
								id: '100',
								name: 'Ship v2',
								created_at: rawItem.created_at,
								updated_at: rawItem.updated_at,
								group: { id: 'g1', title: 'Backlog', color: '#000', position: '1' },
								column_values: {
									status: { type: 'status', text: 'Done', value: { index: 1 } },
									mirror: {
										type: 'mirror',
										text: '',
										value: null,
										display_value: 'Mirrored',
										mirrored_items: [{ linked_board_id: '7' }],
									},
									link: {
										type: 'board_relation',
										text: 'X',
										value: { linkedPulseIds: [{ linkedPulseId: 9 }] },
										display_value: 'X',
										linked_item_ids: ['9'],
									},
								},
							},
						},
					],
				]);
			});

			it('requests only the selected columns when fetchAllColumns is off', async () => {
				const { mock, run } = execute({
					params: { ...params, fetchAllColumns: false, columnIds: 'status,owner' },
				});
				mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [rawItem] } }));

				await run();

				expect(squash(requestedQuery(mock.request))).toContain('column_values(ids: ["status", "owner"])');
			});

			it('includes formatted subitems when requested on a parent item', async () => {
				const { mock, run } = execute({ params: { ...params, fetchSubitems: true } });
				mock.request.mockResolvedValueOnce(
					jsonResponse({
						data: {
							items: [
								{
									...rawItem,
									subitems: [
										{
											id: 's1',
											name: 'Sub',
											column_values: [
												{ id: 'text', type: 'text', text: 'a', value: '"a"' },
												{ id: 'formula', type: 'formula', text: '', value: null },
											],
										},
									],
								},
							],
						},
					}),
				);

				const result = await run();

				expect(squash(requestedQuery(mock.request))).toContain('subitems {');
				expect((result as any)[0][0].json.subitems).toEqual([
					{ id: 's1', name: 'Sub', column_values: { text: { type: 'text', text: 'a', value: 'a' } } },
				]);
			});

			it('includes the formatted parent item for subitems', async () => {
				const { mock, run } = execute({
					params: { ...params, isSubitem: true, fetchSubitems: true, fetchParentItems: true },
				});
				mock.request.mockResolvedValueOnce(
					jsonResponse({
						data: {
							items: [
								{
									...rawItem,
									parent_item: {
										id: 'p1',
										name: 'Parent',
										created_at: 'c',
										updated_at: 'u',
										column_values: [{ id: 'status', type: 'status', text: 'Stuck', value: '{"index":2}' }],
									},
								},
							],
						},
					}),
				);

				const result = await run();

				const query = squash(requestedQuery(mock.request));
				expect(query).toContain('parent_item {');
				// subitems are never requested for a subitem, even if the flag is set
				expect(query).not.toContain('subitems {');
				expect((result as any)[0][0].json.parent_item).toEqual({
					id: 'p1',
					name: 'Parent',
					created_at: 'c',
					updated_at: 'u',
					column_values: { status: { type: 'status', text: 'Stuck', value: { index: 2 } } },
				});
			});
		});
	});

	describe('update resource', () => {
		const baseParams = {
			resource: 'update',
			operation: 'createUpdate',
			itemId: 123,
			bodyContent: 'Hello <b>world</b>\n"quoted"',
			isReply: false,
			pinToTop: false,
			mention: false,
			mentionsList: { mention: [] },
			attachmentsUpdate: '',
		};

		it('createUpdate sends the body through GraphQL variables', async () => {
			const { mock, run } = execute({ params: baseParams });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_update: { id: '77' } } }));

			await run();

			expect(mock.request).toHaveBeenCalledTimes(1);
			const mutation = squash(requestedQuery(mock.request));
			expect(mutation).toContain('mutation ($body: String!, $itemId: ID!)');
			expect(mutation).toContain('create_update ( item_id: $itemId, body: $body )');
			expect(requestedVariables(mock.request)).toEqual({ body: baseParams.bodyContent, itemId: '123' });
		});

		it('createUpdate appends mentions when enabled', async () => {
			const { mock, run } = execute({
				params: {
					...baseParams,
					mention: true,
					mentionsList: { mention: [{ id: '5', type: 'User' }] },
				},
			});
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_update: { id: '77' } } }));

			await run();

			expect(squash(requestedQuery(mock.request))).toContain('body: $body, mentions_list: [{id: 5, type: User}]');
		});

		it('createUpdate posts a reply with the parent id', async () => {
			const { mock, run } = execute({ params: { ...baseParams, isReply: true, updateId: '999', pinToTop: true } });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_update: { id: '78' } } }));

			await run();

			// pinning is skipped for replies
			expect(mock.request).toHaveBeenCalledTimes(1);
			expect(squash(requestedQuery(mock.request))).toContain('parent_id: $parentId');
			expect(requestedVariables(mock.request)).toEqual({ body: baseParams.bodyContent, itemId: '123', parentId: '999' });
		});

		it('createUpdate pins the new update when requested', async () => {
			const { mock, run } = execute({ params: { ...baseParams, pinToTop: true } });
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { create_update: { id: '80' } } }))
				.mockResolvedValueOnce(jsonResponse({ data: { pin_to_top: { id: '80' } } }));

			await run();

			expect(mock.request).toHaveBeenCalledTimes(2);
			expect(squash(requestedQuery(mock.request, 1))).toContain('pin_to_top (id: $updateId, item_id: $itemId)');
			expect(requestedVariables(mock.request, 1)).toEqual({ updateId: '80', itemId: '123' });
		});

		it('createUpdate throws when the API returns no update id', async () => {
			const { mock, run } = execute({ params: baseParams });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_update: null } }));

			await expect(run()).rejects.toThrow(/Update not created/);
		});
	});

	describe('team resource', () => {
		it('listTeams queries all teams with their users', async () => {
			const { mock, run } = execute({ params: { resource: 'team', operation: 'listTeams' } });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { teams: [] } }));

			await run();

			expect(squash(requestedQuery(mock.request))).toBe('query { teams { id name users { id name email } } }');
		});

		it('getTeam filters by id', async () => {
			const { mock, run } = execute({ params: { resource: 'team', operation: 'getTeam', team: '15' } });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { teams: [] } }));

			await run();

			expect(squash(requestedQuery(mock.request))).toContain('teams(ids: [15])');
		});

		it('createTeam passes guest, subscriber and empty-team options', async () => {
			const { mock, run } = execute({
				params: {
					resource: 'team',
					operation: 'createTeam',
					teamName: 'Design',
					isGuest: false,
					userIds: '1,2',
					allowEmptyTeam: true,
				},
			});
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_team: { id: '3', name: 'Design' } } }));

			await run();

			const mutation = squash(requestedQuery(mock.request));
			expect(mutation).toContain('input: {name: "Design", is_guest_team: false, subscriber_ids: [1,2] }');
			expect(mutation).toContain('options: {allow_empty_team: true }');
		});

		it('deleteTeam and updateTeam target the given team', async () => {
			const del = execute({ params: { resource: 'team', operation: 'deleteTeam', teamId: '4' } });
			del.mock.request.mockResolvedValueOnce(jsonResponse({ data: { delete_team: { id: '4' } } }));
			await del.run();
			expect(squash(requestedQuery(del.mock.request))).toBe('mutation { delete_team(team_id: 4) { id } }');

			const upd = execute({ params: { resource: 'team', operation: 'updateTeam', teamId: '4', newName: 'Ops' } });
			upd.mock.request.mockResolvedValueOnce(jsonResponse({ data: { update_team: { id: '4', name: 'Ops' } } }));
			await upd.run();
			expect(squash(requestedQuery(upd.mock.request))).toBe(
				'mutation { update_team(id: 4, name: "Ops") { id name } }',
			);
		});

		it('addUsersToTeam and removeUsersFromTeam send the user list', async () => {
			for (const [operation, field] of [
				['addUsersToTeam', 'add_users_to_team'],
				['removeUsersFromTeam', 'remove_users_from_team'],
			]) {
				const { mock, run } = execute({
					params: { resource: 'team', operation, teamIds: '8', userIds: '1, 2' },
				});
				mock.request.mockResolvedValueOnce(jsonResponse({ data: {} }));

				await run();

				expect(squash(requestedQuery(mock.request))).toContain(`${field} (team_id: 8, user_ids: [1, 2])`);
			}
		});
	});

	describe('user resource', () => {
		it('listUsers queries all users', async () => {
			const { mock, run } = execute({ params: { resource: 'user', operation: 'listUsers' } });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { users: [] } }));

			await run();

			const query = squash(requestedQuery(mock.request));
			expect(query).toMatch(/^\{ users \{ id name email/);
			expect(query).toContain('teams { id name }');
		});

		it('getUser filters by the given ids', async () => {
			const { mock, run } = execute({ params: { resource: 'user', operation: 'getUser', userIds: '5, 6' } });
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { users: [] } }));

			await run();

			expect(squash(requestedQuery(mock.request))).toContain('users (ids: [5, 6])');
		});
	});

	describe('notification resource', () => {
		it('sendNotification escapes the message and casts ids to integers', async () => {
			const { mock, run } = execute({
				params: {
					resource: 'notification',
					operation: 'sendNotification',
					notificationUserId: '12',
					notificationTargetId: '34',
					notificationTargetType: 'Project',
					notificationMessage: 'Line 1\nSaid "hi"',
				},
			});
			mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_notification: { id: '1', text: 't' } } }));

			await run();

			const mutation = squash(requestedQuery(mock.request));
			expect(mutation).toContain('text: "Line 1\\nSaid \\"hi\\""');
			expect(mutation).toContain('user_id: 12');
			expect(mutation).toContain('target_id: 34');
			expect(mutation).toContain('target_type: Project');
		});
	});

	describe('downloadFile resource', () => {
		const params = { resource: 'downloadFile', operation: 'downloadFile', fileId: '555' };

		it('throws when the asset has no public url', async () => {
			const { mock, run } = execute({ params });
			mock.request.mockResolvedValueOnce({ data: { assets: [{ name: 'x', public_url: null }] } });

			await expect(run()).rejects.toThrow(/Public URL not found/);
		});

		it('downloads the asset and returns it as binary data', async () => {
			const { mock, run } = execute({ params });
			const fileBuffer = Buffer.from('%PDF-1.4 fake');
			mock.request
				.mockResolvedValueOnce({
					data: { assets: [{ public_url: 'https://files.monday.com/a.pdf', name: 'report.pdf', file_extension: 'pdf' }] },
				})
				.mockResolvedValueOnce({ body: fileBuffer, headers: { 'content-type': 'application/pdf' } });

			const result = await run();

			expect(mock.request.mock.calls[0][0]).toMatchObject({ json: true });
			expect(squash(requestedQuery(mock.request))).toContain('assets (ids: [555])');
			expect(mock.request.mock.calls[1][0]).toEqual({
				method: 'GET',
				url: 'https://files.monday.com/a.pdf',
				encoding: null,
				resolveWithFullResponse: true,
			});
			expect(mock.context.helpers.prepareBinaryData).toHaveBeenCalledWith(fileBuffer, 'report.pdf', 'application/pdf');
			expect(result).toEqual([
				[
					{
						json: {},
						binary: {
							data: { data: fileBuffer.toString('base64'), mimeType: 'application/pdf', fileName: 'report.pdf' },
						},
					},
				],
			]);
		});

		it('falls back to a generic mime type and file name', async () => {
			const { mock, run } = execute({ params });
			mock.request
				.mockResolvedValueOnce({ data: { assets: [{ public_url: 'https://files.monday.com/blob' }] } })
				.mockResolvedValueOnce({ body: Buffer.from('x'), headers: {} });

			await run();

			expect(mock.context.helpers.prepareBinaryData).toHaveBeenCalledWith(
				expect.any(Buffer),
				'file',
				'application/octet-stream',
			);
		});
	});

	describe('query resource', () => {
		const baseParams = {
			resource: 'query',
			operation: 'query',
			runQuery: '{ me { id } }',
			apiVersion: '2024-10',
			includePagination: false,
		};

		it('rejects an empty query', async () => {
			const { run } = execute({ params: { ...baseParams, runQuery: '' } });
			await expect(run()).rejects.toThrow(/Invalid item data/);
		});

		it('rejects an unsupported operation', async () => {
			const { run } = execute({ params: { ...baseParams, operation: 'mutate' } });
			await expect(run()).rejects.toThrow(/Unsupported operation: mutate/);
		});

		it('runs the raw query with the selected API version', async () => {
			const { mock, run } = execute({ params: baseParams });
			const payload = { data: { me: { id: '1' } } };
			mock.request.mockResolvedValueOnce(jsonResponse(payload));

			const result = await run();

			expect(mock.request.mock.calls[0][0].headers['API-Version']).toBe('2024-10');
			expect(requestedQuery(mock.request)).toBe('{ me { id } }');
			expect(result).toEqual([[{ json: payload }]]);
		});

		it('follows items_page cursors until exhausted', async () => {
			const runQuery = '{ boards(ids: 1) { items_page(limit: 2) { cursor items { id } } } }';
			const { mock, run } = execute({
				params: { ...baseParams, runQuery, includePagination: true, paginationType: 'cursor' },
			});
			mock.request
				.mockResolvedValueOnce(
					jsonResponse({ data: { boards: [{ items_page: { cursor: 'abc', items: [{ id: '1' }, { id: '2' }] } }] } }),
				)
				.mockResolvedValueOnce(
					jsonResponse({ data: { boards: [{ items_page: { cursor: null, items: [{ id: '3' }] } }] } }),
				);

			const result = await run();

			expect(mock.request).toHaveBeenCalledTimes(2);
			expect(requestedQuery(mock.request, 0)).toBe(runQuery);
			expect(requestedQuery(mock.request, 1)).toContain('items_page(limit: 2, cursor: "abc")');
			expect(result).toEqual([
				[{ json: { data: { items: [{ id: '1' }, { id: '2' }, { id: '3' }] }, totalCount: 3 } }],
			]);
		});

		it('replaces an existing cursor placeholder on subsequent pages', async () => {
			const runQuery = '{ boards(ids: 1) { items_page(limit: 2, cursor: "") { cursor items { id } } } }';
			const { mock, run } = execute({
				params: { ...baseParams, runQuery, includePagination: true, paginationType: 'cursor' },
			});
			mock.request
				.mockResolvedValueOnce(
					jsonResponse({ data: { boards: [{ items_page: { cursor: 'next', items: [{ id: '1' }] } }] } }),
				)
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ items_page: { cursor: null, items: [] } }] } }));

			await run();

			expect(requestedQuery(mock.request, 1)).toContain('cursor: "next"');
		});

		it('increments the page argument until a page comes back empty', async () => {
			const runQuery = '{ users(limit: 2, page: 1) { id } }';
			const { mock, run } = execute({
				params: { ...baseParams, runQuery, includePagination: true, paginationType: 'page' },
			});
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { users: [{ id: '1' }, { id: '2' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { users: [{ id: '3' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { users: [] } }));

			const result = await run();

			expect(mock.request).toHaveBeenCalledTimes(3);
			expect(requestedQuery(mock.request, 0)).toContain('page: 1');
			expect(requestedQuery(mock.request, 1)).toContain('page: 2');
			expect(requestedQuery(mock.request, 2)).toContain('page: 3');
			expect(result).toEqual([[{ json: { data: [{ id: '1' }, { id: '2' }, { id: '3' }], totalCount: 3 } }]]);
		});

		it('stops page pagination when the API returns errors', async () => {
			const runQuery = '{ users(limit: 2, page: 1) { id } }';
			const { mock, run } = execute({
				params: { ...baseParams, runQuery, includePagination: true, paginationType: 'page' },
			});
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { users: [{ id: '1' }] } }))
				.mockResolvedValueOnce(jsonResponse({ errors: [{ message: 'Complexity' }] }));

			const result = await run();

			expect(mock.request).toHaveBeenCalledTimes(2);
			expect(result).toEqual([[{ json: { data: [{ id: '1' }], totalCount: 1 } }]]);
		});
	});
});
