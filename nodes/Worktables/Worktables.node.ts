import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

export class Worktables implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Worktables',
		name: 'worktables',
		icon: 'file:worktables_icon.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with Monday.com boards and items',
		defaults: {
			name: 'Worktables',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'WorktablesApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.monday.com/v2',
			headers: {
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Board - ',
						value: 'board',
						description: 'Operations related to boards',
					},
					{
						name: 'Item - ',
						value: 'item',
						description: 'Operations related to items',
					},
				],
				default: 'board',
				required: true,
				description: 'Select the category of actions to perform.',
			},

			// Board Actions
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Get Board',
						value: 'getBoard',
						description: 'Retrieve a board by ID',
					},
					{
						name: 'Get Many Boards',
						value: 'getManyBoards',
						description: 'Retrieve multiple boards',
					},
				],
				default: 'getBoard',
				required: true,
				displayOptions: {
					show: {
						resource: ['board'],
					},
				},
			},

			{
				displayName: 'Board ID',
				name: 'boardId',
				type: 'string',
				default: '',
				description: 'Enter the Board ID to fetch details.',
				displayOptions: {
					show: {
						resource: ['board'],
					},
				},
			},

			// Item Actions
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Update Items',
						value: 'updateItem',
						description: 'Update an item or multiple items in a board',
					},
					{
						name: 'Get Item',
						value: 'getItem',
						description: 'Fetch a single item by ID',
					},
					{
						name: 'Get Items',
						value: 'getItems',
						description: 'Fetch items from a board',
					},
					{
						name: 'Create items',
						value: 'createItems',
						description: 'Create multiple items in a board',
					},
					{
						name: 'Delete Items',
						value: 'deleteItems',
						description: 'Delete multiple items from a board',
					},
				],
				default: 'updateItem',
				required: true,
				displayOptions: {
					show: {
						resource: ['item'],
					},
				},
			},

			{
				displayName: 'Select Item',
				name: 'selectedItem',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getItemsFromBoard',
				},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['getItem', 'getItems'],
					},
				},
				required: true,
				default: '',
				description: 'Select an item from the fetched board.',
			},
			{
				displayName: 'Item name',
				name: 'itemName',
				type: 'string',

				default: '',
				description: 'Enter the item name.',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['createItems'],
					},
				},
			},
			{
				displayName: 'Board Id',
				name: 'boardId',
				type: 'string',

				default: '',
				description: 'Enter the board ID.',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['createItems'],
					},
				},
			},
			{
				displayName: 'Column ID',
				name: 'columnId',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Column ID',
				},
				default: [],
				description: 'Enter the column to update.',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['updateItem', 'createItems', 'deleteItems'],
					},
				},
			},

			{
				displayName: 'New Value',
				name: 'newValue',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add New Value',
				},
				default: [],
				description: 'Enter the new value for the column.',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['updateItem', 'createItems', 'deleteItems'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getItemsFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const boardId = this.getCurrentNodeParameter('boardId') as string;

				if (!boardId) {
					return [];
				}

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new Error('API Key not found.');
				}

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: {
						query: `query { boards(ids: ${boardId}) { items_page { items { id name } } } }`,
					},
				});

				const parsedResponse = JSON.parse(response);
				return parsedResponse.data.boards[0].items_page.items.map(
					(item: { id: string; name: string }) => ({
						name: item.name,
						value: item.id,
					}),
				);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | null> {
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('WorktablesApi');
		const apiKey = credentials?.apiKey;

		if (!apiKey) {
			throw new Error('API Key not found.');
		}

		let response;

		if (resource === 'board') {
			const boardId = this.getNodeParameter('boardId', 0) as string;
			if (!boardId) {
				throw new Error('Board ID is required.');
			}

			const query =
				operation === 'getBoard'
					? `query { boards(ids: ${boardId}) { id name state } }`
					: `query { boards { id name state } }`;

			response = await this.helpers.request({
				method: 'POST',
				url: 'https://api.monday.com/v2',
				headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
				body: { query },
			});
		}

		if (resource === 'item') {
			const columnId = this.getNodeParameter('columnId', 0) as string[];
			const newValue = this.getNodeParameter('newValue', 0) as string[];
			const itemName = this.getNodeParameter('itemName', 0) as string;
			const boardId = this.getNodeParameter('boardId', 0) as string;

			if (operation === 'updateItem') {
				const itemId = this.getNodeParameter('selectedItem', 0) as string;
				if (!itemId || columnId.length !== newValue.length) {
					throw new Error('Invalid item data.');
				}

				const mutations = columnId.map(
					(col, i) => `
					mutation {
						change_simple_column_value(
							item_id: ${itemId},
							column_id: "${col}",
							value: "${newValue[i]}"
						) { id }
					}
				`,
				);

				response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
					body: { query: mutations.join(' ') },
				});
			} else if (operation === 'createItems') {
				const mutations = columnId.map((col, i) => {
					const columnValue = JSON.stringify({
						[col]: `${newValue[i]}`,
					});

					return `
						mutation {
							create_item(
								board_id: ${boardId},
								item_name: "${itemName}",
								column_values: ${JSON.stringify(columnValue)}
							) { id }
						}
					`;
				});

				console.log('AAAAAAa ', mutations);

				response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
					body: { query: mutations.join(' ') },
				});
				console.log({ query: mutations.join(' ') });
				console.log(JSON.stringify(response));
			}
		}

		return [[{ json: JSON.parse(response) }]];
	}
}
