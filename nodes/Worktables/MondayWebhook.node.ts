/* eslint-disable n8n-nodes-base/node-class-description-inputs-wrong-regular-node */
/* eslint-disable n8n-nodes-base/node-class-description-outputs-wrong */
/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

export class MondayWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Worktables Webhook',
		name: 'mondayWebhook',
		icon: 'file:worktables_icon.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers workflows when an event occurs in Monday.com',
		defaults: {
			name: 'Monday Webhook',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'WorktablesApi',
				required: false,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: '/webhook',
			},
		],
		properties: [
			{
				displayName: 'Get Item After Event',
				name: 'getItemAfterEvent',
				type: 'boolean',
				default: false,
				description: 'Fetch the related item from Monday after receiving the event',
			},
			{
				displayName: 'Is Subitem',
				name: 'isSubitem',
				type: 'boolean',
				default: false,
				description: 'Treat the received item as a subitem when fetching data',
				displayOptions: {
					show: {
						getItemAfterEvent: [true],
					},
				},
			},
			{
				displayName: 'Fetch Subitems',
				name: 'fetchSubitems',
				type: 'boolean',
				default: false,
				description: 'Include subitems of the item in the response',
				displayOptions: {
					show: {
						getItemAfterEvent: [true],
					},
				},
			},
			{
				displayName: 'Fetch All Columns',
				name: 'fetchAllColumns',
				type: 'boolean',
				default: true,
				description: 'When true, returns all columns; otherwise, only specified Column IDs',
				displayOptions: {
					show: {
						getItemAfterEvent: [true],
					},
				},
			},
			{
				displayName: 'Column IDs',
				name: 'columnIds',
				type: 'string',
				default: '',
				placeholder: 'status,owner,date',
				description:
					'Comma-separated column IDs to fetch. Leave empty to fetch all columns.',
				displayOptions: {
					show: {
						getItemAfterEvent: [true],
						fetchAllColumns: [false],
					},
				},
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();

		const body = req.body;

		console.log('Webhook received', body);

		// ✅ Respond to Monday.com's challenge request
		if (body.challenge) {
			res.status(200).json({ challenge: body.challenge });
			return {};
		}

		const getItemAfterEvent = this.getNodeParameter('getItemAfterEvent', 0) as boolean;
		if (!getItemAfterEvent) {
			return {
				workflowData: [this.helpers.returnJsonArray([body])],
			};
		}

		const isSubitem = this.getNodeParameter('isSubitem', 0) as boolean;
		const fetchSubitems = this.getNodeParameter('fetchSubitems', 0) as boolean;
		const fetchAllColumns = this.getNodeParameter('fetchAllColumns', 0) as boolean;
		const columnIdsRaw = this.getNodeParameter('columnIds', 0) as string;
		const columnIds = (columnIdsRaw || '')
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);

		// Try to extract item id from Monday webhook payload
		const itemId =
			body?.event?.pulseId ??
			body?.event?.itemId ??
			body?.event?.entityId ??
			body?.pulseId ??
			body?.itemId;

		if (!itemId) {
			// If we cannot determine the item id, just emit the raw body
			return {
				workflowData: [this.helpers.returnJsonArray([body])],
			};
		}

		// Build GraphQL query dynamically based on options
		const columnsSelection = fetchAllColumns
			? 'column_values { id text value type }'
			: columnIds.length > 0
				? `column_values (ids: [${columnIds.map((id) => `"${id}"`).join(', ')}]) { id text value type }`
				: 'column_values { id text value type }';

		const subitemsSelection = fetchSubitems ? `subitems { id name ${columnsSelection} }` : '';

		const itemFragment = `id name ${columnsSelection} ${subitemsSelection}`.trim();

		const query = isSubitem
			? `query { item (id: ${itemId}) { ${itemFragment} } }`
			: `query { item (id: ${itemId}) { ${itemFragment} } }`;

		let fetchedItem: unknown = undefined;
		try {
			const credentials = await this.getCredentials('WorktablesApi');
			const apiKey = (credentials as { apiKey?: string } | null)?.apiKey;

			const response = await this.helpers.httpRequest({
				method: 'POST',
				url: 'https://api.monday.com/v2',
				headers: {
					'Content-Type': 'application/json',
					...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
				},
				body: { query },
				json: true,
			});

			fetchedItem = response?.data?.item ?? null;
		} catch (error) {
			// If fetching fails, proceed with original payload
			fetchedItem = null;
		}

		return {
			workflowData: [
				this.helpers.returnJsonArray([
					{
						...body,
						fetchedItem,
					},
				]),
			],
		};
	}
}
