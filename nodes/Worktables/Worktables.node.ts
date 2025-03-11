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
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{ name: 'Board', value: 'board', description: 'Operations related to boards' },
					{ name: 'Item', value: 'item', description: 'Operations related to items' },
					{ name: 'Subitem', value: 'subitem', description: 'Operations related to subitems' },
					{ name: 'Update', value: 'update', description: 'Operations related to updates' },
					{ name: 'Team', value: 'team', description: 'Operations related to teams' },
					{ name: 'User', value: 'user', description: 'Operations related to users' },
					{
						name: 'Query',
						value: 'query',
						description: 'Operations related to running queries',
					},
				],
				default: 'board',
				required: true,
				description: 'Select the category of actions to perform.',
			},

			// Boards Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'List boards', value: 'listBoards', description: 'List all boards' },
					{
						name: "List board's groups",
						value: 'listBoardGroups',
						description: 'List all groups in a board',
					},
					{ name: 'Create a board', value: 'createBoard', description: 'Create a new board' },
					{
						name: 'Create a group',
						value: 'createGroup',
						description: 'Create a new group in a board',
					},
					{
						name: 'Get a board',
						value: 'getBoard',
						description: 'Retrieve details of a specific board',
					},
					{
						name: 'Get a group',
						value: 'getGroup',
						description: 'Retrieve details of a specific group in a board',
					},
					{
						name: 'Duplicate a group',
						value: 'duplicateGroup',
						description: 'Duplicate an existing group in a board',
					},
					{
						name: 'Duplicate a board',
						value: 'duplicateBoard',
						description: 'Duplicate an existing board',
					},
					{
						name: 'List board activity logs',
						value: 'listBoardActivityLogs',
						description: 'Retrieve activity logs of a board',
					},
					{
						name: 'List board subscribers',
						value: 'listBoardSubscribers',
						description: 'List all subscribers of a board',
					},
					{
						name: 'Add board subscribers',
						value: 'addBoardSubscribers',
						description: 'Add subscribers to a board',
					},
					{
						name: 'Remove board subscribers',
						value: 'removeBoardSubscribers',
						description: 'Remove subscribers from a board',
					},
				],
				default: 'listBoards',
				required: true,
				displayOptions: {
					show: { resource: ['board'] },
				},
			},
			// API Query Operations - Only Run API Query
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [{ name: 'run API', value: 'query', description: 'Run a custom query' }],
				default: 'query',
				required: true,
				displayOptions: {
					show: { resource: ['query'] },
				},
			},

			// Item Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'Create an item', value: 'createItem', description: 'Create an item in a board' },
					{
						name: 'Update column values of an item',
						value: 'updateItemColumns',
						description: 'Update column values of an item',
					},
					{
						name: 'Delete an item',
						value: 'deleteItem',
						description: 'Delete an item from a board',
					},
					{
						name: 'Duplicate an item',
						value: 'duplicateItem',
						description: 'Duplicate an existing item',
					},
					{
						name: 'List items in a board',
						value: 'listBoardItems',
						description: 'List all items in a board',
					},
					{
						name: 'List items in a group',
						value: 'listGroupItems',
						description: 'List all items in a group',
					},
					{
						name: 'Search items by filter',
						value: 'searchItems',
						description: 'Search items in a board using a filter',
					},
					{
						name: 'List item subscribers',
						value: 'listItemSubscribers',
						description: 'List all subscribers of an item',
					},
					{
						name: 'Upload a file to an item column',
						value: 'uploadFileToItem',
						description: 'Upload a file to an item column',
					},
					{
						name: 'Download files from an item column',
						value: 'downloadFilesFromItem',
						description: 'Download files from an item column',
					},
				],
				default: 'createItem',
				required: true,
				displayOptions: {
					show: { resource: ['item'] },
				},
			},

			// Update Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'list', value: 'listUpdates', description: 'List updates' },
					{ name: 'create', value: 'createUpdate', description: 'Create an update' },
					{ name: 'update', value: 'updateUpdate', description: 'Update an update' },
					{ name: 'delete', value: 'deleteUpdate', description: 'Delete an update' },
					{ name: 'pin', value: 'pinUpdate', description: 'Pin an update' },
					{
						name: 'Duplicate',
						value: 'duplicateUpdate',
						description: 'Duplicate an update',
					},
					{
						name: 'upload',
						value: 'uploadFile',
						description: 'Upload a file to an update',
					},
					{
						name: 'download',
						value: 'downloadFile',
						description: 'Download a file from update',
					},
				],
				default: 'list',
				required: true,
				displayOptions: {
					show: { resource: ['update'] },
				},
			},

			// Accounts Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [{ name: 'get info', value: 'getInfoAccount', description: 'Get a info account' }],
				default: 'getInfoAccount',
				required: true,
				displayOptions: {
					show: { resource: ['account'] },
				},
			},

			// Team Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'List teams', value: 'listTeams', description: 'List all teams' },
					{
						name: 'List members of a team',
						value: 'listTeamMembers',
						description: 'List all members of a specific team',
					},
					{
						name: 'Get a team',
						value: 'getTeam',
						description: 'Retrieve details of a specific team',
					},
					{ name: 'Create a team', value: 'createTeam', description: 'Create a new team' },
					{ name: 'Delete a team', value: 'deleteTeam', description: 'Delete a specific team' },
					{ name: 'Update a team', value: 'updateTeam', description: 'Update details of a team' },
					{
						name: 'Add users to team',
						value: 'addUsersToTeam',
						description: 'Add users to a specific team',
					},
					{
						name: 'Remove users from team',
						value: 'removeUsersFromTeam',
						description: 'Remove users from a specific team',
					},
				],
				default: 'listTeams',
				required: true,
				displayOptions: {
					show: { resource: ['team'] },
				},
			},

			// Users Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{ name: 'List users', value: 'listUsers', description: 'List all users' },
					{
						name: 'Get a user',
						value: 'getUser',
						description: 'Retrieve details of a specific user',
					},
				],
				default: 'listUsers',
				required: true,
				displayOptions: {
					show: { resource: ['user'] },
				},
			},

			// API Query Actions
			{
				displayName: 'Query',
				name: 'runQuery',
				type: 'string',
				default: '',
				description: 'Enter the query to run.',
				displayOptions: { show: { resource: ['query'] } },
			},

			// Fields

			// Board Fields
			{
				displayName: 'Board Name',
				name: 'boardName',
				type: 'string',
				default: '',
				description: 'Enter the board name.',
				displayOptions: { show: { operation: ['createBoard', 'duplicateBoard'] } },
			},
			{
				displayName: 'Board Kind',
				name: 'boardKind',
				type: 'options',
				options: [
					{ name: 'Public', value: 'public' },
					{ name: 'Private', value: 'private' },
					{ name: 'Shareable', value: 'shareable' },
				],
				default: 'public',
				description: 'Select the board kind.',
				displayOptions: { show: { operation: ['createBoard'] } },
			},
			{
				displayName: 'Workspace',
				name: 'workspace',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getWorkspaces' },
				default: '',
				required: true,
				description: 'Select a workspace',
				displayOptions: { show: { operation: ['createBoard', 'duplicateBoard'] } },
			},
			{
				displayName: 'Board',
				name: 'boardId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getBoards' },
				default: '',
				required: true,
				description: 'Select a Monday board',
				displayOptions: {
					show: {
						operation: [
							'getBoard',
							'createItem',
							'createSubitem',
							'updateItem',
							'uploadFile',
							'listBoardGroups',
							'createGroup',
							'duplicateGroup',
							'duplicateBoard',
							'listBoardActivityLogs',
							'listBoardSubscribers',
							'addBoardSubscribers',
							'removeBoardSubscribers',
						],
					},
				},
			},
			{
				displayName: 'Folder',
				name: 'folder',
				type: 'options',
				typeOptions: { loadOptionsDependsOn: ['workspace'], loadOptionsMethod: 'getFolders' },
				required: true,
				default: '',
				description: 'Select a folder',
				displayOptions: { show: { operation: ['createFolder', 'duplicateBoard'] } },
			},
			{
				displayName: 'Keep subscribers',
				name: 'keepSubscribers',
				type: 'boolean',
				default: false,
				description: 'Keep subscribers when duplicating a board',
				displayOptions: { show: { operation: ['duplicateBoard'] } },
			},
			{
				displayName: 'Duplicate type',
				name: 'duplicateType',
				type: 'options',
				options: [
					{ name: 'Duplicate board with pulses', value: 'duplicate_board_with_pulses' },
					{
						name: 'Duplicate board with pulses and updates',
						value: 'duplicate_board_with_pulses_and_updates',
					},
					{
						name: 'Duplicate board with structure',
						value: 'duplicate_board_with_structure',
					},
				],
				default: 'duplicate_board_with_structure',
				displayOptions: { show: { operation: ['duplicateBoard'] } },
			},
			{
				displayName: 'Group name',
				name: 'groupName',
				type: 'string',
				default: '',
				description: 'Enter the group name.',
				displayOptions: {
					show: { operation: ['createGroup', 'duplicateGroup'] },
				},
			},
			{
				displayName: 'Group color',
				name: 'groupColor',
				type: 'options',
				options: [
					{ name: 'Grey', value: '#c4c4c4' },
					{ name: 'Working Orange', value: '#fdab3d' },
					{ name: 'Done Green', value: '#00c875' },
					{ name: 'Stuck Red', value: '#e2445c' },
					{ name: 'Dark Blue', value: '#0086c0' },
					{ name: 'Purple', value: '#a25ddc' },
					{ name: 'Grass Green', value: '#037f4c' },
					{ name: 'Bright Blue', value: '#579bfc' },
					{ name: 'Saladish', value: '#cab641' },
					{ name: 'Egg Yolk', value: '#ffcb00' },
					{ name: 'Dark Red', value: '#bb3354' },
					{ name: 'Sofia Pink', value: '#ff158a' },
					{ name: 'Lipstick', value: '#ff5ac4' },
					{ name: 'Dark Purple', value: '#784bd1' },
					{ name: 'Bright Green', value: '#9cd326' },
					{ name: 'Chili Blue', value: '#66ccff' },
					{ name: 'American Grey', value: '#808080' },
					{ name: 'Brown', value: '#7f5347' },
					{ name: 'Dark Orange', value: '#ff642e' },
				],
				default: 'blue',
				description: 'Select the group color.',
				displayOptions: {
					show: { operation: ['createGroup'] },
				},
			},
			{
				displayName: 'Remove Subcribers',
				name: 'removeSubscribers',
				typeOptions: {
					loadOptionsMethod: 'getSubscribersFromBoard',
					loadOptionsDependsOn: ['boardId'],
				},
				type: 'multiOptions',
				default: [],
				description: 'Select subscribers',
				displayOptions: {
					show: { operation: ['removeBoardSubscribers'] },
				},
			},
			{
				displayName: 'Add Subcribers',
				name: 'emails',
				type: 'string',
				default: '',
				description: 'Enter the email of the subscriber',
				hint: 'Separate multiple emails with a comma',
				displayOptions: {
					show: { operation: ['addBoardSubscribers'] },
				},
			},
			{
				displayName: 'Is guest',
				name: 'isGuest',
				type: 'boolean',
				default: false,
				description: 'Activate to add the user as a guest',
				displayOptions: {
					show: { operation: ['addBoardSubscribers'] },
				},
			},

			// Item Fields
			{
				displayName: 'Item',
				name: 'itemId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['boardId'],
					loadOptionsMethod: 'getItemsFromBoard',
				},
				default: '',
				required: true,
				description: 'Select an item from the selected board',
				displayOptions: {
					show: { operation: ['updateItem', 'getItem', 'createSubitem', 'uploadFile'] },
				},
			},

			// Toggle parent item
			{
				displayName: 'Is subitem',
				name: 'showSubitems',
				type: 'boolean',
				default: false,
				description: 'Activate to show parent item options',
				displayOptions: {
					show: { operation: ['createItem', 'updateItem', 'getItem'] },
				},
			},

			// Parent Item Fields
			{
				displayName: 'Parent item',
				name: 'parentId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['boardId'],
					loadOptionsMethod: 'getItemsFromBoard',
				},
				default: '',
				required: true,
				description: 'Select an item from the selected board',
				displayOptions: {
					show: {
						operation: ['createItem', 'updateItem', 'getItem'], // Exibe apenas para essas operações
						showSubitems: [true], // Exibe apenas se o toggle "Is subitem" for ativado
					},
				},
			},
			// Subitem Fields
			{
				displayName: 'Subitem',
				name: 'subitemId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['parentId'],
					loadOptionsMethod: 'getSubitems',
				},
				default: '',
				required: true,
				description: 'Select an item from the selected board',
				displayOptions: {
					show: {
						operation: ['createItem', 'updateItem', 'getItem'], // Exibe apenas para essas operações
						showSubitems: [true], // Exibe apenas se o toggle "Is subitem" for ativado
					},
				},
			},

			{
				displayName: 'Group',
				name: 'groupId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['boardId'],
					loadOptionsMethod: 'getGroupsFromBoard',
				},
				default: '',
				required: true,
				description: 'Select an item from the selected board',
				displayOptions: {
					show: { operation: ['createItem', 'duplicateGroup'] }, // before resource: ['item']
				},
			},
			{
				displayName: 'Item Name',
				name: 'itemName',
				type: 'string',
				default: '',
				description: 'Enter the item name.',
				displayOptions: {
					show: {
						resource: ['item', 'subitem'],
						operation: ['createItem', 'createSubitem'],
					},
				},
			},
			{
				displayName: 'Column Values',
				name: 'columnValues',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: [],
				displayOptions: {
					show: {
						resource: ['item', 'subitem'],
						operation: ['createItem', 'updateItem', 'createSubitem'],
					},
				},
				options: [
					{
						displayName: 'Column Value',
						name: 'columnValue',
						values: [
							{
								displayName: 'Column ID',
								name: 'columnId',
								type: 'options',
								typeOptions: {
									loadOptionsDependsOn: ['showSubitems'],
									loadOptionsMethod: 'getColumnsDynamic',
								},
								default: '',
							},
							{
								displayName: 'New Value',
								name: 'newValue',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Column Values',
				name: 'columnValuesUploadFile',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: [],
				displayOptions: {
					show: {
						resource: ['item', 'subitem'],
						operation: ['uploadFile'],
					},
				},
				options: [
					{
						displayName: 'Column Value',
						name: 'columnValuesUploadFile',
						values: [
							{
								displayName: 'Column ID',
								name: 'columnId',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getColumnsFromBoard',
								},
								default: '',
							},
							{
								displayName: 'File name',
								name: 'fileName',
								type: 'string',
								required: true,
								default: '',
							},
						],
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getWorkspaces() {
				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new Error('API Key not found.');
				}

				const allWorkspace: { name: string; value: string }[] = [];
				let page = 1;
				const limit = 100;
				let hasMore = true;

				while (hasMore) {
					const responseData = await this.helpers.request({
						method: 'POST',
						url: 'https://api.monday.com/v2',
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							query: `{ workspaces (limit: ${limit}, page: ${page}) { id name } }`,
						}),
					});
					const workspaces = JSON.parse(responseData).data.workspaces;
					if (workspaces.length > 0) {
						allWorkspace.push(
							...workspaces.map((workspace: any) => ({
								name: workspace.name,
								value: workspace.id,
							})),
						);
						page++;
					} else {
						hasMore = false;
					}
				}

				return allWorkspace;
			},
			async getBoards() {
				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new Error('API Key not found.');
				}

				const allBoards: { name: string; value: string }[] = [];
				let page = 1;
				const limit = 100;
				let hasMore = true;

				while (hasMore) {
					const responseData = await this.helpers.request({
						method: 'POST',
						url: 'https://api.monday.com/v2',
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							query: `{ boards(limit: ${limit}, page: ${page}) { id name } }`,
						}),
					});

					const boards = JSON.parse(responseData).data.boards;
					if (boards.length > 0) {
						allBoards.push(...boards.map((board: any) => ({ name: board.name, value: board.id })));
						page++;
					} else {
						hasMore = false;
					}
				}

				return allBoards;
			},
			async getGroupsFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Groups');
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
						query: `query { boards(ids: ${boardId}) { groups  { id  title} } }`,
					},
				});

				const parsedResponse = JSON.parse(response);
				return parsedResponse.data.boards[0].groups.map((item: { id: string; title: string }) => ({
					name: item.title,
					value: item.id,
				}));
			},
			async getItemsFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Items');
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
						query: `query { boards(ids: ${boardId}) { items_page (limit: 500) { items { id name } } } }`,
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
			async getSubitemFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Subitems');
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
						query: `query { boards(ids: ${boardId}) { items_page items { subitems { id name } } } }`,
					},
				});

				const parsedResponse = JSON.parse(response);

				return parsedResponse.data.boards[0].items_page.items[0].subitems.map(
					(item: { id: string; name: string }) => ({
						name: item.name,
						value: item.id,
					}),
				);
			},
			async getColumnsFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Columns');
				const boardId = this.getCurrentNodeParameter('boardId') as string;
				const operation = this.getNodeParameter('operation', 0) as string;

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
					body: JSON.stringify({
						query: `query { boards(ids: ${boardId}) { columns { id title type } } }`,
					}),
				});

				const parsedResponse = JSON.parse(response);

				return parsedResponse.data.boards[0].columns.map(
					(column: { id: string; title: string; type: string }) => {
						if (operation === 'uploadFile') {
							if (column.type === 'file') {
								return {
									name: column.title,
									value: column.id,
								};
							}
						}

						return {
							name: column.title,
							value: column.id,
						};
					},
				);
			},
			async getSubscribersFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Subscribers');
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
					body: JSON.stringify({
						query: `query { boards(ids: ${boardId}) { subscribers { id name } } }`,
					}),
				});

				const parsedResponse = JSON.parse(response);

				return parsedResponse.data.boards[0].subscribers.map(
					(subscriber: { id: string; name: string }) => ({
						name: subscriber.name,
						value: subscriber.id,
					}),
				);
			},
			async getSubitems(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const itemId = this.getNodeParameter('parentId') as string;

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
					body: JSON.stringify({
						query: `query {
							items (ids: [${itemId}]) {
								subitems {
									id
									name
								}
							}
						}`,
					}),
				});

				const parsedResponse = JSON.parse(response);

				return parsedResponse.data.items[0].subitems.map((subitem: any) => ({
					name: subitem.name,
					value: subitem.id,
				}));
			},
			async getColumnsDynamic(this: ILoadOptionsFunctions) {
				const showSubitems = this.getNodeParameter('showSubitems', 0) as boolean;
				if (showSubitems) {
					const parentId = this.getNodeParameter('parentId') as string;
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
						body: JSON.stringify({
							query: `
							query {
										items(ids: ${parentId}) {
											subitems {
											column_values {
												column {
												title
												id
												}
											}
											}
										}
									}`,
						}),
					});

					const parsedResponse = JSON.parse(response);
					return parsedResponse.data.items[0].subitems[0].column_values.map(
						(column: { column: { id: string; title: string; type: string } }) => ({
							name: column.column.title,
							value: column.column.id,
						}),
					);
				} else {
					console.log('Getting Columns');
					const boardId = this.getCurrentNodeParameter('boardId') as string;
					const operation = this.getNodeParameter('operation', 0) as string;

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
						body: JSON.stringify({
							query: `query { boards(ids: ${boardId}) { columns { id title type } } }`,
						}),
					});

					const parsedResponse = JSON.parse(response);

					return parsedResponse.data.boards[0].columns.map(
						(column: { id: string; title: string; type: string }) => {
							if (operation === 'uploadFile') {
								if (column.type === 'file') {
									return {
										name: column.title,
										value: column.id,
									};
								}
							}

							return {
								name: column.title,
								value: column.id,
							};
						},
					);
				}
			},
			async getFolders(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const workspaceId = this.getNodeParameter('workspace') as string;
				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				console.log('Getting Folders');
				if (!apiKey) {
					throw new Error('API Key not found.');
				}

				const allFolders: { name: string; value: string }[] = [];
				let page = 1;
				const limit = 100;
				let hasMore = true;

				console.log(
					`{ folders (limit: ${limit}, page: ${page}, workspace_id: ${workspaceId}) { id name } }`,
				);
				while (hasMore) {
					const responseData = await this.helpers.request({
						method: 'POST',
						url: 'https://api.monday.com/v2',
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
						body: {
							query: `{ folders (limit: ${limit}, page: ${page}, workspace_ids: ${workspaceId}) { id name } }`,
						},
					});

					const folders = JSON.parse(responseData).data.folders;
					if (folders.length > 0) {
						allFolders.push(
							{ name: 'None', value: '-1' },
							...folders.map((folder: any) => ({
								name: folder.name,
								value: folder.id,
							})),
						);
						page++;
					} else {
						hasMore = false;
					}
				}

				return allFolders;
			},
			async getUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new Error('API Key not found.');
				}

				const allUsers: { name: string; value: string }[] = [];
				let page = 1;
				const limit = 100;
				let hasMore = true;

				while (hasMore) {
					const responseData = await this.helpers.request({
						method: 'POST',
						url: 'https://api.monday.com/v2',
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
						body: {
							query: `{ users (limit: ${limit}, page: ${page}) { id name } }`,
						},
					});

					const users = JSON.parse(responseData).data.users;
					if (users.length > 0) {
						allUsers.push(
							...users.map((user: any) => ({
								name: user.name,
								value: user.id,
							})),
						);
						page++;
					} else {
						hasMore = false;
					}
				}

				return allUsers;
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
		const headers = {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		};

		switch (resource) {
			case 'board': {
				switch (operation) {
					case 'createBoard': {
						const boardName = this.getNodeParameter('boardName', 0) as string;
						const boardKind = this.getNodeParameter('boardKind', 0) as string;
						const workspace = this.getNodeParameter('workspace', 0) as string;

						const mutation = `
						mutation {
							create_board(
								board_name: "${boardName}",
								board_kind: ${boardKind},
								workspace_id: ${workspace}
								
							) { id }
						}
					`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}
					case 'duplicateBoard': {
						console.log('Duplicating Board');
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const duplicateType = this.getNodeParameter('duplicateType', 0) as string; // 'public' ou 'private'
						const boardName = this.getNodeParameter('boardName', 0) as string;
						const keepSubscribers = this.getNodeParameter('keepSubscribers', 0) as boolean;
						const folder = this.getNodeParameter('folder', 0) as string;

						if (!boardId) {
							throw new Error('Board ID is required.');
						}

						if (!apiKey) {
							throw new Error('API Key not found.');
						}

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {
								query: `mutation {
							duplicate_board(board_id: ${boardId}, duplicate_type: ${duplicateType}, board_name: "${boardName}", keep_subscribers: ${keepSubscribers}  
							${folder === '-1' ? '' : `, folder_id: ${folder}`}) {
									board {
										id
										name
									}
								}
							}`,
							},
						});
						break;
					}
					case 'duplicateGroup': {
						console.log('Duplicating Group');
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const groupId = this.getNodeParameter('groupId', 0) as string;
						const groupName = this.getNodeParameter('groupName', 0) as string;

						if (!boardId || !groupId) {
							throw new Error('Board ID and Group ID are required.');
						}

						if (!apiKey) {
							throw new Error('API Key not found.');
						}
						console.log(`mutation {
								duplicate_group(board_id: ${boardId}, group_id: "${groupId}", group_title: ${groupName}) {
									id
									title
								}
								}`);
						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {
								query: `mutation {
									duplicate_group(board_id: ${boardId}, group_id: "${groupId}", group_title: "${groupName}") {
										id
										title
									}
								}`,
							},
						});
						break;
					}
					case 'addBoardSubscribers': {
						console.log('Adding Subscribers');
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const emails = this.getNodeParameter('emails', 0) as string;
						const isGuest = this.getNodeParameter('isGuest', 0) as boolean;

						console.log(boardId, emails, isGuest);

						if (!boardId) {
							throw new Error('Board ID is required.');
						}
						console.log('Adding Subscribers');

						if (!apiKey) {
							throw new Error('API Key not found.');
						}
						console.log('Adding Subscribers');
						let response = [];
						for (const email of emails.split(',')) {
							try {
								console.log('Adding Subscribers');
								const body = {
									members: [
										{
											email,
											item: {
												name: email,
												is_guest: isGuest,
											},
										},
									],
								};
								await this.helpers.request({
									method: 'POST',
									url: 'http://157.230.215.102:8080/api/monday-api',
									body: {
										url: `/projects/${boardId}/subscribers`,
										message: 'POST',
										body: JSON.stringify(body),
									},
								});

								response.push({ email, send: true });
							} catch (error) {
								console.log('Error: ', error);
								response.push({ email, send: false });
							}
						}
						console.log('Adding Subscribers', JSON.stringify(response, null, 2));
						return [
							[
								{
									json: {
										response,
									},
								},
							],
						];
						break;
					}
					case 'listBoards': {
						console.log('List boards: ');
						const query = `
						query {
							boards {
								id
								name
							}
						}
						`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});

						break;
					}
					case 'listBoardGroups': {
						const boardId = this.getNodeParameter('boardId', 0) as string;

						const query = `
						query {
							boards(ids: [${boardId}]) {
								groups {
									id
									title
								}
							}
						}
						`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}
					case 'getBoard': {
						const boardId = this.getNodeParameter('boardId', 0) as string;

						const query = `
						query {
							boards(ids: [${boardId}]) {
								id
								name
								description
							}
						}
						`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}
					case 'getGroup': {
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const groupId = this.getNodeParameter('groupId', 0) as string;

						const query = `
						query {
							boards(ids: [${boardId}]) {
								groups(ids: ["${groupId}"]) {
									id
									title
								}
							}
						}
						`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}
					case 'listBoardActivityLogs': {
						const boardId = this.getNodeParameter('boardId', 0) as string;

						const query = `
						query {
							boards(ids: [${boardId}]) {
								activity_logs {
									id
									event
									created_at
								}
							}
						}
						`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}
					case 'listBoardSubscribers': {
						const boardId = this.getNodeParameter('boardId', 0) as string;

						const query = `
						query {
							boards(ids: [${boardId}]) {
								subscribers {
									id
									name
									email
								}
							}
						}
						`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}
					case 'removeBoardSubscribers': {
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const userIds = this.getNodeParameter('removeSubscribers', 0) as string;

						const mutation = `
						mutation {
							delete_subscribers_from_board(
								board_id: ${boardId},
								user_ids: [${userIds}]
							) {
								id
							}
						}
						`;

						console.log('Remove subscribers: ', mutation);

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}
					case 'createGroup': {
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const groupName = this.getNodeParameter('groupName', 0) as string;
						const groupColor = this.getNodeParameter('groupColor', 0) as string;

						const mutation = `
						mutation {
							create_group(
								board_id: ${boardId},
								group_name: "${groupName}",
								group_color: "${groupColor}"
							) {
								id
								title
							}
						}
						`;

						console.log('Create group: ', mutation);

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}
				}
				break;
			}

			case 'item': {
				switch (operation) {
					case 'updateItem': {
						console.log('Update item: ');
						const columnValues = this.getNodeParameter('columnValues', 0) as {
							columnValue: {
								columnId: string;
								newValue: string;
							}[];
						};
						if (!columnValues || columnValues.columnValue.length === 0) {
							throw new Error('Column values are required.');
						}
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const boardId = this.getNodeParameter('boardId', 0) as string;
						if (!itemId) {
							throw new Error('Invalid item data. Item ID is required.');
						}

						const mutations = columnValues.columnValue
							.map(
								({ columnId, newValue }) => `
									change_simple_column_value(
										board_id: ${boardId},
										item_id: ${itemId},
										column_id: "${columnId}",
										value: "${newValue}"
									) { id }`,
							)
							.join(' ');

						const mutationQuery = `mutation { ${mutations} }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutationQuery },
						});
						break;
					}
					case 'createItem': {
						const itemName = this.getNodeParameter('itemName', 0) as string;
						const groupId = this.getNodeParameter('groupId', 0) as string;
						const parentId = this.getNodeParameter('parentId', 0) as string;
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const columnValues = this.getNodeParameter('columnValues', 0) as {
							columnValue: {
								columnId: string;
								newValue: string;
							}[];
						};
						let column_values = '{}';
						if (columnValues?.columnValue?.length > 0) {
							column_values = `{ ${columnValues.columnValue
								.map((columnValue) =>
									JSON.stringify({ [columnValue.columnId]: columnValue.newValue }),
								)
								.join(', ')
								.replace(/{/g, '')
								.replace(/}/g, '')} }`;
						}

						const mutation = parentId
							? `mutation {
									create_subitem(
										parent_item_id: ${parentId},
										item_name: "${itemName}",
										column_values: ${JSON.stringify(column_values)}
									) { id }
								}`
							: `mutation {
									create_item(
										board_id: ${boardId},
										item_name: "${itemName}",
										group_id: "${groupId}",
										column_values: ${JSON.stringify(column_values)}
									) { id }
								}`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});

						break;
					}
					case 'updateColumnValues': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const columnValues = this.getNodeParameter('columnValues', 0) as string;

						if (!itemId || !boardId) {
							throw new Error('Item ID and Board ID are required.');
						}

						const mutation = `
							mutation {
								change_multiple_column_values(
									board_id: ${boardId},
									item_id: ${itemId},
									column_values: ${JSON.stringify(columnValues)}
								) { id }
							}`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}
					case 'deleteItem': {
						console.log('Delete an item');

						const itemId = this.getNodeParameter('itemId', 0) as string;

						if (!itemId) {
							throw new Error('Item ID is required.');
						}

						const mutation = `
							mutation {
								delete_item(item_id: ${itemId}) { id }
							}`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'duplicateItem': {
						console.log('Duplicate an item');

						const itemId = this.getNodeParameter('itemId', 0) as string;
						const boardId = this.getNodeParameter('boardId', 0) as string;

						if (!itemId || !boardId) {
							throw new Error('Item ID and Board ID are required.');
						}

						const mutation = `
							mutation {
								duplicate_item(
									item_id: ${itemId},
									board_id: ${boardId}
								) { id }
							}`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'listItemsInBoard': {
						console.log('List items in a board');

						const boardId = this.getNodeParameter('boardId', 0) as string;

						if (!boardId) {
							throw new Error('Board ID is required.');
						}

						const query = `
							query {
								boards(ids: ${boardId}) {
									items { id name }
								}
							}`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}
					default:
						throw new Error(`Unsupported operation: ${operation}`);
				}
				break;
			}

			case 'update': {
				switch (operation) {
					case 'listItemUpdates': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const query = `
						query {
							items (ids: [${itemId}]) {
								updates {
									id
									text_body
									created_at
								}
							}
						}
					`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}

					case 'createUpdate': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const body = this.getNodeParameter('body', 0) as string;

						const mutation = `
						mutation {
							create_update (item_id: ${itemId}, body: "${body}") {
								id
							}
						}
					`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'updateUpdate': {
						const updateId = this.getNodeParameter('updateId', 0) as string;
						const body = this.getNodeParameter('body', 0) as string;

						const mutation = `
						mutation {
							update_update (id: ${updateId}, body: "${body}") {
								id
							}
						}
					`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'deleteUpdate': {
						const updateId = this.getNodeParameter('updateId', 0) as string;

						const mutation = `
						mutation {
							delete_update (id: ${updateId}) {
								id
							}
						}
					`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'pinUpdate': {
						const updateId = this.getNodeParameter('updateId', 0) as string;

						const mutation = `
						mutation {
							pin_update (id: ${updateId}) {
								id
								pinned
							}
						}
					`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'uploadFileToUpdate': {
						const updateId = this.getNodeParameter('updateId', 0) as string;
						const file = this.getNodeParameter('file', 0) as string;

						const mutation = `
						mutation($file: File!) {
							add_file_to_update (update_id: ${updateId}, file: $file) {
								id
							}
						}
					`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation, variables: { file } },
						});
						break;
					}

					case 'downloadFileFromUpdate': {
						const fileId = this.getNodeParameter('fileId', 0) as string;

						const query = `
						query {
							assets (ids: [${fileId}]) {
								public_url
							}
						}
					`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}
					default:
						throw new Error(`Unsupported operation: ${operation}`);
				}
				break;
			}

			case 'team': {
				switch (operation) {
					case 'listTeams': {
						const query = `query { teams { id name users { id name email } } }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}

					case 'getTeam': {
						const teamId = this.getNodeParameter('teamId', 0) as string;

						const query = `query { teams(ids: [${teamId}]) { id name users { id name email } } }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						break;
					}

					case 'createTeam': {
						const teamName = this.getNodeParameter('teamName', 0) as string;

						const mutation = `mutation { create_team(name: "${teamName}") { id name } }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'deleteTeam': {
						const teamId = this.getNodeParameter('teamId', 0) as string;

						const mutation = `mutation { delete_team(id: ${teamId}) { id } }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'updateTeam': {
						const teamId = this.getNodeParameter('teamId', 0) as string;
						const newName = this.getNodeParameter('newName', 0) as string;

						const mutation = `mutation { update_team(id: ${teamId}, name: "${newName}") { id name } }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'addUsersToTeam': {
						const teamId = this.getNodeParameter('teamId', 0) as string;
						const userIds = this.getNodeParameter('userIds', 0) as string;

						const mutation = `mutation { add_users_to_team(team_id: ${teamId}, user_ids: [${userIds}]) { id } }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'removeUsersFromTeam': {
						const teamId = this.getNodeParameter('teamId', 0) as string;
						const userIds = this.getNodeParameter('userIds', 0) as string;

						const mutation = `mutation { remove_users_from_team(team_id: ${teamId}, user_ids: [${userIds}]) { id } }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}
				}
				break;
			}

			case 'query': {
				const runQuery = this.getNodeParameter('runQuery', 0) as string[];
				if (!runQuery) {
					throw new Error('Invalid item data.');
				}
				switch (operation) {
					case 'query': {
						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: runQuery },
						});
						break;
					}

					default:
						throw new Error(`Unsupported operation: ${operation}`);
				}
				break;
			}

			default:
				throw new Error(`Unsupported resource: ${resource}`);
		}

		return [[{ json: JSON.parse(response) }]];
	}
}
