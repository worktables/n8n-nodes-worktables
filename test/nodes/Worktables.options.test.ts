import { Worktables } from '../../nodes/Worktables/Worktables.node';
import { createMockContext, jsonResponse, requestedQuery } from '../helpers/mockContext';

const load = new Worktables().methods.loadOptions;
const params = { boardId: '42', itemId: '51', parentId: '52', workspace: '7' };
const excluded = [
	'subitem',
	'auto_number',
	'creation_log',
	'formula',
	'item_id',
	'last_updated',
	'progress',
	'mirror',
	'subtasks',
	'file',
	'button',
];
const columns = [...excluded, 'text', 'status'].map((type) => ({
	id: type,
	title: type.toUpperCase(),
	type,
}));
const editable = [
	{ name: 'TEXT', value: 'text' },
	{ name: 'STATUS', value: 'status' },
];

describe('Worktables option loading edge cases', () => {
	it.each([
		'getBoards',
		'getGroupsFromBoard',
		'getItemsFromBoard',
		'getItemsOrSubitemsFromBoard',
		'getSubitemFromItem',
		'getColumnsFromBoard',
		'getSubscribersFromBoard',
		'getSubitems',
		'getFolders',
		'getUsers',
		'getFileColumns',
		'getUpdates',
	] as const)('%s rejects missing credentials before requesting data', async (method) => {
		const mock = createMockContext({ params, credentials: null });
		await expect(load[method].call(mock.asLoadOptions())).rejects.toThrow('API Key not found');
		expect(mock.request).not.toHaveBeenCalled();
	});

	it.each([
		'getItemsFromBoard',
		'getItemsOrSubitemsFromBoard',
		'getColumnsFromBoard',
		'getSubscribersFromBoard',
		'getSubitemFromItem',
	] as const)('%s rejects missing target IDs', async (method) => {
		const mock = createMockContext();
		await expect(load[method].call(mock.asLoadOptions())).rejects.toThrow(/ID is required/);
		expect(mock.request).not.toHaveBeenCalled();
	});

	describe.each(['getSubitems', 'getSubitemFromItem'] as const)('%s', (method) => {
		it.each([
			{},
			{ data: {} },
			{ data: { items: [] } },
			{ data: { items: [{ subitems: null }] } },
			{ data: { items: [{ subitems: {} }] } },
			{ data: { items: [{ subitems: [] }] } },
		])('returns no options for unavailable subitems: %j', async (payload) => {
			const mock = createMockContext({ params });
			mock.request.mockResolvedValueOnce(jsonResponse(payload));
			await expect(load[method].call(mock.asLoadOptions())).resolves.toEqual([]);
		});
		it('maps subitems and supports the parent ID fallback', async () => {
			const mock = createMockContext({ params: { ...params, itemId: '' } });
			mock.request.mockResolvedValueOnce(
				jsonResponse({ data: { items: [{ subitems: [{ id: '90', name: 'Review' }] }] } }),
			);
			await expect(load[method].call(mock.asLoadOptions())).resolves.toEqual([
				{ name: 'Review', value: '90' },
			]);
			expect(requestedQuery(mock.request)).toContain('52');
		});
	});

	it.each([false, true])('loads parent items for a subitem board: %s', async (subitem) => {
		const mock = createMockContext({ params });
		mock.request
			.mockResolvedValueOnce(
				jsonResponse({
					data: {
						boards: [
							{
								name: subitem ? 'Subitems of Roadmap' : 'Roadmap',
								items_page: { items: [{ parent_item: { board: { id: '99' } } }] },
							},
						],
					},
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse({
					data: { boards: [{ items_page: { items: [{ id: '51', name: 'Ship' }] } }] },
				}),
			);
		await expect(load.getItemsFromBoard.call(mock.asLoadOptions())).resolves.toEqual([
			{ name: 'None', value: 0 },
			{ name: 'Ship', value: '51' },
		]);
		expect(requestedQuery(mock.request, 1)).toContain(`boards(ids: ${subitem ? '99' : '42'})`);
	});

	it('loads items directly with the None option', async () => {
		const mock = createMockContext({ params });
		mock.request.mockResolvedValueOnce(
			jsonResponse({ data: { boards: [{ items_page: { items: [{ id: '51', name: 'Ship' }] } }] } }),
		);
		await expect(load.getItemsOrSubitemsFromBoard.call(mock.asLoadOptions())).resolves.toEqual([
			{ name: 'None', value: 0 },
			{ name: 'Ship', value: '51' },
		]);
	});

	it.each([
		[
			'getSubscribersFromBoard',
			'subscribers',
			[{ id: '8', name: 'Ana' }],
			[{ name: 'Ana', value: '8' }],
		],
		['getUpdates', 'updates', [{ id: '9', body: 'Ready' }], [{ name: 'Ready', value: '9' }]],
		['getFileColumns', 'columns', columns, [{ name: 'FILE', value: 'file' }]],
		[
			'getColumnsFromBoard',
			'columns',
			columns,
			columns.map((c) => ({ name: c.title, value: c.id })),
		],
		[
			'getColumnsItems',
			'columns',
			columns,
			[{ name: 'FILE', value: 'file' }, { name: 'BUTTON', value: 'button' }, ...editable],
		],
	] as const)('%s maps the requested board data', async (method, field, data, expected) => {
		const mock = createMockContext({ params: { ...params, operation: 'uploadFile' } });
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { boards: [{ [field]: data }] } }));
		await expect(load[method].call(mock.asLoadOptions())).resolves.toEqual(expected);
		expect(requestedQuery(mock.request)).toContain('boards(ids: 42)');
	});

	describe.each(['getColumnsItemsForIdentifier', 'getColumnsItemsForCreateOrUpdate'] as const)(
		'%s',
		(method) => {
			it.each([false, true])(
				'filters unsupported column types for subitem=%s',
				async (isSubitem) => {
					const mock = createMockContext({ params: { ...params, isSubitem } });
					mock.request.mockResolvedValueOnce(
						jsonResponse({
							data: isSubitem
								? { items: [{ subitems: [{ board: { columns } }] }] }
								: { boards: [{ columns }] },
						}),
					);
					await expect(load[method].call(mock.asLoadOptions())).resolves.toEqual(editable);
					expect(mock.request).toHaveBeenCalledTimes(1);
					expect(requestedQuery(mock.request)).toContain(
						isSubitem ? 'items(ids: [52])' : 'boards(ids: 42)',
					);
				},
			);
			it('searches board items when the parent has no subitems', async () => {
				const mock = createMockContext({ params: { ...params, isSubitem: true } });
				mock.request
					.mockResolvedValueOnce(jsonResponse({ data: { items: [{ subitems: [] }] } }))
					.mockResolvedValueOnce(
						jsonResponse({
							data: {
								boards: [
									{
										items_page: {
											items: [
												{ subitems: null },
												{},
												{ subitems: [] },
												{ subitems: [{}] },
												{ subitems: [{ board: { columns } }] },
											],
										},
									},
								],
							},
						}),
					);
				await expect(load[method].call(mock.asLoadOptions())).resolves.toEqual(editable);
				expect(mock.request).toHaveBeenCalledTimes(2);
				expect(requestedQuery(mock.request, 1)).toContain('items_page(limit: 25)');
			});
			it('handles a parent parameter unavailable in the editor and no board items', async () => {
				const mock = createMockContext({ params: { ...params, isSubitem: true } });
				mock.context.getCurrentNodeParameter.mockImplementation((name) => {
					if (name === 'parentId') throw new Error('Parameter unavailable');
					return name === 'isSubitem' ? true : '42';
				});
				mock.request.mockResolvedValueOnce(jsonResponse({ data: {} }));
				await expect(load[method].call(mock.asLoadOptions())).resolves.toEqual([]);
				expect(mock.request).toHaveBeenCalledTimes(1);
			});
		},
	);

	it('returns no identifier options on the subitems concurrency limit', async () => {
		const mock = createMockContext({ params: { boardId: '42', isSubitem: true } });
		mock.request.mockResolvedValueOnce(
			jsonResponse({
				errors: [{ message: 'other' }, { extensions: { code: 'FIELD_LIMIT_EXCEEDED' } }],
			}),
		);
		await expect(load.getColumnsItemsForIdentifier.call(mock.asLoadOptions())).resolves.toEqual([]);
	});

	it('loads folders until an empty page', async () => {
		const mock = createMockContext({ params });
		mock.request
			.mockResolvedValueOnce(jsonResponse({ data: { folders: [{ id: '8', name: 'Projects' }] } }))
			.mockResolvedValueOnce(jsonResponse({ data: { folders: [] } }));
		await expect(load.getFolders.call(mock.asLoadOptions())).resolves.toEqual([
			{ name: 'None', value: '-1' },
			{ name: 'Projects', value: '8' },
		]);
		expect(requestedQuery(mock.request, 1)).toContain('page: 2, workspace_ids: 7');
	});

	it.each([
		{ column: [] },
		{ column: [{ columnType: 'text' }] },
		{ column: [{ columnType: 'status', statusLabel: 'Done' }] },
		{ column: [{ columnType: 'status' }] },
	])('skips label requests without an unresolved status column: %j', async ({ column }) => {
		const mock = createMockContext({ params: { ...params, columnValues: { column } } });
		await expect(load.getAllLabelStatus.call(mock.asLoadOptions())).resolves.toEqual([]);
		expect(mock.request).not.toHaveBeenCalled();
	});

	it.each([{ labels: { 0: 'Working', 1: '', 2: '  ', 3: 7, 4: 'Done' } }, {}])(
		'loads nonblank status labels: %j',
		async (settings) => {
			const mock = createMockContext({
				params: {
					...params,
					columnValues: { column: [{ columnId: 'status', columnType: 'status' }] },
				},
			});
			mock.request.mockResolvedValueOnce(
				jsonResponse({
					data: {
						boards: [{ columns: [{ title: 'Status', settings_str: JSON.stringify(settings) }] }],
					},
				}),
			);
			await expect(load.getAllLabelStatus.call(mock.asLoadOptions())).resolves.toEqual(
				'labels' in settings
					? [
							{ name: 'Working (Status)', value: 'Working' },
							{ name: 'Done (Status)', value: 'Done' },
					  ]
					: [],
			);
			expect(requestedQuery(mock.request)).toContain('columns(ids: ["status"])');
		},
	);
});
