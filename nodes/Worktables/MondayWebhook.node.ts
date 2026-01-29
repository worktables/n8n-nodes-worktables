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
import { formatColumnValue } from '../../utils/worktablesHelpers';

// API Version constant - update this when API version changes
const API_VERSION = '2026-01';

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
						isSubitem: [false],
					},
				},
			},
			{
				displayName: 'Fetch Parent Item',
				name: 'fetchParentItem',
				type: 'boolean',
				default: false,
				description: 'Include parent item in the response when the item is a subitem',
				displayOptions: {
					show: {
						getItemAfterEvent: [true],
						isSubitem: [true],
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
		const fetchParentItem = this.getNodeParameter('fetchParentItem', 0) as boolean;
		const fetchAllColumns = this.getNodeParameter('fetchAllColumns', 0) as boolean;
		const columnIdsRaw = this.getNodeParameter('columnIds', 0) as string;

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

		// Build column values query based on fetchAllColumns setting
		let queryColumnValues = '';
		if (fetchAllColumns) {
			queryColumnValues = `
				column_values {
					id
					text
					value
					type
					... on BoardRelationValue {
						display_value
						linked_item_ids
					}
					... on MirrorValue {
						display_value
						mirrored_items {
							linked_board_id
						}
					}
					... on DependencyValue {
						display_value
						linked_item_ids
						linked_items {
							id
							name
						}
					}
				}
			`;
		} else if (columnIdsRaw && columnIdsRaw.trim()) {
			// Parse column IDs and build specific column query
			const specificColumnIds = columnIdsRaw.split(',').map(id => id.trim()).filter(id => id);
			if (specificColumnIds.length > 0) {
				const columnIdsString = specificColumnIds.map(id => `"${id}"`).join(', ');
				queryColumnValues = `
					column_values(ids: [${columnIdsString}]) {
						id
						text
						value
						type
						... on BoardRelationValue {
							display_value
							linked_item_ids
						}
						... on MirrorValue {
							display_value
							mirrored_items {
								linked_board_id
							}
						}
						... on DependencyValue {
							display_value
							linked_item_ids
							linked_items {
								id
								name
							}
						}
					}
				`;
			}
		}

		// Build subitems query if needed
		const querySubitems = `
			subitems {
				id
				name
				url
				board {
					id
				}
				created_at
				updated_at
				${queryColumnValues}
			}
		`;

		// Build parent item query if it's a subitem
		const queryParentItem = `
			parent_item {
				id
				name
				url
				board {
					id
				}
				created_at
				updated_at
				${queryColumnValues}
			}
		`;

		// Build the complete GraphQL query
		const query = `
		{
			items(ids: ["${itemId}"]) {
				id
				name
				url
				board {
					id
				}
				group {
					id
					title
					color
					position
				}
				created_at
				updated_at
				${queryColumnValues}
				${!isSubitem && fetchSubitems ? querySubitems : ''}
				${isSubitem && fetchParentItem ? queryParentItem : ''}
			}
		}
		`;

		let fetchedItem: unknown = undefined;
		try {
			const credentials = await this.getCredentials('WorktablesApi');
			const apiKey = (credentials as { apiKey?: string } | null)?.apiKey;

			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				'API-Version': API_VERSION,
			};

			if (apiKey) {
				headers['Authorization'] = `Bearer ${apiKey}`;
			}

			const rawResponse = await this.helpers.request({
				method: 'POST',
				url: 'https://api.monday.com/v2',
				headers,
				body: { query },
			});

			const parsed = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
			const items = parsed?.data?.items;
			const rawItem = items?.[0] ?? null;

			if (rawItem) {
				// Format item in the same pattern as other fetches
				const columnValues = rawItem.column_values || [];

				const formatted: Record<string, any> = {
					id: rawItem.id,
					name: rawItem.name,
					url: rawItem.url,
					created_at: rawItem.created_at,
					updated_at: rawItem.updated_at,
					board: rawItem.board ? {
						id: rawItem.board.id,
					} : undefined,
					group: rawItem.group ? {
						id: rawItem.group.id,
						title: rawItem.group.title,
						color: rawItem.group.color,
						position: rawItem.group.position,
					} : undefined,
					column_values: {},
				};

				// Format column values
				for (const col of columnValues) {
					if (col.type === 'subtasks') continue;

					const formattedCol = await formatColumnValue(col);
					if (formattedCol) {
						formatted.column_values[col.id] = formattedCol;
					}
				}

				// Format subitems if they exist
				if (rawItem.subitems && Array.isArray(rawItem.subitems)) {
					formatted.subitems = await Promise.all(
						rawItem.subitems.map(async (subitem: any) => {
							const subFormatted: Record<string, any> = {
								id: subitem.id,
								name: subitem.name,
								url: subitem.url,
								created_at: subitem.created_at,
								updated_at: subitem.updated_at,
								board: subitem.board ? {
									id: subitem.board.id,
								} : undefined,
								column_values: {},
							};

							for (const col of subitem.column_values || []) {
								const subCol = await formatColumnValue(col);
								if (subCol) {
									subFormatted.column_values[col.id] = subCol;
								}
							}

							return subFormatted;
						}),
					);
				}

				// Format parent item if it exists and fetchParentItem is true
				if (isSubitem && fetchParentItem && rawItem.parent_item && typeof rawItem.parent_item === 'object') {
					const parentItem = rawItem.parent_item;
					const parentFormatted: Record<string, any> = {
						id: parentItem.id,
						name: parentItem.name,
						url: parentItem.url,
						created_at: parentItem.created_at,
						updated_at: parentItem.updated_at,
						board: parentItem.board ? {
							id: parentItem.board.id,
						} : undefined,
						column_values: {},
					};

					for (const col of parentItem.column_values || []) {
						const subCol = await formatColumnValue(col);
						if (subCol) {
							parentFormatted.column_values[col.id] = subCol;
						}
					}
					formatted.parent_item = parentFormatted;
				}

				fetchedItem = formatted;
			} else {
				fetchedItem = null;
			}
		} catch (error) {
			// If fetching fails, proceed with original payload
			console.error('Error fetching item:', error);
			fetchedItem = null;
		}

		return {
			workflowData: [
				this.helpers.returnJsonArray([
					{
						...body,
						item: fetchedItem,
					},
				]),
			],
		};
	}
}
