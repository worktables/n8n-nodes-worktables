import { MondayWebhook } from '../../nodes/Worktables/MondayWebhook.node';
import { createMockContext, jsonResponse, requestedQuery, squash, TEST_API_KEY } from '../helpers/mockContext';

const node = new MondayWebhook();

const eventBody = {
	event: {
		type: 'update_column_value',
		boardId: 123,
		pulseId: 987654321,
		columnId: 'status',
	},
};

const rawItem = {
	id: '987654321',
	name: 'Design homepage',
	url: 'https://acme.monday.com/boards/123/pulses/987654321',
	created_at: '2026-01-01T10:00:00Z',
	updated_at: '2026-01-02T10:00:00Z',
	board: { id: '123' },
	group: { id: 'topics', title: 'Group Title', color: '#579bfc', position: '65536' },
	column_values: [
		{ id: 'status', type: 'status', text: 'Done', value: '{"index":1}' },
		{ id: 'subtasks', type: 'subtasks', text: '', value: null },
		{ id: 'formula', type: 'formula', text: '10', value: null },
		{
			id: 'connect',
			type: 'board_relation',
			text: 'Other',
			value: '{"linkedPulseIds":[]}',
			display_value: 'Other',
			linked_item_ids: ['5'],
		},
	],
};

describe('MondayWebhook description', () => {
	it('is a trigger node exposing a POST webhook', () => {
		expect(node.description.name).toBe('mondayWebhook');
		expect(node.description.group).toEqual(['trigger']);
		expect(node.description.webhooks).toEqual([
			expect.objectContaining({ httpMethod: 'POST', responseMode: 'onReceived' }),
		]);
	});

	it('marks the credential as optional', () => {
		expect(node.description.credentials).toEqual([{ name: 'WorktablesApi', required: false }]);
	});

	it('exposes the documented parameters with their defaults', () => {
		const defaults = Object.fromEntries(node.description.properties.map((p) => [p.name, p.default]));
		expect(defaults).toEqual({
			getItemAfterEvent: false,
			isSubitem: false,
			fetchSubitems: false,
			fetchParentItem: false,
			fetchAllColumns: true,
			columnIds: '',
		});
	});
});

describe('MondayWebhook.webhook', () => {
	it('answers the Monday.com challenge handshake and emits nothing', async () => {
		const mock = createMockContext({ webhookBody: { challenge: 'abc123' } });

		const result = await node.webhook.call(mock.asWebhook());

		expect(result).toEqual({});
		expect(mock.response.status).toHaveBeenCalledWith(200);
		expect(mock.response.json).toHaveBeenCalledWith({ challenge: 'abc123' });
		expect(mock.request).not.toHaveBeenCalled();
	});

	it('emits the raw body when item fetching is disabled', async () => {
		const mock = createMockContext({ webhookBody: eventBody, params: { getItemAfterEvent: false } });

		const result = await node.webhook.call(mock.asWebhook());

		expect(result).toEqual({ workflowData: [[{ json: eventBody }]] });
		expect(mock.request).not.toHaveBeenCalled();
	});

	it('emits the raw body when no item id can be found in the payload', async () => {
		const body = { event: { type: 'create_board', boardId: 1 } };
		const mock = createMockContext({ webhookBody: body, params: { getItemAfterEvent: true } });

		const result = await node.webhook.call(mock.asWebhook());

		expect(result).toEqual({ workflowData: [[{ json: body }]] });
		expect(mock.request).not.toHaveBeenCalled();
	});

	it.each([
		['event.pulseId', { event: { pulseId: 1 } }],
		['event.itemId', { event: { itemId: 1 } }],
		['event.entityId', { event: { entityId: 1 } }],
		['pulseId', { pulseId: 1 }],
		['itemId', { itemId: 1 }],
	])('finds the item id at %s', async (_label, body) => {
		const mock = createMockContext({
			webhookBody: body,
			params: { getItemAfterEvent: true, fetchAllColumns: true },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [] } }));

		await node.webhook.call(mock.asWebhook());

		expect(squash(requestedQuery(mock.request))).toContain('items(ids: ["1"])');
	});

	it('fetches and formats the item, dropping non-updateable columns', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: true },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [rawItem] } }));

		const result = await node.webhook.call(mock.asWebhook());

		const call = mock.request.mock.calls[0][0];
		expect(call.headers).toEqual({
			'Content-Type': 'application/json',
			'API-Version': '2026-01',
			Authorization: `Bearer ${TEST_API_KEY}`,
		});
		const query = squash(requestedQuery(mock.request));
		expect(query).toContain('items(ids: ["987654321"])');
		expect(query).toContain('column_values {');
		expect(query).not.toContain('subitems {');
		expect(query).not.toContain('parent_item {');

		const output = result.workflowData![0][0].json as any;
		expect(output.event).toEqual(eventBody.event);
		expect(output.item).toEqual({
			id: '987654321',
			name: 'Design homepage',
			url: rawItem.url,
			created_at: rawItem.created_at,
			updated_at: rawItem.updated_at,
			board: { id: '123' },
			group: { id: 'topics', title: 'Group Title', color: '#579bfc', position: '65536' },
			column_values: {
				status: { type: 'status', text: 'Done', value: { index: 1 } },
				connect: {
					type: 'board_relation',
					text: 'Other',
					value: null,
					linked_item_ids: ['5'],
					display_value: 'Other',
				},
			},
		});
	});

	it('requests only the selected column ids when fetchAllColumns is off', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: false, columnIds: 'status, owner ,,date' },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [rawItem] } }));

		await node.webhook.call(mock.asWebhook());

		expect(squash(requestedQuery(mock.request))).toContain('column_values(ids: ["status", "owner", "date"])');
	});

	it('requests no column values when fetchAllColumns is off and no ids are given', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: false, columnIds: '  ' },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [rawItem] } }));

		await node.webhook.call(mock.asWebhook());

		expect(squash(requestedQuery(mock.request))).not.toContain('column_values');
	});

	it('includes and formats subitems when requested', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: true, isSubitem: false, fetchSubitems: true },
		});
		mock.request.mockResolvedValueOnce(
			jsonResponse({
				data: {
					items: [
						{
							...rawItem,
							subitems: [
								{
									id: '1',
									name: 'Sub A',
									url: 'https://acme.monday.com/sub/1',
									created_at: 'c',
									updated_at: 'u',
									board: { id: '999' },
									column_values: [
										{ id: 'text', type: 'text', text: 'hi', value: '"hi"' },
										{ id: 'formula', type: 'formula', text: '', value: null },
									],
								},
							],
						},
					],
				},
			}),
		);

		const result = await node.webhook.call(mock.asWebhook());

		expect(squash(requestedQuery(mock.request))).toContain('subitems {');
		const item = (result.workflowData![0][0].json as any).item;
		expect(item.subitems).toEqual([
			{
				id: '1',
				name: 'Sub A',
				url: 'https://acme.monday.com/sub/1',
				created_at: 'c',
				updated_at: 'u',
				board: { id: '999' },
				column_values: { text: { type: 'text', text: 'hi', value: 'hi' } },
			},
		]);
	});

	it('does not request subitems when the item is a subitem', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: true, isSubitem: true, fetchSubitems: true },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [rawItem] } }));

		await node.webhook.call(mock.asWebhook());

		expect(squash(requestedQuery(mock.request))).not.toContain('subitems {');
	});

	it('includes and formats the parent item for subitems', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: true, isSubitem: true, fetchParentItem: true },
		});
		mock.request.mockResolvedValueOnce(
			jsonResponse({
				data: {
					items: [
						{
							...rawItem,
							parent_item: {
								id: '42',
								name: 'Parent',
								url: 'https://acme.monday.com/parent/42',
								created_at: 'c',
								updated_at: 'u',
								board: { id: '123' },
								column_values: [{ id: 'status', type: 'status', text: 'Stuck', value: '{"index":2}' }],
							},
						},
					],
				},
			}),
		);

		const result = await node.webhook.call(mock.asWebhook());

		expect(squash(requestedQuery(mock.request))).toContain('parent_item {');
		const item = (result.workflowData![0][0].json as any).item;
		expect(item.parent_item).toEqual({
			id: '42',
			name: 'Parent',
			url: 'https://acme.monday.com/parent/42',
			created_at: 'c',
			updated_at: 'u',
			board: { id: '123' },
			column_values: { status: { type: 'status', text: 'Stuck', value: { index: 2 } } },
		});
	});

	it('sets item to null when the API returns no item', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: true },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [] } }));

		const result = await node.webhook.call(mock.asWebhook());

		expect(result.workflowData![0][0].json).toEqual({ ...eventBody, item: null });
	});

	it('accepts an already parsed response object', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: true },
		});
		mock.request.mockResolvedValueOnce({ data: { items: [rawItem] } });

		const result = await node.webhook.call(mock.asWebhook());

		expect((result.workflowData![0][0].json as any).item.id).toBe('987654321');
	});

	it('falls back to the raw payload with item null when the fetch fails', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			params: { getItemAfterEvent: true, fetchAllColumns: true },
		});
		mock.request.mockRejectedValueOnce(new Error('network down'));

		const result = await node.webhook.call(mock.asWebhook());

		expect(result.workflowData![0][0].json).toEqual({ ...eventBody, item: null });
		expect(console.error).toHaveBeenCalledWith('Error fetching item:', expect.any(Error));
	});

	it('omits the Authorization header when no credentials are configured', async () => {
		const mock = createMockContext({
			webhookBody: eventBody,
			credentials: null,
			params: { getItemAfterEvent: true, fetchAllColumns: true },
		});
		mock.request.mockResolvedValueOnce(jsonResponse({ data: { items: [rawItem] } }));

		await node.webhook.call(mock.asWebhook());

		expect(mock.request.mock.calls[0][0].headers).not.toHaveProperty('Authorization');
	});
});
