import { NodeApiError } from 'n8n-workflow';
import { Worktables } from '../../nodes/Worktables/Worktables.node';
import {
	createMockContext,
	jsonResponse,
	requestedQuery,
	squash,
	MockContextOptions,
} from '../helpers/mockContext';

const node = new Worktables();

function execute(options: MockContextOptions) {
	const mock = createMockContext(options);
	return { mock, run: () => node.execute.call(mock.asExecute()) };
}

/** Decodes the escaped column_values JSON literal embedded in a mutation string. */
function embeddedColumnValues(mutation: string): Record<string, unknown> {
	const match = mutation.match(/column_values: "((?:[^"\\]|\\.)*)"/);
	if (!match) throw new Error('column_values argument not found in mutation');
	return JSON.parse(JSON.parse(`"${match[1]}"`));
}

const createdItem = {
	id: '5001',
	name: 'New task',
	url: 'https://acme.monday.com/boards/1/pulses/5001',
	board: { id: '1' },
	column_values: [
		{ id: 'text', type: 'text', text: 'hello', value: '"hello"' },
		{ id: 'status', type: 'status', text: 'Done', value: '{"index":1}' },
		{ id: 'formula', type: 'formula', text: '', value: null },
	],
};

describe('Worktables.execute item create and update', () => {
	describe('createItem', () => {
		const params = {
			resource: 'item',
			operation: 'createItem',
			itemName: 'New task "Q3"',
			groupId: 'topics',
			boardId: '1',
			isSubitem: false,
			columnValues: { column: [] },
		};

		it('creates an item without column values and returns the formatted fetched item', async () => {
			const { mock, run } = execute({ params });
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Roadmap' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { create_item: { id: '5001' } } }))
				.mockResolvedValueOnce(jsonResponse({ data: { items: [createdItem] } }));

			const result = await run();

			expect(mock.request).toHaveBeenCalledTimes(3);
			expect(squash(requestedQuery(mock.request, 0))).toContain('boards(ids: 1) { name }');

			const mutation = squash(requestedQuery(mock.request, 1));
			expect(mutation).toContain('create_item(');
			expect(mutation).toContain('board_id: 1');
			expect(mutation).toContain('item_name: "New task \\"Q3\\""');
			expect(mutation).toContain('group_id: "topics"');
			expect(embeddedColumnValues(mutation)).toEqual({});

			expect(squash(requestedQuery(mock.request, 2))).toContain('items(ids: ["5001"])');

			expect(result).toEqual([
				[
					{
						json: {
							id: '5001',
							name: 'New task',
							url: createdItem.url,
							board: '1',
							column_values: {
								text: { type: 'text', text: 'hello', value: 'hello' },
								status: { type: 'status', text: 'Done', value: { index: 1 } },
							},
						},
					},
				],
			]);
		});

		it('omits group_id when no group is selected', async () => {
			const { mock, run } = execute({ params: { ...params, groupId: '' } });
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Roadmap' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { create_item: { id: '5001' } } }))
				.mockResolvedValueOnce(jsonResponse({ data: { items: [createdItem] } }));

			await run();

			expect(squash(requestedQuery(mock.request, 1))).not.toContain('group_id');
		});

		it('resolves column types from the board and embeds the column values', async () => {
			const { mock, run } = execute({
				params: {
					...params,
					columnValues: {
						column: [
							{ columnId: 'text', columnValue: 'hello' },
							{ columnId: 'status', statusLabel: 'Done' },
						],
					},
				},
			});
			mock.request
				.mockResolvedValueOnce(
					jsonResponse({
						data: { boards: [{ columns: [{ id: 'text', type: 'text' }, { id: 'status', type: 'status' }] }] },
					}),
				)
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Roadmap' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { create_item: { id: '5001' } } }))
				.mockResolvedValueOnce(jsonResponse({ data: { items: [createdItem] } }));

			await run();

			expect(mock.request).toHaveBeenCalledTimes(4);
			expect(squash(requestedQuery(mock.request, 0))).toContain('boards(ids: 1) { columns { id type } }');
			expect(embeddedColumnValues(squash(requestedQuery(mock.request, 2)))).toEqual({
				text: 'hello',
				status: { label: 'Done' },
			});
		});

		it('creates a subitem when the target board is a subitems board', async () => {
			const { mock, run } = execute({ params: { ...params, parentId: '4000' } });
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Subitems of Roadmap' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { create_subitem: { id: '5002' } } }))
				.mockResolvedValueOnce(jsonResponse({ data: { items: [{ ...createdItem, id: '5002' }] } }));

			const result = await run();

			const mutation = squash(requestedQuery(mock.request, 1));
			expect(mutation).toContain('create_subitem(');
			expect(mutation).toContain('parent_item_id: 4000');
			expect(mutation).not.toContain('board_id: ');
			expect((result as any)[0][0].json.id).toBe('5002');
		});

		it('creates a subitem when isSubitem is set explicitly', async () => {
			const { mock, run } = execute({ params: { ...params, isSubitem: true, parentId: '4000' } });
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Any board' }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { create_subitem: { id: '5002' } } }))
				.mockResolvedValueOnce(jsonResponse({ data: { items: [] } }));

			await run();

			expect(squash(requestedQuery(mock.request, 1))).toContain('create_subitem(');
		});

		it('falls back to the mutation payload when the follow-up fetch returns nothing', async () => {
			const { mock, run } = execute({ params });
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Roadmap' }] } }))
				.mockResolvedValueOnce(
					jsonResponse({ data: { create_item: { id: '5001', name: 'From mutation', board: { id: '1' } } } }),
				)
				.mockResolvedValueOnce(jsonResponse({ data: { items: [] } }));

			const result = await run();

			expect(result).toEqual([
				[{ json: { id: '5001', name: 'From mutation', url: undefined, board: '1', column_values: {} } }],
			]);
		});

		it('throws a NodeApiError when the mutation fails and continueOnFail is off', async () => {
			const { mock, run } = execute({ params });
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Roadmap' }] } }))
				.mockResolvedValueOnce(jsonResponse({ errors: [{ message: 'Board not found' }] }));

			const error = await run().catch((e: NodeApiError) => e);

			expect(error).toBeInstanceOf(NodeApiError);
			expect(error.message).toBe('Board not found');
		});

		it('returns an error item when the mutation fails and continueOnFail is on', async () => {
			const { mock, run } = execute({ params, continueOnFail: true });
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ name: 'Roadmap' }] } }))
				.mockResolvedValueOnce(jsonResponse({ errors: [{ message: 'Board not found' }] }));

			await expect(run()).resolves.toEqual([
				[{ json: { error: { message: 'Board not found', details: { message: 'Board not found' } } } }],
			]);
			expect(mock.request).toHaveBeenCalledTimes(2);
		});
	});

	describe('updateItem', () => {
		const params = {
			resource: 'item',
			operation: 'updateItem',
			itemId: '5001',
			boardId: '1',
			columnValues: { column: [] },
		};

		const updated = {
			id: '5001',
			name: 'Task',
			url: 'https://acme.monday.com/boards/1/pulses/5001',
			board: { id: '1' },
			column_values: [
				{ id: 'status', type: 'status', text: 'Working on it', value: '{"index":0}' },
				{ id: 'auto', type: 'auto_number', text: '1', value: null },
			],
		};

		function mockUpdate(mock: ReturnType<typeof createMockContext>) {
			mock.request.mockResolvedValueOnce(
				jsonResponse({ data: { change_multiple_column_values: updated } }),
			);
		}

		it('sends change_multiple_column_values and returns the formatted item', async () => {
			const { mock, run } = execute({
				params: {
					...params,
					columnValues: {
						column: [
							{ columnId: 'status', columnType: 'status', columnValue: '', statusLabel: 'Working on it' },
							{ columnId: 'text', columnType: 'text', columnValue: 'Updated' },
							{ columnId: 'numbers', columnType: 'numbers', columnValue: '7' },
						],
					},
				},
			});
			mockUpdate(mock);

			const result = await run();

			expect(mock.request).toHaveBeenCalledTimes(1);
			const mutation = squash(requestedQuery(mock.request));
			expect(mutation).toContain('change_multiple_column_values(');
			expect(mutation).toContain('board_id: 1');
			expect(mutation).toContain('item_id: "5001"');
			expect(embeddedColumnValues(mutation)).toEqual({
				status: { label: 'Working on it' },
				text: 'Updated',
				numbers: '7',
			});
			expect(result).toEqual([
				[
					{
						json: {
							id: '5001',
							name: 'Task',
							url: updated.url,
							board: '1',
							column_values: {
								status: { type: 'status', text: 'Working on it', value: { index: 0 } },
							},
						},
					},
				],
			]);
		});

		it('falls back to columnValue for a status label', async () => {
			const { mock, run } = execute({
				params: {
					...params,
					columnValues: { column: [{ columnId: 'status', columnType: 'status', columnValue: 'Stuck' }] },
				},
			});
			mockUpdate(mock);

			await run();

			expect(embeddedColumnValues(squash(requestedQuery(mock.request)))).toEqual({ status: { label: 'Stuck' } });
		});

		it('parses objectValue JSON', async () => {
			const { mock, run } = execute({
				params: {
					...params,
					columnValues: {
						column: [{ columnId: 'loc', columnType: 'objectValue', columnValue: '', objectValue: '{"lat":"1","lng":"2"}' }],
					},
				},
			});
			mockUpdate(mock);

			await run();

			expect(embeddedColumnValues(squash(requestedQuery(mock.request)))).toEqual({ loc: { lat: '1', lng: '2' } });
		});

		it('rejects invalid objectValue JSON before calling the API', async () => {
			const { mock, run } = execute({
				params: {
					...params,
					columnValues: {
						column: [{ columnId: 'loc', columnType: 'objectValue', columnValue: '', objectValue: '{bad' }],
					},
				},
			});

			await expect(run()).rejects.toThrow(/Invalid JSON format for column loc/);
			expect(mock.request).not.toHaveBeenCalled();
		});

		it('handles an empty column list', async () => {
			const { mock, run } = execute({ params });
			mockUpdate(mock);

			await run();

			expect(embeddedColumnValues(squash(requestedQuery(mock.request)))).toEqual({});
		});

		it('returns an empty column map when the API omits column values', async () => {
			const { mock, run } = execute({ params });
			mock.request.mockResolvedValueOnce(
				jsonResponse({ data: { change_multiple_column_values: { id: '5001', name: 'Task', board: { id: '1' } } } }),
			);

			const result = await run();

			expect((result as any)[0][0].json).toEqual({
				id: '5001',
				name: 'Task',
				url: undefined,
				board: '1',
				column_values: {},
			});
		});
	});
});

describe('Worktables.execute board read operations', () => {
	it('listBoardGroups includes archived and deleted flags when requested', async () => {
		const { mock, run } = execute({
			params: { resource: 'board', operation: 'listBoardGroups', boardId: '1', archiveGroup: true, deleteGroup: true },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ groups: [] }] } }));

		await run();

		const query = squash(requestedQuery(mock.request));
		expect(query).toContain('boards(ids: [1])');
		expect(query).toContain('groups { id title color position archived deleted }');
	});

	it('listBoardGroups omits the flags by default', async () => {
		const { mock, run } = execute({
			params: { resource: 'board', operation: 'listBoardGroups', boardId: '1', archiveGroup: false, deleteGroup: false },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ groups: [] }] } }));

		await run();

		const query = squash(requestedQuery(mock.request));
		expect(query).not.toContain('archived');
		expect(query).not.toContain('deleted');
	});

	it('getBoard fetches board metadata', async () => {
		const { mock, run } = execute({ params: { resource: 'board', operation: 'getBoard', boardId: '42' } });
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ id: '42' }] } }));

		await run();

		const query = squash(requestedQuery(mock.request));
		expect(query).toContain('boards(ids: [42])');
		for (const field of ['columns { id title type }', 'groups { id title }', 'items_count', 'subscribers { id name }', 'workspace { id name }']) {
			expect(query).toContain(field);
		}
	});

	it('getGroup fetches a single group by id', async () => {
		const { mock, run } = execute({
			params: { resource: 'board', operation: 'getGroup', boardId: '42', groupId: 'topics' },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ groups: [] }] } }));

		await run();

		expect(squash(requestedQuery(mock.request))).toContain('boards(ids: [42]) { groups(ids: ["topics"])');
	});

	it('createGroup sends name and colour, without positioning by default', async () => {
		const { mock, run } = execute({
			params: {
				resource: 'board',
				operation: 'createGroup',
				boardId: '42',
				groupName: 'Backlog',
				groupColor: '#579bfc',
				groupId: '',
				positionRelative: 'after_at',
			},
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_group: { id: 'g', title: 'Backlog' } } }));

		await run();

		const mutation = squash(requestedQuery(mock.request));
		expect(mutation).toContain('create_group( board_id: 42, group_name: "Backlog", group_color: "#579bfc" )');
		expect(mutation).not.toContain('relative_to');
	});

	it('createGroup positions relative to another group when given', async () => {
		const { mock, run } = execute({
			params: {
				resource: 'board',
				operation: 'createGroup',
				boardId: '42',
				groupName: 'Backlog',
				groupColor: '#579bfc',
				groupId: 'topics',
				positionRelative: 'before_at',
			},
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { create_group: { id: 'g', title: 'Backlog' } } }));

		await run();

		expect(squash(requestedQuery(mock.request))).toContain(
			'relative_to: "topics", position_relative_method: before_at',
		);
	});
});
