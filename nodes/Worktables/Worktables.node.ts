/* eslint-disable n8n-nodes-base/node-param-options-type-unsorted-items */
/* eslint-disable n8n-nodes-base/node-class-description-outputs-wrong */
/* eslint-disable n8n-nodes-base/node-class-description-inputs-wrong-regular-node */
/* eslint-disable n8n-nodes-base/node-param-default-wrong-for-options */
/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options */
/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */

import {
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IExecuteFunctions,
	INodeExecutionData,
	NodeApiError,
	IDataObject,
} from 'n8n-workflow';
import { parseApiResponse } from '../../utils/isErrorResponse';
import FormData from 'form-data';
import axios from 'axios';
import { parseValue } from '../../utils/parseValue';

import countryCodes from '../../utils/country_codes.json';

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
		usableAsTool: true,
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
		codex: {
			categories: ['Collaboration'],
			subcategories: {
				Collaboration: [''],
			},
			alias: ['monday', 'boards', 'work management'],
			resources: {
				primaryDocumentation: [
					{
						url: '',
					},
				],
				credentialDocumentation: [
					{
						url: '',
					},
				],
			},
		},
		// ...

		properties: [
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,

				options: [
					{ name: 'Item', value: 'item', description: 'Operations related to items' },
					{ name: 'Board', value: 'board', description: 'Operations related to boards' },
					{ name: 'Subitem', value: 'subitem', description: 'Operations related to subitems' },
					{ name: 'Update', value: 'update', description: 'Operations related to updates' },
					{ name: 'Team', value: 'team', description: 'Operations related to teams' },
					{ name: 'User', value: 'user', description: 'Operations related to users' },
					{
						name: 'Download File',
						value: 'downloadFile',
						description: 'Download a file from Monday.com',
					},
					{ name: 'Query', value: 'query', description: 'Operations related to running queries' },
				],
				default: 'board',
				required: true,
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			},

			// Boards Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,

				options: [
					{
						name: 'List Boards',
						value: 'listBoards',
						description: 'List all boards',
						action: 'List boards',
					},
					{
						name: "List Board's Groups",
						value: 'listBoardGroups',
						description: 'List all groups in a board',
						action: 'List group',
					},
					{
						name: 'Create a Board',
						value: 'createBoard',
						description: 'Create a new board',
						action: 'Create a board',
					},
					{
						name: 'Create a Group',
						value: 'createGroup',
						description: 'Create a new group in a board',
						action: 'Create a group',
					},
					{
						name: 'Get a Board',
						value: 'getBoard',
						description: 'Retrieve details of a specific board',
						action: 'Get a board',
					},
					{
						name: 'Get a Group',
						value: 'getGroup',
						description: 'Retrieve details of a specific group in a board',
						action: 'Get a group',
					},
					{
						name: 'Duplicate a Group',
						value: 'duplicateGroup',
						description: 'Duplicate an existing group in a board',
						action: 'Duplicate a group',
					},
					{
						name: 'Duplicate a Board',
						value: 'duplicateBoard',
						description: 'Duplicate an existing board',
						action: 'Duplicate a board',
					},
					{
						name: 'List Board Activity Logs',
						value: 'listBoardActivityLogs',
						description: 'Retrieve activity logs of a board',
						action: 'List board activity logs',
					},
					{
						name: 'List Board Subscribers',
						value: 'listBoardSubscribers',
						description: 'List all subscribers of a board',
						action: 'List board subscribers',
					},
					{
						name: 'Add Board Subscribers',
						value: 'addBoardSubscribers',
						description: 'Add subscribers to a board',
						action: 'Add board subscribers',
					},
					{
						name: 'Remove Board Subscribers',
						value: 'removeBoardSubscribers',
						description: 'Remove subscribers from a board',
						action: 'Remove board subscribers',
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
				noDataExpression: true,
				options: [
					{
						name: 'Run API',
						value: 'query',
						description: 'Run a custom query',
						action: 'Run API query',
					},
				],
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
				noDataExpression: true,
				options: [
					{
						name: 'Get an Item',
						value: 'getItem',
						description: 'Retrieve details of a specific item',
						action: 'Get an item',
					},
					{
						name: 'Create an Item',
						value: 'createItem',
						description: 'Create an item in a board',
						action: 'Create an item',
					},
					{
						name: 'Update Column Values of an Item',
						value: 'updateItem',
						action: 'Update column values of an item',
					},
					{
						name: 'Create or Update Item',
						value: 'createOrUpdateItem',
						description: 'Create a new item or update existing one based on item ID',
						action: 'Create or update an item',
					},
					{
						name: 'Delete an Item',
						value: 'deleteItem',
						description: 'Delete an item from a board',
						action: 'Delete an item',
					},
					{
						name: 'Duplicate an Item',
						value: 'duplicateItem',
						description: 'Duplicate an existing item',
						action: 'Duplicate an item',
					},
					{
						name: 'List Items in a Board',
						value: 'listBoardItems',
						description: 'List all items in a board',
						action: 'List items in a board',
					},
					{
						name: 'List Items in a Group',
						value: 'listGroupItems',
						description: 'List all items in a group',
						action: 'List items in a group',
					},
					{
						name: 'Search Items by Filter',
						value: 'searchItems',
						description: 'Search items in a board using a filter',
						action: 'Search items by filter',
					},
					/* {
						name: 'Advanced Search Items',
						value: 'searchItemsAdvanced',
						description: 'Advanced search with date ranges, numeric comparisons, and complex filters',
						action: 'Advanced search items',
					}, */
					{
						name: 'List Item Subscribers',
						value: 'listItemSubscribers',
						description: 'List all subscribers of an item',
						action: 'List item subscribers',
					},
					{
						name: 'Upload files to column',
						value: 'uploadItemFile',
						action: 'Upload files to column',
					},
				],
				default: 'createOrUpdateItem',
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
				noDataExpression: true,
				options: [
					{
						name: 'List',
						value: 'listUpdates',
						description: 'List updates',
						action: 'List an update',
					},
					{
						name: 'Create',
						value: 'createUpdate',
						description: 'Create an update',
						action: 'Create an update',
					},
					{
						name: 'Update',
						value: 'updateUpdate',
						description: 'Update an update',
						action: 'Update an update',
					},
					{
						name: 'Delete',
						value: 'deleteUpdate',
						description: 'Delete an update',
						action: 'Delete an update',
					},
					{
						name: 'Pin',
						value: 'pinUpdate',
						description: 'Pin an update',
						action: 'Pin an update',
					},
					{
						name: 'Duplicate',
						value: 'duplicateUpdate',
						description: 'Duplicate an update',
						action: 'Duplicate an update',
					},
					{
						name: 'Upload files to update',
						value: 'uploadFile',
						description: 'Upload a file to an update',
						action: 'Upload files to update',
					},
				],
				default: 'listUpdates',
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
				noDataExpression: true,
				options: [
					{
						name: 'Get Info',
						value: 'getInfoAccount',
						description: 'Get a info account',
						action: 'Get info an account',
					},
				],
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
				noDataExpression: true,
				options: [
					{
						name: 'List Teams',
						value: 'listTeams',
						description: 'List all teams',
						action: 'List teams',
					},
					{
						name: 'Get a Team',
						value: 'getTeam',
						description: 'Retrieve details of a specific team',
						action: 'Get a team',
					},
					{
						name: 'Create a Team',
						value: 'createTeam',
						description: 'Create a new team',
						action: 'Create a team',
					},
					{
						name: 'Delete a Team',
						value: 'deleteTeam',
						description: 'Delete a specific team',
						action: 'Delete a team',
					},
					// Commented out to hide this operation
					/* {
						name: 'Update a Team',
						value: 'updateTeam',
						description: 'Update details of a team',
						action: 'Update a team',
					}, */
					{
						name: 'Add Users to Team',
						value: 'addUsersToTeam',
						description: 'Add users to a specific team',
						action: 'Add users to team',
					},
					{
						name: 'Remove Users From Team',
						value: 'removeUsersFromTeam',
						description: 'Remove users from a specific team',
						action: 'Remove users from team',
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
				noDataExpression: true,
				options: [
					{
						name: 'List Users',
						value: 'listUsers',
						description: 'List all users',
						action: 'List users',
					},
					{
						name: 'Get a User',
						value: 'getUser',
						description: 'Retrieve details of a specific user',
						action: 'Get a user',
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
				description: 'Enter the query to run',
				displayOptions: { show: { resource: ['query'] } },
			},

			// Download File Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Download File',
						value: 'downloadFile',
						description: 'Download a file from Monday.com',
						action: 'Download a file',
					},
				],
				displayOptions: {
					show: { resource: ['downloadFile'] },
				},
				default: 'downloadFile',
			},

			// Fields

			// Item subscribers
			{
				displayName: 'Item ID',
				name: 'itemId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['listItemSubscribers'],
					},
				},
			},

			// Download File Fields
			{
				displayName: 'Asset ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				description: 'Enter the asset ID to download',
				displayOptions: {
					show: { operation: ['downloadFile'] },
				},
			},

			// Board Fields

			{
				displayName: 'Workspace',
				name: 'workspace',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getWorkspaces' },
				default: '',
				required: true,
				description:
					'Select a workspace. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['createBoard', 'listBoardGroups'],
					},
				},
			},

			{
				displayName: 'New Board Name', // Board Name
				name: 'boardName',
				type: 'string',
				default: '',
				description: 'Enter the board name',
				displayOptions: { show: { operation: ['createBoard', 'duplicateBoard'] } },
			},

			{
				displayName: 'Board Kind',
				name: 'boardKind',
				type: 'options',
				options: [
					{ name: 'Public', value: 'public' },
					{ name: 'Private', value: 'private' },
					{ name: 'Shareable', value: 'share' },
				],
				default: 'public',
				description: 'Select the board kind',
				displayOptions: { show: { operation: ['createBoard'] } },
			},
			{
				displayName: 'Board Kind',
				name: 'boardKind',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' }, // Add just `getBoards`
					{ name: 'Public', value: 'public' },
					{ name: 'Private', value: 'private' },
					{ name: 'Shareable', value: 'share' },
				],
				default: 'all',
				description: 'Select the board kind',
				displayOptions: { show: { operation: ['listBoards'] } },
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Enter the board description',
				displayOptions: { show: { operation: ['createBoard'] } },
			},
			{
				displayName: 'Template ID',
				name: 'templateId',
				type: 'string',
				default: '',
				description: 'Enter the template ID',
				displayOptions: { show: { operation: ['createBoard'] } },
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				options: [
					{ name: 'None', value: 'none' },
					{ name: 'Name', value: 'created_at' },
					{ name: 'Newest', value: 'used_at' },
				],
				default: 'none',
				hint: 'The order in which to retrieve your boards. (desc)',
				description: 'Select the order of the boards',
				displayOptions: { show: { operation: ['listBoards'] } },
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Active', value: 'active' },
					{ name: 'Archived', value: 'archived' },
					{ name: 'Deleted', value: 'deleted' },
				],
				default: 'active',
				description: 'Select the state of the boards',
				displayOptions: { show: { operation: ['listBoards'] } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
				hint: 'If 0 is provided, all boards will be returned',
				displayOptions: { show: { operation: ['listBoards'] } },
			},
			{
				displayName: 'Filter by Workspace',
				name: 'filterByWorkspace',
				type: 'boolean',
				default: false,
				description:
					'Whether to filter the boards by workspace. If enabled, you must select a workspace.',
				displayOptions: {
					show: { operation: ['listBoards'] },
				},
			},
			{
				displayName: 'Workspace',
				name: 'workspace',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getWorkspaces' },
				default: '',
				description:
					'Select a workspace. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['listBoards'],
						filterByWorkspace: [true],
					},
				},
			},
			{
				displayName: 'Board',
				name: 'boardId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBoards',
					// loadOptionsDependsOn: ['workspace', 'limit', 'state', 'orderBy', 'boardKind'],
				},
				default: '',
				required: true,
				description:
					'Select a Monday board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: [
							'getBoard',
							'createSubitem',
							'createItem',
							'updateItem',
							'createOrUpdateItem',
							'listBoardGroups',
							'createGroup',
							'duplicateGroup',
							'listBoardSubscribers',
							'addBoardSubscribers',
							'listBoardActivityLogs',
							'removeBoardSubscribers',
							'listGroupItems',
						],
					},
				},
			},
			{
				displayName: 'Board to Duplicate',
				name: 'boardId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBoards',
					// loadOptionsDependsOn: ['workspace', 'limit', 'state', 'orderBy', 'boardKind'],
				},
				default: '',
				required: true,
				description:
					'Select a Monday board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['duplicateBoard'],
					},
				},
			},
			{
				displayName: 'Destination Workspace',
				name: 'workspace',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getWorkspaces' },
				default: '',
				required: true,
				description:
					'Select a workspace. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['duplicateBoard'],
					},
				},
			},
			{
				displayName: 'Destination Folder',
				name: 'folder',
				type: 'options',
				typeOptions: { loadOptionsDependsOn: ['workspace'], loadOptionsMethod: 'getFolders' },
				required: true,
				default: '',
				description:
					'Select a folder. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: { show: { operation: ['duplicateBoard'] } },
			},
			{
				displayName: 'Folder ID',
				name: 'folder',
				type: 'options',
				typeOptions: { loadOptionsDependsOn: ['workspace'], loadOptionsMethod: 'getFolders' },
				required: true,
				default: '',
				description:
					'Select a folder. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: { show: { operation: ['createBoard'] } },
			},
			{
				displayName: 'Keep Subscribers',
				name: 'keepSubscribers',
				type: 'boolean',
				default: false,
				description: 'Whether to keep subscribers when duplicating a board',
				displayOptions: { show: { operation: ['duplicateBoard'] } },
			},
			{
				displayName: 'Duplicate Type',
				name: 'duplicateType',
				type: 'options',
				options: [
					{ name: 'Duplicate Board with Pulses', value: 'duplicate_board_with_pulses' },
					{
						name: 'Duplicate Board with Pulses and Updates',
						value: 'duplicate_board_with_pulses_and_updates',
					},
					{
						name: 'Duplicate Board with Structure',
						value: 'duplicate_board_with_structure',
					},
				],
				default: 'duplicate_board_with_structure',
				displayOptions: { show: { operation: ['duplicateBoard'] } },
			},
			{
				displayName: 'Group',
				name: 'groupId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['boardId'],
					loadOptionsMethod: 'getGroupsFromBoard',
				},
				default: 'topics',
				required: true,
				description:
					'Select an item from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: { operation: ['createItem'], isSubitem: [false] },
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
				default: 'topics',
				required: true,
				description:
					'Select an item from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: { operation: ['duplicateGroup'] },
				},
			},
			{
				displayName: 'Group Name',
				name: 'groupName',
				type: 'string',
				default: '',
				description: 'Enter the group name',
				displayOptions: {
					show: { operation: ['createGroup', 'duplicateGroup'] },
				},
			},
			{
				displayName: 'Add to top',
				name: 'addToTop',
				type: 'boolean',
				default: false,
				description: 'Whether to add the group to the top of the board',
				displayOptions: {
					show: { operation: ['duplicateGroup'] },
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
				default: '#c4c4c4',
				description: 'Select the group color',
				displayOptions: {
					show: { operation: ['createGroup'] },
				},
			},
			{
				displayName: 'Remove Subscribers',
				name: 'removeSubscribers',
				typeOptions: {
					loadOptionsMethod: 'getSubscribersFromBoard',
					loadOptionsDependsOn: ['boardId'],
				},
				type: 'multiOptions',
				default: [],
				description:
					'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				displayOptions: {
					show: { operation: ['removeBoardSubscribers'] },
				},
			},
			{
				displayName: 'User Subscribers',
				name: 'usersBoardIds',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: [],
				displayOptions: {
					show: {
						operation: ['createBoard', 'addBoardSubscribers'],
					},
				},
				options: [
					{
						displayName: 'User',
						name: 'usersBoardIds',
						values: [
							{
								displayName: 'User',
								name: 'userId',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
								typeOptions: {
									loadOptionsMethod: 'getUsers',
								},
								default: '',
							},
							{
								displayName: 'Is Owner',
								name: 'isOwner',
								type: 'boolean',
								default: false,
							},
						],
					},
				],
			},
			{
				displayName: 'Team Subscribers',
				name: 'teamBoardIds',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: [],
				displayOptions: {
					show: {
						operation: ['createBoard', 'addBoardSubscribers'],
					},
				},
				options: [
					{
						displayName: 'Team',
						name: 'teamBoardIds',
						values: [
							{
								displayName: 'Team',
								name: 'teamId',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
								typeOptions: {
									loadOptionsMethod: 'getTeams',
								},
								default: '',
							},
							{
								displayName: 'Is Owner',
								name: 'isOwner',
								type: 'boolean',
								default: false,
							},
						],
					},
				],
			},

			/* {
				displayName: 'Team Subscribers',
				name: 'teamIds',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: [],
				displayOptions: {
					show: {
						operation: ['addBoardSubscribers', 'removeBoardSubscribers'],
					},
				},
				options: [
					{
						displayName: 'Team Or IDs',
						name: 'teamBoardIds',
						type: 'multiOptions',
						description:
							'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
						typeOptions: {
							loadOptionsMethod: 'getTeams',
						},
						default: [],
					},
				],
			}, */
			{
				displayName: 'Team Name',
				name: 'teamIds',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getTeams' },
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				displayOptions: {
					show: {
						operation: ['addUsersToTeam', 'removeUsersFromTeam'],
					},
				},
			},
			{
				displayName: 'Team ID',
				name: 'teamId',
				type: 'string',
				default: '',

				displayOptions: {
					show: {
						operation: ['deleteTeam'],
					},
				},
			},
			{
				displayName: 'From',
				name: 'from',
				type: 'dateTime',
				default: '',
				description: 'Enter the date from which to retrieve activity logs',
				displayOptions: {
					show: { operation: ['listBoardActivityLogs'] },
				},
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'dateTime',
				default: '',
				description: 'Enter the date to which to retrieve activity logs',
				displayOptions: {
					show: { operation: ['listBoardActivityLogs'] },
				},
			},
			// Group Fields
			{
				displayName: 'Archived',
				name: 'archiveGroup',
				type: 'boolean',
				default: false,
				description: 'Whether to archive the group',
				displayOptions: {
					show: { operation: ['listBoardGroups'] }, // Not show for listBoardGroups
				},
			},
			{
				displayName: 'Deleted',
				name: 'deleteGroup',
				type: 'boolean',
				default: false,
				description: 'Whether to delete the group',
				displayOptions: {
					show: { operation: ['listBoardGroups'] }, // Not show for listBoardGroups
				},
			},
			{
				displayName: 'Relative To Group Name',
				name: 'groupId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['boardId'],
					loadOptionsMethod: 'getGroupsFromBoard',
				},
				default: '',
				required: true,
				description:
					'Select a group from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				hint: 'The group to which the new group will be relative to.',
				displayOptions: {
					show: { operation: ['createGroup'] }, // before resource: ['item']
				},
			},
			{
				displayName: 'Group ID',
				name: 'groupId',
				type: 'string',
				default: '',
				required: true,
				description:
					'Select a group from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				hint: 'The group to which the new group will be relative to.',
				displayOptions: {
					show: { operation: ['getGroup', 'listGroupItems'] }, // before resource: ['item']
				},
			},
			{
				displayName: 'Position Relative',
				name: 'positionRelative',
				type: 'options',
				options: [
					{ name: 'Before', value: 'before_at' },
					{ name: 'After', value: 'after_at' },
				],
				default: 'before_at',
				description: 'Select the position relative',
				displayOptions: {
					show: { operation: ['createGroup'] },
				},
				hint: 'Defines whether the new group will be created above (before_at) or below (after_at) the group specified in the Relative To field.',
			},
			// Item Fields
			{
				displayName: 'Item',
				name: 'itemId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['boardId'],
					loadOptionsMethod: 'getItemsOrSubitemsFromBoard',
				},
				default: '',
				required: true,
				description:
					'Select an item from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['updateItem', 'createSubitem'],
					},
				},
			},
			{
				displayName: 'Item ID (Optional)',
				name: 'itemIdOptional',
				type: 'string',
				default: '',
				description:
					'Item ID to update. If left empty, a new item will be created. If provided, the existing item will be updated.',
				displayOptions: {
					show: {
						operation: ['createOrUpdateItem'],
					},
				},
			},
			{
				displayName: 'Item',
				name: 'itemId',
				type: 'string',
				default: '',
				required: true,
				description:
					'Select an item from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['createUpdate', 'listUpdates'],
					},
				},
			},

			{
				displayName: 'Board',
				name: 'boardId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBoards',
				},
				default: '',
				required: true,
				description:
					'Select a Monday board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['duplicateItem', 'searchItems', 'searchItemsAdvanced', 'uploadItemFile', 'getGroup'],
					},
				},
			},

			// Toggle parent item
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
				description:
					'Select an item from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['duplicateItem', 'uploadItemFile'],
					},
				},
			},
			{
				displayName: 'Is Subitem',
				name: 'isSubitem',
				type: 'boolean',
				default: false,
				description: 'Whether a subitem',
				displayOptions: {
					show: {
						operation: ['getItem'],
					},
				},
			},
			{
				displayName: 'Fetch Subitems',
				name: 'fetchSubitems',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch subitems',
				displayOptions: {
					show: {
						operation: ['getItem'],
						isSubitem: [false],
					},
				},
			},
			{
				displayName: 'Fetch Parent Item',
				name: 'fetchParentItems',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch parent item',
				displayOptions: {
					show: {
						operation: ['getItem'],
						isSubitem: [true],
					},
				},
			},
			{
				displayName: 'Fetch All Columns',
				name: 'fetchAllColumns',
				type: 'boolean',
				default: true,
				description: 'Whether to fetch all columns or only specific ones',
				displayOptions: {
					show: {
						operation: ['getItem'],
					},
				},
			},
			{
				displayName: 'Column IDs',
				name: 'columnIds',
				type: 'string',
				default: '',
				required: false,
				description: 'Comma-separated list of column IDs to fetch (e.g., text, number, date). Only used when "Fetch All Columns" is disabled.',
				displayOptions: {
					show: {
						operation: ['getItem'],
						fetchAllColumns: [false],
					},
				},
			},
			{
				displayName: 'Item ID',
				name: 'itemId',
				type: 'string',
				default: '',
				required: true,
				description:
					'Specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				displayOptions: {
					show: {
						operation: ['getItem', 'deleteItem'],
					},
				},
			},
			{
				displayName: 'With Updates',
				name: 'withUpdates',
				type: 'boolean',
				default: false,
				description: 'Whether to with updates',
				displayOptions: {
					show: {
						operation: ['duplicateItem'],
					},
				},
			},

			{
				displayName: 'Item Name',
				name: 'itemName',
				type: 'string',
				default: '',
				description: 'Enter the item name',
				displayOptions: {
					show: {
						resource: ['item', 'subitem'],
						operation: ['createItem', 'createSubitem', 'createOrUpdateItem'],
					},
				},
			},
			{
				displayName: 'Is Subitem?',
				name: 'isSubitem',
				type: 'boolean',
				default: false,
				description: 'Whether the item is a subitem',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['createItem', 'createOrUpdateItem'],
					},
				},
			},
			{
				displayName: 'Parent Item',
				name: 'parentId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['boardId'],
					loadOptionsMethod: 'getItemsFromBoard',
				},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['createItem', 'createOrUpdateItem'],
						isSubitem: [true],
					},
				},
				hint: "If this is a subitem, specify the parent item's ID. If it's not a subitem, leave this field blank",
				default: '',
				description:
					'If this is a subitem, specify the ID of the parent item. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},
			{
				displayName: 'Column Values',
				name: 'columnValues',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				displayOptions: {
					show: {
						resource: ['item', 'subitem'],
						operation: ['createItem', 'updateItem', 'createSubitem', 'createOrUpdateItem'],
					},
				},
				options: [
					{
						displayName: 'Column',
						name: 'column',
						values: [
							{
								displayName: 'Column',
								name: 'columnId',
								type: 'options',
								typeOptions: {
									loadOptionsDependsOn: ['boardId'],
									loadOptionsMethod: 'getColumnsItems',
								},
								default: '',
							},
							{
								displayName: 'Column Type',
								name: 'columnType',
								type: 'options',
								options: [
									{ name: 'Simple Column Value', value: 'simple' },
									{ name: 'Column Value', value: 'objectValue' },
									...[
										{ name: 'Button', value: 'button' },
										{ name: 'File Link', value: 'fileLink' },
										{ name: 'Checkbox', value: 'checkbox' },
										{ name: 'Connect Boards', value: 'board_relation' },
										{ name: 'People', value: 'people' },
										{ name: 'Date', value: 'date' },
										{ name: 'Location', value: 'location' },
										{ name: 'Link', value: 'link' },
										{ name: 'Email', value: 'email' },
										{ name: 'Phone', value: 'phone' },
										{ name: 'Timeline', value: 'timeline' },
									].sort((a, b) => a.name.localeCompare(b.name)),
								],
								default: 'simple',
							},

							// Input para valor simples
							{
								displayName: 'Value',
								name: 'columnValue',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										columnType: ['simple'],
									},
								},
							},

							{
								displayName: 'Column Value',
								name: 'objectValue',
								type: 'json',
								default: '',
								description:
									'Enter the column value as a JSON object. Use an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a> to specify a dynamic value.',
								displayOptions: {
									show: {
										columnType: ['objectValue'],
									},
								},
							},
							// File link
							{
								displayName: 'Files',
								name: 'fileLinks',
								type: 'fixedCollection',
								typeOptions: {
									multipleValues: true,
								},
								default: [],
								displayOptions: {
									show: {
										columnType: ['fileLink'],
									},
								},
								options: [
									{
										displayName: 'File',
										name: 'file',
										values: [
											{
												displayName: 'Link',
												name: 'linkToFile',
												type: 'string',
												default: '',
												description: 'The direct link to the file',
											},
											{
												displayName: 'Name',
												name: 'name',
												type: 'string',
												default: '',
												description: 'The name of the file',
											},
										],
									},
								],
							},
							// Button
							{
								displayName: 'Click',
								name: 'buttonValue',
								type: 'boolean',
								default: false,
								displayOptions: {
									show: {
										columnType: ['button'],
									},
								},
							},
							// Checkbox
							{
								displayName: 'Checked',
								name: 'checkboxValue',
								type: 'boolean',
								default: false,
								displayOptions: {
									show: {
										columnType: ['checkbox'],
									},
								},
							},

							// Status

							// Date
							{
								displayName: 'Date',
								name: 'dateValue',
								type: 'dateTime',
								default: '',
								displayOptions: {
									show: {
										columnType: ['date'],
									},
								},
							},

							// Location
							{
								displayName: 'Latitude',
								name: 'latitude',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										columnType: ['location'],
									},
								},
							},
							{
								displayName: 'Longitude',
								name: 'longitude',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										columnType: ['location'],
									},
								},
							},
							{
								displayName: 'Address',
								name: 'address',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										columnType: ['location'],
									},
								},
							},

							// Link
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										columnType: ['link'],
									},
								},
							},
							{
								displayName: 'Text',
								name: 'linkText',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										columnType: ['link'],
									},
								},
							},

							// Email
							{
								displayName: 'Email',
								name: 'emailValue',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										columnType: ['email'],
									},
								},
							},
							{
								displayName: 'Text',
								name: 'emailText',
								type: 'string',
								default: '',
								description:
									'The text to display for the email link. If not provided, the email address will be used as the link text.',
								displayOptions: {
									show: {
										columnType: ['email'],
									},
								},
							},

							// Phone
							{
								displayName: 'Country Code',
								name: 'countryCode',
								type: 'options',
								options: countryCodes,
								default: '',
								description: 'Select the country code for the phone number',
								displayOptions: {
									show: {
										columnType: ['phone'],
									},
								},
							},
							{
								displayName: 'Phone',
								name: 'phoneValue',
								type: 'string',
								default: '',
								description:
									'Enter the phone number. Do **not** include the country code — only the area code and the number. Use an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a> to specify a dynamic value.',
								displayOptions: {
									show: {
										columnType: ['phone'],
									},
								},
							},

							// People
							{
								displayName: 'People',
								name: 'peopleValue',
								type: 'multiOptions',
								typeOptions: {
									loadOptionsMethod: 'getUsers',
									loadOptionsDependsOn: ['boardId'],
								},
								default: [],
								displayOptions: {
									show: {
										columnType: ['people'],
									},
								},
							},
							{
								displayName: 'Teams',
								name: 'teamsValue',
								type: 'multiOptions',
								typeOptions: {
									loadOptionsMethod: 'getTeams',
									loadOptionsDependsOn: ['boardId'],
								},
								default: [],
								displayOptions: {
									show: {
										columnType: ['people'],
									},
								},
							},

							// Timeline
							{
								displayName: 'Start Date',
								name: 'startDate',
								type: 'dateTime',
								default: '',
								displayOptions: {
									show: {
										columnType: ['timeline'],
									},
								},
							},
							{
								displayName: 'End Date',
								name: 'endDate',
								type: 'dateTime',
								default: '',
								displayOptions: {
									show: {
										columnType: ['timeline'],
									},
								},
							},

							// Connect Boards
							{
								displayName: 'Connect Boards',
								name: 'columnValue',
								type: 'string',
								default: '',
								description: 'Enter the IDs of the items to connect, separated by commas',
								displayOptions: {
									show: {
										columnType: ['board_relation'],
									},
								},
							},
							{
								displayName: 'Add instead of replacing',
								name: 'addConnections',
								type: 'boolean',
								default: false,
								description:
									'Replace existing connections with the new ones. If false, new connections will be added to existing ones.',
								displayOptions: {
									show: {
										columnType: ['board_relation'],
									},
								},
							},

							// File
							{
								displayName: 'File',
								name: 'fileUpload',
								type: 'string',
								default: '',
								description:
									'Enter the file path or URL to upload. Use an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a> to specify a dynamic value.',
								displayOptions: {
									show: {
										columnType: ['file'],
									},
								},
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
								displayName: 'Column',
								name: 'columnId',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
								typeOptions: {
									loadOptionsMethod: 'getColumnsFromBoard',
								},
								default: '',
							},
							{
								displayName: 'File Name',
								name: 'fileName',
								type: 'string',
								required: true,
								default: '',
							},
						],
					},
				],
			},

			// Filter Items
			{
				displayName: 'Logical Operator',
				name: 'logicalOperator',
				type: 'options',
				options: [
					{
						name: 'AND',
						value: 'and',
					},
					{
						name: 'OR',
						value: 'or',
					},
				],
				default: 'and',
				description: 'Logical operator to use between filter rules',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItems'],
					},
				},
			},
			{
				displayName: 'Fetch Column Values',
				name: 'fetchColumnValues',
				type: 'boolean',
				default: false,
				description: 'Whether to fetch column values',
				displayOptions: {
					show: {
						operation: ['searchItems'],
					},
				},
			},
			// Advanced Search Parameters
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItemsAdvanced'],
					},
				},
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Cursor for pagination (get from previous response)',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItemsAdvanced'],
					},
				},
			},
			{
				displayName: 'Search Term',
				name: 'searchTerm',
				type: 'string',
				default: '',
				description: 'Search term for text-based search across items',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItemsAdvanced'],
					},
				},
			},
			{
				displayName: 'Fetch Column Values',
				name: 'fetchColumnValuesAdvanced',
				type: 'boolean',
				default: true,
				description: 'Whether to fetch column values',
				displayOptions: {
					show: {
						operation: ['searchItemsAdvanced'],
					},
				},
			},
			{
				displayName: 'Filter Rules',
				name: 'filterRules',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItems'],
					},
				},
				options: [
					{
						displayName: 'Rule',
						name: 'rule',
						values: [
							{
								displayName: 'Column',
								name: 'columnId',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
								typeOptions: {
									loadOptionsDependsOn: ['boardId'],
									loadOptionsMethod: 'getColumnsItems',
								},
								default: '',
							},
							{
								displayName: 'Compare Attribute',
								name: 'compareAttribute',
								type: 'string',
								default: '',
								description: 'Optional attribute for comparison (dependent on column type)',
							},
							{
								displayName: 'Operator',
								name: 'operator',
								type: 'options',
								options: [
									{ name: 'Any Of', value: 'any_of' },
									{ name: 'Not Any Of', value: 'not_any_of' },
									{ name: 'Equals', value: 'equals' },
									{ name: 'Is Empty', value: 'is_empty' },
									{ name: 'Is Not Empty', value: 'is_not_empty' },
									{ name: 'Greater Than', value: 'greater_than' },
									{ name: 'Greater Than or Equal', value: 'greater_than_or_equals' },
									{ name: 'Less Than', value: 'lower_than' },
									{ name: 'Less Than or Equal', value: 'lower_than_or_equal' },
									{ name: 'Between', value: 'between' },
									{ name: 'Contains Text', value: 'contains_text' },
									{ name: 'Does Not Contain Text', value: 'not_contains_text' },
									{ name: 'Contains Terms', value: 'contains_terms' },
									{ name: 'Starts With', value: 'starts_with' },
									{ name: 'Ends With', value: 'ends_with' },
									{ name: 'Within the Next', value: 'within_the_next' },
									{ name: 'Within the Last', value: 'within_the_last' },
								],
								default: 'any_of',
								description: 'The condition for value comparison',
							},
							{
								displayName: 'Compare Value',
								name: 'compareValue',
								type: 'string',
								default: '',
								description: 'The value to filter by (format depends on column type)',
							},
						],
					},
				],
			},
			// Advanced Filter Rules
			{
				displayName: 'Advanced Filter Rules',
				name: 'advancedFilterRules',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItemsAdvanced'],
					},
				},
				options: [
					{
						displayName: 'Rule',
						name: 'rule',
						values: [
							{
								displayName: 'Column',
								name: 'columnId',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
								typeOptions: {
									loadOptionsDependsOn: ['boardId'],
									loadOptionsMethod: 'getColumnsItems',
								},
								default: '',
							},
							{
								displayName: 'Compare Attribute',
								name: 'compareAttribute',
								type: 'string',
								default: '',
								description: 'Optional attribute for comparison (dependent on column type)',
							},
							{
								displayName: 'Operator',
								name: 'operator',
								type: 'options',
								options: [
									{ name: 'Any Of', value: 'any_of' },
									{ name: 'Not Any Of', value: 'not_any_of' },
									{ name: 'Equals', value: 'equals' },
									{ name: 'Is Empty', value: 'is_empty' },
									{ name: 'Is Not Empty', value: 'is_not_empty' },
									{ name: 'Greater Than', value: 'greater_than' },
									{ name: 'Greater Than or Equal', value: 'greater_than_or_equals' },
									{ name: 'Less Than', value: 'lower_than' },
									{ name: 'Less Than or Equal', value: 'lower_than_or_equal' },
									{ name: 'Between', value: 'between' },
									{ name: 'Contains Text', value: 'contains_text' },
									{ name: 'Does Not Contain Text', value: 'not_contains_text' },
									{ name: 'Contains Terms', value: 'contains_terms' },
									{ name: 'Starts With', value: 'starts_with' },
									{ name: 'Ends With', value: 'ends_with' },
									{ name: 'Within the Next', value: 'within_the_next' },
									{ name: 'Within the Last', value: 'within_the_last' },
								],
								default: 'any_of',
								description: 'The condition for value comparison',
							},
							{
								displayName: 'Compare Value',
								name: 'compareValue',
								type: 'string',
								default: '',
								description: 'The value to filter by (format depends on column type)',
							},
						],
					},
				],
			},
			{
				displayName: 'Logical Operator',
				name: 'logicalOperatorAdvanced',
				type: 'options',
				options: [
					{
						name: 'AND',
						value: 'and',
					},
					{
						name: 'OR',
						value: 'or',
					},
				],
				default: 'and',
				description: 'Logical operator to use between filter rules',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItemsAdvanced'],
					},
				},
			},
			{
				displayName: 'Sort Options',
				name: 'sortOptions',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItems'],
					},
				},
				options: [
					{
						displayName: 'Sort By',
						name: 'sortBy',
						values: [
							{
								displayName: 'Column',
								name: 'columnId',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
								typeOptions: {
									loadOptionsDependsOn: ['boardId'],
									loadOptionsMethod: 'getColumnsItems',
								},
								default: '',
							},
							{
								displayName: 'Direction',
								name: 'direction',
								type: 'options',
								options: [
									{ name: 'Ascending', value: 'asc' },
									{ name: 'Descending', value: 'desc' },
								],
								default: 'asc',
								description: 'The sort direction',
							},
						],
					},
				],
			},
			{
				displayName: 'Advanced Sort Options',
				name: 'advancedSortOptions',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['searchItemsAdvanced'],
					},
				},
				options: [
					{
						displayName: 'Sort By',
						name: 'sortBy',
						values: [
							{
								displayName: 'Column',
								name: 'columnId',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
								typeOptions: {
									loadOptionsDependsOn: ['boardId'],
									loadOptionsMethod: 'getColumnsItems',
								},
								default: '',
							},
							{
								displayName: 'Direction',
								name: 'direction',
								type: 'options',
								options: [
									{ name: 'Ascending', value: 'asc' },
									{ name: 'Descending', value: 'desc' },
								],
								default: 'asc',
								description: 'The sort direction',
							},
						],
					},
				],
			},

			// Upload file

			{
				displayName: 'File Column',
				name: 'fileColumnId',
				type: 'options',
				typeOptions: {
					loadOptionsDependsOn: ['boardId'],
					loadOptionsMethod: 'getFileColumns',
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['uploadItemFile'],
					},
				},
				description:
					'The ID of the file column to upload the file to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						resource: ['item'],
						operation: ['uploadItemFile'],
					},
				},
				description:
					'The name of the binary property that contains the file to upload, more than one file can be uploaded by separating the names with a comma',
			},

			// Update Fields
			{
				displayName: 'Update ID',
				name: 'updateId',
				type: 'string',

				displayOptions: {
					show: {
						operation: ['updateUpdate', 'deleteUpdate', 'uploadFile'],
					},
				},
				default: '',
				description:
					'Select an update from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},
			{
				displayName: 'Body Content',
				name: 'bodyContent',
				type: 'string',
				default: '',
				description: 'Enter the body content',
				displayOptions: {
					show: {
						resource: ['update'],
						operation: ['createUpdate', 'updateUpdate'],
					},
				},
			},
			{
				displayName: 'Is Reply',
				name: 'isReply',
				type: 'boolean',
				default: false,
				description: 'Whether to create a reply',
				displayOptions: {
					show: {
						resource: ['update'],
						operation: ['createUpdate'],
					},
				},
			},
			{
				// This is supported only in API 2025-07 (Release Candidate) and later.
				// Hide until release candidate is stable.
				displayName: 'Mention',
				name: 'mention',
				type: 'boolean',
				default: false,
				description: 'Whether to mention the users, teams or boards in the update',
				displayOptions: {
					show: {
						operation: ['__never_show__'],
						//operation: ['createUpdate', 'updateUpdate'],
					},
				},
			},
			{
				displayName: 'Mentions List (Users, Teams, Boards)',
				name: 'mentionsList',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				displayOptions: {
					show: {
						operation: ['createUpdate', 'updateUpdate'],
						mention: [true],
					},
				},
				options: [
					{
						displayName: 'Mention',
						name: 'mention',
						values: [
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{ name: 'User', value: 'User' },
									{ name: 'Team', value: 'Team' },
									{ name: 'Board', value: 'Board' },
								],
								default: 'User',
							},
							{
								displayName: 'ID',
								name: 'id',
								type: 'string',
								default: '',
								description:
									'ID of the mentioned entity (User, Team, or Board). You can use an expression to insert it dynamically.',
							},
						],
					},
				],
			},
			{
				displayName: 'Attachments (Binary Properties)',
				name: 'attachmentsUpdate',
				type: 'string',
				default: '',
				description: 'Enter the names of the attachments to include, separated by commas',
				displayOptions: {
					show: {
						resource: ['update'],
						operation: ['createUpdate', 'updateUpdate', 'uploadFile'],
					},
				},
			},
			{
				displayName: 'Update ID To Reply',
				name: 'updateId',
				type: 'string',

				displayOptions: {
					show: {
						isReply: [true],
						operation: ['createUpdate'],
					},
				},
				default: '',
				description:
					'Select an update from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
			},

			// Team Fields
			{
				displayName: 'Team',
				name: 'team',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getTeams' },
				default: '',
				required: true,
				description:
					'Select a team. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['getTeam'],
					},
				},
			},
			{
				displayName: 'Team Name',
				name: 'teamName',
				type: 'string',
				default: '',
				required: true,
				description: 'Write a team',
				displayOptions: {
					show: {
						operation: ['createTeam'],
					},
				},
			},
			{
				displayName: 'Is Guest',
				name: 'isGuest',
				type: 'boolean',
				default: false,
				description: 'Whether the team is a guest',
				displayOptions: {
					show: {
						operation: ['createTeam'],
					},
				},
			},
			{
				displayName: 'Users',
				name: 'userIds',
				type: 'multiOptions',
				typeOptions: { loadOptionsMethod: 'getUsers' },
				default: [],
				description:
					'Select a user. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['createTeam', 'addUsersToTeam', 'removeUsersFromTeam', 'getUser'],
					},
				},
			},
			{
				displayName: 'Allow Empty Team',
				name: 'allowEmptyTeam',
				type: 'boolean',
				default: false,
				description: 'Whether to allow an empty team',
				displayOptions: {
					show: {
						operation: ['createTeam'],
					},
				},
			},
			{
				displayName: 'Board',
				name: 'boardId',
				type: 'string',
				default: '',
				required: true,
				description: 'Enter the board ID',
				displayOptions: {
					show: {
						operation: ['listBoardItems'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
				hint: 'If 0 is provided, all items will be returned',
				displayOptions: {
					show: {
						operation: ['listBoardItems'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getWorkspaces() {
				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
				const sorted = allWorkspace
					.filter((w) => w.value !== '-1')
					.sort((a, b) => a.name.localeCompare(b.name));
				sorted.unshift({ name: 'Main Workspace', value: '-1' });
				return sorted;
			},
			async getBoards() {
				const credentials = await this.getCredentials('WorktablesApi');
				const workspaceId = this.getCurrentNodeParameter('workspace') as string;
				//const limit = this.getCurrentNodeParameter('limit') as number;
				const boardKind = this.getCurrentNodeParameter('boardKind') as string;
				const orderBy = this.getCurrentNodeParameter('orderBy') as string;
				const state = this.getCurrentNodeParameter('state') as string;

				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
				}

				console.log('Getting Board: ', workspaceId);

				const allBoards: { name: string; value: string; type: string }[] = [];
				let page = 1;
				let hasMore = true;

				const queryLimit = 100;

				const orderByFilter = orderBy === 'none' || !orderBy ? '' : `, order_by: ${orderBy}`;
				const boardKindFilter =
					boardKind === 'all' || !boardKind ? '' : `, board_kind: ${boardKind}`;

				while (hasMore) {
					const currentQuery = JSON.stringify({
						query: `{
							boards(
								limit: ${queryLimit},
								page: ${page},
								state: ${state ? state : 'active'}
								${orderByFilter}
								${boardKindFilter}
							) {
								id
								name
								type
							}
						}`,
					});

					const responseData = await this.helpers.request({
						method: 'POST',
						url: 'https://api.monday.com/v2',
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
						body: currentQuery,
					});

					const boards = JSON.parse(responseData).data.boards;
					allBoards.push(
						...boards
							.filter((board: any) => board.type === 'board' || board.type === 'sub_items_board')
							.map((board: any) => ({ name: board.name, value: board.id })),
					);

					if (boards.length < queryLimit) {
						console.log('No more boards');
						hasMore = false;
					} else {
						page++;
					}
				}

				return allBoards.sort((a, b) => a.name.localeCompare(b.name));
			},
			async getGroupsFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Groups');
				const boardId = this.getCurrentNodeParameter('boardId') as string;

				if (!boardId) {
					throw new NodeApiError(this.getNode(), { message: 'Board ID is required.' });
				}

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
				}

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: {
						query: `query { boards(ids: ${boardId} ) { groups { id title color position archived deleted} } }`,
					},
				});

				const parsedResponse = JSON.parse(response);
				// TODO -> check if groups is deleted or archived
				return parsedResponse.data.boards[0].groups.map((item: { id: string; title: string }) => ({
					name: item.title,
					value: item.id,
				}));
			},
			async getItemsFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Items');
				const boardId = this.getCurrentNodeParameter('boardId') as string;

				if (!boardId) {
					throw new NodeApiError(this.getNode(), { message: 'Board ID is required.' });
				}

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
				}
				const board = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: {
						query: `query {
								boards(ids: ${boardId}) {
									name
									items_page(limit: 1) {
									items {
										parent_item {
										board {
											id
										}
										}
									}
									}
								}
								}`,
					},
				});

				const parsedBoard = JSON.parse(board);
				const parentBoardName = parsedBoard.data.boards[0].name as string;

				let parentBoardId = '';
				if (parentBoardName.startsWith('Subitems of')) {
					parentBoardId = parsedBoard.data.boards[0].items_page.items[0].parent_item.board
						.id as string;
				}

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: {
						query: `query { boards(ids: ${
							parentBoardId ? parentBoardId : boardId
						}) { items_page (limit: 500) { items { id name } } } }`,
					},
				});

				console.log(
					'Query: ',
					`query { boards(ids: ${
						parentBoardId ? parentBoardId : boardId
					}) { items_page (limit: 500) { items { id name } } } }`,
				);
				console.log('parentBoard: ', parentBoardId);

				const parsedResponse = JSON.parse(response);

				const items = parsedResponse.data.boards[0].items_page.items.map(
					(item: { id: string; name: string }) => ({
						name: item.name,
						value: item.id,
					}),
				);

				items.unshift({ name: 'None', value: 0 });

				return items;
			},
			async getItemsOrSubitemsFromBoard(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				console.log('Getting Items');
				const boardId = this.getCurrentNodeParameter('boardId') as string;

				if (!boardId) {
					throw new NodeApiError(this.getNode(), { message: 'Board ID is required.' });
				}

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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

				console.log(
					'Query: ',
					`query { boards(ids: ${boardId}) { items_page (limit: 500) { items { id name } } } }`,
				);

				const parsedResponse = JSON.parse(response);

				const items = parsedResponse.data.boards[0].items_page.items.map(
					(item: { id: string; name: string }) => ({
						name: item.name,
						value: item.id,
					}),
				);

				items.unshift({ name: 'None', value: 0 });

				return items;
			},
			async getSubitemFromItem(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Subitems');
				const itemId = this.getNodeParameter('itemId', 0) as string;
				const parentId = this.getNodeParameter('parentId', 0) as string;

				if (!itemId && !parentId) {
					throw new NodeApiError(this.getNode(), { message: 'Item ID is required.' });
				}

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
				}

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: {
						query: `{
									items(ids: "${itemId || parentId}") {
										subitems {
										id
										name
										}
									}
								}`,
					},
				});

				const parsedResponse = JSON.parse(response);
				console.log(JSON.stringify(parsedResponse, null, 2));
				return parsedResponse.data.items[0].subitems.map((item: { id: string; name: string }) => ({
					name: item.name,
					value: item.id,
				}));
			},
			async getColumnsFromBoard(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				console.log('Getting Columns');
				const boardId = this.getCurrentNodeParameter('boardId') as string;
				const operation = this.getNodeParameter('operation', 0) as string;

				if (!boardId) {
					throw new NodeApiError(this.getNode(), { message: 'Board ID is required.' });
				}

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
					throw new NodeApiError(this.getNode(), { message: 'Board ID is required.' });
				}

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
			async getColumnsItems(this: ILoadOptionsFunctions) {
				const boardId = this.getCurrentNodeParameter('boardId') as string;

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						query: `query {
									boards(ids: ${boardId}) {
										columns {
											id
											title
											type
										}
										items_page {
											items {
												subitems {
													board {
														columns {
															id
															title
															type
														}
													}
												}
											}
										}
									}
								}`,
					}),
				});

				const parsedResponse = JSON.parse(response);

				return parsedResponse.data.boards[0].columns
					.filter(
						(column: { type: string }) =>
							column.type !== 'subitem' &&
							column.type !== 'auto_number' &&
							column.type !== 'creation_log' &&
							column.type !== 'formula' &&
							column.type !== 'item_id' &&
							column.type !== 'last_updated' &&
							column.type !== 'progress' &&
							column.type !== 'mirror' &&
							column.type !== 'subtasks',
					)
					.map((column: { id: string; title: string; type: string }) => {
						return {
							name: column.title,
							value: column.id,
						};
					});
			},
			async getFolders(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const workspaceId = this.getNodeParameter('workspace') as string;
				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				console.log('Getting Folders');
				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
			async getTeams(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
				}

				const responseData = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: {
						query: `{ teams { id name } }`,
					},
				});

				return JSON.parse(responseData).data.teams.map((team: { name: string; id: string }) => ({
					name: team.name,
					value: team.id,
				}));
			},
			async getFileColumns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const boardId = this.getCurrentNodeParameter('boardId') as string;

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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

				return parsedResponse.data.boards[0].columns
					.filter((column: { type: string }) => column.type === 'file')
					.map((column: { id: string; title: string }) => ({
						name: column.title,
						value: column.id,
					}));
			},
			async getUpdates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const boardId = this.getCurrentNodeParameter('boardId') as string;

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;

				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
				}

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						query: `query { boards(ids: ${boardId}) { updates { id body } } }`,
					}),
				});

				const parsedResponse = JSON.parse(response);

				return parsedResponse.data.boards[0].updates.map(
					(update: { id: string; body: string }) => ({
						name: update.body,
						value: update.id,
					}),
				);
			},

			async getAllLabelStatus(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const boardId = this.getCurrentNodeParameter('boardId') as string;
				console.log('ALL NODE', JSON.stringify(this.getNode(), null, 2));
				const allEntries = this.getNodeParameter('columnValues') as {
					column: Array<{
						columnId?: string;
						columnType?: string;
						statusLabel?: string;
						[key: string]: any;
					}>;
				};

				const entryQueQuerLabel = allEntries.column.find(
					(e) => e.columnType === 'status' && (!e.statusLabel || e.statusLabel === ''),
				);

				if (!entryQueQuerLabel) {
					return [];
				}

				const columnId = entryQueQuerLabel.columnId as string;
				console.log('getAllLabelStatus() → columnId encontrada:', columnId);

				if (!columnId) {
					return [];
				}

				const credentials = await this.getCredentials('WorktablesApi');
				const apiKey = credentials?.apiKey;
				if (!apiKey) {
					throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
				}

				console.log('getAllLabelStatus() — Board ID:', boardId);
				console.log('getAllLabelStatus() — Column ID:', columnId);

				const response = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						query: `query {
							boards(ids: ${boardId}) {
							columns(ids: ["${columnId}"]) {
								title
								settings_str
							}
							}
						}`,
					}),
				});

				console.log('getAllLabelStatus() — Raw API Response:', response);

				const settingsStrRaw = JSON.parse(response).data.boards[0].columns[0].settings_str;
				const name = JSON.parse(response).data.boards[0].columns[0].title;
				console.log('getAllLabelStatus() — settings_str:', settingsStrRaw);

				const settings = JSON.parse(settingsStrRaw as string);
				const columnLabels: Record<string, string> = settings.labels || {};
				console.log('getAllLabelStatus() — columnLabels:', columnLabels);

				const options: INodePropertyOptions[] = Object.entries(columnLabels)
					.filter(([_, labelName]) => typeof labelName === 'string' && labelName.trim() !== '')
					.map(([_, labelName]) => ({
						name: `${labelName} (${name})` as string,
						value: labelName as string,
					}));

				console.log('getAllLabelStatus() — Options retornadas:', options);
				return options;
			},
		},
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | null> {
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('WorktablesApi');
		const apiKey = credentials?.apiKey;

		if (!apiKey) {
			throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
						const folder = this.getNodeParameter('folder', 0) as string;
						const teamBoardIds = this.getNodeParameter('teamBoardIds', 0) as {
							teamBoardIds: { teamId: string; isOwner: boolean }[];
						};
						const usersBoardIds = this.getNodeParameter('usersBoardIds', 0) as {
							usersBoardIds: { userId: string; isOwner: boolean }[];
						};
						const description = this.getNodeParameter('description', 0) as string;
						const templateId = this.getNodeParameter('templateId', 0) as string;

						let arg = '';

						if (
							usersBoardIds &&
							usersBoardIds.usersBoardIds &&
							usersBoardIds.usersBoardIds.length > 0
						) {
							const ownerUsers = usersBoardIds.usersBoardIds
								.filter((user) => user.isOwner)
								.map((user) => `"${user.userId}"`)
								.join(',');

							const subscriberUsers = usersBoardIds.usersBoardIds
								.filter((user) => !user.isOwner)
								.map((user) => `"${user.userId}"`)
								.join(',');

							if (ownerUsers) {
								arg += ` board_owner_ids: [${ownerUsers}]`;
							}

							if (subscriberUsers) {
								arg += ` board_subscriber_ids: [${subscriberUsers}]`;
							}
						}

						if (teamBoardIds && teamBoardIds.teamBoardIds && teamBoardIds.teamBoardIds.length > 0) {
							const ownerTeams = teamBoardIds.teamBoardIds
								.filter((team) => team.isOwner)
								.map((team) => `"${team.teamId}"`)
								.join(',');

							const subscriberTeams = teamBoardIds.teamBoardIds
								.filter((team) => !team.isOwner)
								.map((team) => `"${team.teamId}"`)
								.join(',');

							if (ownerTeams) {
								arg += ` board_owner_team_ids: [${ownerTeams}]`;
							}

							if (subscriberTeams) {
								arg += ` board_subscriber_teams_ids: [${subscriberTeams}]`;
							}
						}

						if (description !== '') {
							arg += ` description: "${description}"`;
						}
						if (templateId !== '') {
							arg += ` template_id: ${templateId}`;
						}
						if (folder !== '-1') {
							arg += ` folder_id: ${folder}`;
						}

						const mutation = `
							mutation {
								create_board(
									board_name: "${boardName}",
									board_kind: ${boardKind},
									workspace_id: ${workspace}
									${arg}
								) { id url }
							}
							`;
						console.log(mutation);
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
						const workspaceId = this.getNodeParameter('workspace', 0) as string;

						if (!boardId) {
							throw new NodeApiError(this.getNode(), { message: 'Board ID is required.' });
						}

						if (!apiKey) {
							throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
								duplicate_board(board_id: ${boardId}, workspace_id: ${workspaceId}, duplicate_type: ${duplicateType}, board_name: "${boardName}", keep_subscribers: ${keepSubscribers}
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
						const addToTop = this.getNodeParameter('addToTop', 0) as boolean;

						if (!boardId || !groupId) {
							throw new NodeApiError(this.getNode(), {
								message: 'Board ID and Group ID are required.',
							});
						}

						if (!apiKey) {
							throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
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
										duplicate_group(board_id: ${boardId}, group_id: "${groupId}", group_title: "${groupName}" ${
									addToTop ? ', add_to_top: true' : ''
								}) {
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
						const usersBoardIds = this.getNodeParameter('usersBoardIds', 0) as {
							usersBoardIds: { userId: string; isOwner: boolean }[];
						};
						const teamBoardIds = this.getNodeParameter('teamBoardIds', 0) as {
							teamBoardIds: { teamId: string; isOwner: boolean }[];
						};

						if (!boardId) {
							throw new NodeApiError(this.getNode(), { message: 'Board ID is required.' });
						}

						if (!apiKey) {
							throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
						}

						const result = {
							ownerUsers: [],
							subscriberUsers: [],
							ownerTeams: [],
							subscriberTeams: [],
							boardId,
						};

						const ownerUsers = usersBoardIds?.usersBoardIds
							.filter((user) => user.isOwner)
							.map((user) => user.userId);

						if (ownerUsers && ownerUsers.length > 0) {
							response = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers: {
									Authorization: `Bearer ${apiKey}`,
									'Content-Type': 'application/json',
								},
								body: {
									query: `mutation {
											add_subscribers_to_board(
												board_id: ${boardId},
												user_ids: [${ownerUsers.join(',')}],
												kind: owner
											) {
												id
												name
											}
										}`,
								},
							});
							console.log(response);

							result.ownerUsers = response;
						}

						const subscriberUsers = usersBoardIds?.usersBoardIds
							.filter((user) => !user.isOwner)
							.map((user) => user.userId);

						if (subscriberUsers && subscriberUsers.length > 0) {
							response = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers: {
									Authorization: `Bearer ${apiKey}`,
									'Content-Type': 'application/json',
								},
								body: {
									query: `mutation {
											add_subscribers_to_board(
												board_id: ${boardId},
												user_ids: [${subscriberUsers.join(',')}],
												kind: subscriber
											) {
												id
												name
											}
										}`,
								},
							});
							console.log(response);
							result.subscriberUsers = response;
						}

						const ownerTeams = teamBoardIds?.teamBoardIds
							.filter((team) => team.isOwner)
							.map((team) => team.teamId);

						if (ownerTeams && ownerTeams.length > 0) {
							response = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers: {
									Authorization: `Bearer ${apiKey}`,
									'Content-Type': 'application/json',
								},
								body: {
									query: `mutation {
											add_teams_to_board(
												board_id: ${boardId},
												team_ids: [${ownerTeams.join(',')}],
												kind: owner
											) {
												id
												name
											}
										}`,
								},
							});
							console.log(response);
							result.ownerTeams = response;
						}

						const subscriberTeams = teamBoardIds?.teamBoardIds
							.filter((team) => !team.isOwner)
							.map((team) => team.teamId);

						if (subscriberTeams && subscriberTeams.length > 0) {
							response = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers: {
									Authorization: `Bearer ${apiKey}`,
									'Content-Type': 'application/json',
								},
								body: {
									query: `mutation {
											add_teams_to_board(
												board_id: ${boardId},
												team_ids: [${subscriberTeams.join(',')}],
												kind: subscriber
											) {
												id
												name
											}
										}`,
								},
							});
							console.log(response);
							result.subscriberTeams = response;
						}
						return [[{ json: result }]];
						break;
					}
					case 'listBoards': {
						console.log('List boards: ');

						const credentials = await this.getCredentials('WorktablesApi');
						const filterByWorkspace = this.getNodeParameter('filterByWorkspace', 0) as boolean;
						const workspaceId = this.getNodeParameter('workspace', 0, '') as string;
						const limit = this.getNodeParameter('limit', 0) as number;
						const boardKind = this.getNodeParameter('boardKind', 0) as string;
						const orderBy = this.getNodeParameter('orderBy', 0) as string;
						const state = this.getNodeParameter('state', 0) as string;

						const apiKey = credentials?.apiKey;

						if (!apiKey) {
							throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
						}

						const workspaceFilter =
							filterByWorkspace && workspaceId
								? `workspace_ids: ${JSON.stringify(workspaceId)},`
								: '';

						const allBoards: { name: string; value: string }[] = [];
						let page = 1;
						let hasMore = true;

						const queryLimit = limit === 0 ? 100 : limit;

						while (hasMore) {
							const responseData = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers: {
									Authorization: `Bearer ${apiKey}`,
									'Content-Type': 'application/json',
								},
								body: JSON.stringify({
									query: `{
											boards(
												limit: ${queryLimit},
												page: ${page},
												${workspaceFilter}
												state: ${state}
												${orderBy === 'none' ? `` : `, order_by: ${orderBy}`}
												${boardKind === 'all' ? `` : `, board_kind: ${boardKind}`}
											) {
												id
												name
												board_kind
												state
												description
												items_count
												creator { id name }
												owners { id name }
												subscribers { id name }
												tags { id name }
												workspace_id
												updated_at
												url
											}
										}`,
								}),
							});

							const boards = JSON.parse(responseData).data.boards;
							allBoards.push(
								...boards.map((board: any) => ({
									name: board.name,
									value: board.id,
									boardKind: board.board_kind,
									state: board.state,
									description: board.description,
									itemsCount: board.items_count,
									creator: board.creator,
									owners: board.owners,
									subscribers: board.subscribers,
									tags: board.tags,
									workspaceId: board.workspace_id,
									updatedAt: board.updated_at,
									url: board.url,
								})),
							);

							if (limit > 0 || boards.length < queryLimit) {
								hasMore = false;
							} else {
								page++;
							}
						}

						response = allBoards.sort((a, b) => a.name.localeCompare(b.name));
						return [response.map((board) => ({ json: board }))];
						break;
					}
					case 'listBoardGroups': {
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const archiveGroup = this.getNodeParameter('archiveGroup', 0) as boolean;
						const deleteGroup = this.getNodeParameter('deleteGroup', 0) as boolean;

						let filter = '';
						if (archiveGroup) {
							filter += ' archived';
						}
						if (deleteGroup) {
							filter += ' deleted';
						}

						const query = `
							query {
								boards(ids: [${boardId}]) {
									groups {
										id
										title
										color
										position
										${filter}
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
									board_kind
										columns {
											id
											title
											type
										}
										groups {
											id
											title
										}
										items_count
										subscribers {
											id
											name
										}
										url
										updated_at
											workspace {
											id
											name
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
						const from = this.getNodeParameter('from', 0) as string;
						const to = this.getNodeParameter('to', 0) as string;

						console.log('From: ', from);
						console.log('To: ', to);
						const query = `
							query {
								boards(ids: [${boardId}]) {
									activity_logs (from: "${from}Z", to: "${to}Z") {
										id
										user_id
										entity
										event
										data
										created_at
									}
								}
							}
							`;

						console.log('Query: ', query);

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
									is_guest
									is_pending
									is_verified
									account {
										id
										logo
										country_code
									}
									name
									email
									is_admin
									enabled
									created_at
									}
									team_subscribers {
									id
									name
									users {
										id
										name
										email
									}
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
						const relativeTo = this.getNodeParameter('groupId', 0) as number;
						const position_relative_method = this.getNodeParameter('positionRelative', 0) as number;

						let query = '';
						if (relativeTo) {
							query = `relative_to: "${relativeTo}", position_relative_method: ${position_relative_method}`;
						}

						const mutation = `
							mutation {
								create_group(
									board_id: ${boardId},
									group_name: "${groupName}",
									group_color: "${groupColor}"
									${query}
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
					case 'listItemSubscribers': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const query = `
						{
							items (ids: ["${itemId}"]) {
								subscribers {
								email
								account {
									id
									name
								}
								}
							}
							}
						`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: query },
						});

						break;
					}
					case 'getItem': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const isSubitem = this.getNodeParameter('isSubitem', 0) as boolean;
						const fetchAllColumns = this.getNodeParameter('fetchAllColumns', 0) as boolean;
						const columnIds = this.getNodeParameter('columnIds', 0) as string;

						const fetchSubitems =
							!isSubitem && (this.getNodeParameter('fetchSubitems', 0) as boolean);

						const fetchParentItem =
							isSubitem && (this.getNodeParameter('fetchParentItems', 0) as boolean);

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
								}
							`;
						} else if (columnIds && columnIds.trim()) {
							// Parse column IDs and build specific column query
							const specificColumnIds = columnIds.split(',').map(id => id.trim()).filter(id => id);
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
									}
								`;
							}
						}

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
								${fetchSubitems ? querySubitems : ''}
								${fetchParentItem ? queryParentItem : ''}
							}
						}
						`;

						console.log('Query: ', query);

						const rawResponse = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});

						const parsed = JSON.parse(rawResponse);
						const item = parsed.data.items[0];

						const columnValues = item.column_values || [];

						const formatted: Record<string, any> = {
							id: item.id,
							name: item.name,
							created_at: item.created_at,
							updated_at: item.updated_at,
							group: {
								id: item.group.id,
								title: item.group.title,
								color: item.group.color,
								position: item.group.position,
							},
							column_values: {},
						};

						for (const col of columnValues) {
							if (col.type === 'subtasks') continue;

							const formattedCol: Record<string, any> = {
								type: col.type,
								value: await parseValue(col.value),
								text: col.text,
							};

							if ('display_value' in col) {
								formattedCol.display_value = col.display_value;
							}

							if ('linked_item_ids' in col) {
								formattedCol.linked_item_ids = col.linked_item_ids;
							}

							if ('mirrored_items' in col) {
								formattedCol.mirrored_items = col.mirrored_items;
							}

							formatted.column_values[col.id] = formattedCol;
						}

						if (item.subitems && Array.isArray(item.subitems)) {
							formatted.subitems = await Promise.all(
								item.subitems.map(async (subitem: any) => {
									const subFormatted: Record<string, any> = {
										id: subitem.id,
										name: subitem.name,
										column_values: {},
									};

									for (const col of subitem.column_values || []) {
										const subCol: Record<string, any> = {
											type: col.type,
											value: await parseValue(col.value),
											text: col.text,
										};

										if ('display_value' in col) {
											subCol.display_value = col.display_value;
										}

										if ('linked_item_ids' in col) {
											subCol.linked_item_ids = col.linked_item_ids;
										}

										if ('mirrored_items' in col) {
											subCol.mirrored_items = col.mirrored_items;
										}

										subFormatted.column_values[col.id] = subCol;
									}

									return subFormatted;
								}),
							);
						}

						if (item.parent_item && typeof item.parent_item === 'object') {
							const parentItem = item.parent_item;
							const parentFormatted: Record<string, any> = {
								id: parentItem.id,
								name: parentItem.name,
								created_at: parentItem.created_at,
								updated_at: parentItem.updated_at,
								column_values: {},
							};

							for (const col of parentItem.column_values || []) {
								const subCol: Record<string, any> = {
									type: col.type,
									value: await parseValue(col.value),
									text: col.text,
								};

								if ('display_value' in col) {
									subCol.display_value = col.display_value;
								}

								if ('linked_item_ids' in col) {
									subCol.linked_item_ids = col.linked_item_ids;
								}

								if ('mirrored_items' in col) {
									subCol.mirrored_items = col.mirrored_items;
								}

								parentFormatted.column_values[col.id] = subCol;
							}
							formatted.parent_item = parentFormatted;
						}

						return [[{ json: formatted }]];
					}

					case 'updateItem': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const boardId = this.getNodeParameter('boardId', 0) as string;

						const raw = this.getNodeParameter('columnValues', 0) as {
							column: {
								columnId: string;
								columnType?: string;
								columnValue: string;
								statusLabel?: string;
								latitude?: string;
								longitude?: string;
								address?: string;
								dropdownValue?: string;
								peopleValue?: string;
								teamsValue?: string;
								startDate?: string;
								endDate?: string;
								addConnections?: boolean;
								fileUpload?: string;
								dateValue?: string;
								emailText?: string;
								linkText?: string;
								url?: string;
								emailValue?: string;
								countryCode?: string;
								phoneValue?: string;
								buttonValue?: boolean;
								objectValue?: string;
								fileLinks?: { file: { linkToFile: string; name: string }[] };
							}[];
						};

						console.log('columnValues RAW:', raw);

						const columnValues = raw.column;

						let column_values_object: Record<string, any> = {};
						console.log('Column Values:', columnValues);
						if (columnValues?.length > 0) {
							for (const col of columnValues) {
								const { columnId, columnType, columnValue } = col;

								console.log('Column ID:', columnId);
								console.log('Detected Type:', columnType);
								if (columnType === 'objectValue') {
									console.log('Processing objectValue for column:', columnId);
									console.log('Object Value:', col.objectValue);
									try {
										const parsedValue = JSON.parse(col.objectValue || '{}');
										column_values_object[columnId] = parsedValue;
										console.log('Parsed Object Value:', column_values_object[columnId]);
									} catch (error) {
										throw new NodeApiError(this.getNode(), {
											message: `Invalid JSON format for column ${columnId}: ${error.message}`,
										});
									}
									continue;
								}
								if (
									!columnType ||
									columnType === 'text' ||
									columnType === 'simple' ||
									col.columnType === 'simple' ||
									columnType === 'file'
								) {
									if (col.columnValue !== undefined) {
										const value = col.columnValue;
										if (typeof value === 'string' && columnType === 'file') {
											const links = value.split(',').map((item) => {
												const [link, ...nameParts] = item.trim().split(/\s+/);
												return {
													fileType: 'LINK',
													linkToFile: link,
													name: nameParts.join(' '),
												};
											});

											column_values_object[columnId] = { files: links };
										} else if (typeof value === 'string') {
											column_values_object[columnId] = value.replace(/\n/g, '\\n');
										} else {
											column_values_object[columnId] = value;
										}
									}
									continue;
								}

								switch (columnType) {
									case 'board_relation':
									case 'connect_boards':
										if (col.addConnections) {
											const mutation = `query {
												items(ids: [${itemId}]) {
													column_values(ids: ["${col.columnId}"]) {
														... on BoardRelationValue {
															linked_item_ids
														}
													}
												}
											}`;

											const itemConnectionResponse = await this.helpers.request({
												method: 'POST',
												url: 'https://api.monday.com/v2',
												headers,
												body: { query: mutation },
											});

											const existingIds =
												JSON.parse(itemConnectionResponse)?.data?.items?.[0]?.column_values?.[0]
													?.linked_item_ids || [];

											console.log('Existing IDs:', existingIds);
											const newIds = columnValue.split(',').map((id) => id.trim());

											const mergedIds = Array.from(new Set([...existingIds, ...newIds]));

											column_values_object[columnId] = {
												item_ids: mergedIds,
											};
										} else {
											column_values_object[columnId] = {
												item_ids: columnValue.split(',').map((id) => id.trim()),
											};
										}
										break;
									case 'dependency':
										column_values_object[columnId] = {
											item_ids: columnValue.split(',').map((id) => id.trim()),
										};
										break;
									case 'people':
										console.log('Processing people column:', col);
										const personsAndTeams: any[] = [];

										if (Array.isArray(col.peopleValue)) {
											personsAndTeams.push(
												...col.peopleValue.map((id: string) => ({
													id: parseInt(id),
													kind: 'person',
												})),
											);
										}

										if (Array.isArray(col.teamsValue)) {
											personsAndTeams.push(
												...col.teamsValue.map((id: string) => ({
													id: parseInt(id),
													kind: 'team',
												})),
											);
										}

										if (personsAndTeams.length > 0) {
											column_values_object[columnId] = { personsAndTeams };
										}
										break;
									case 'timeline':
										column_values_object[columnId] = {
											from: col.startDate?.split('T')[0],
											to: col.endDate?.split('T')[0],
										};
										break;
									case 'checkbox':
										column_values_object[columnId] = { checked: columnValue };
										break;
									case 'hour':
										const [hour, minute = '00'] = columnValue.split(':');
										column_values_object[columnId] = { hour: Number(hour), minute: Number(minute) };
										break;
									case 'status':
										column_values_object[columnId] = { label: col.statusLabel || columnValue };
										break;
									case 'location':
										column_values_object[columnId] = {
											lat: col.latitude,
											lng: col.longitude,
											address: col.address || '',
										};
										break;
									case 'dropdown':
										const dropdownLabels = col.dropdownValue
											?.split(',')
											.map((label) => label.trim())
											.filter(Boolean);
										if (dropdownLabels?.length) {
											column_values_object[columnId] = { labels: dropdownLabels };
										}
										break;

									case 'date':
										const dateValue = col.dateValue as string;
										const date = new Date(dateValue);
										if (!isNaN(date.getTime())) {
											column_values_object[columnId] = {
												date: date.toISOString().split('T')[0],
											};
										} else {
											throw new NodeApiError(this.getNode(), {
												message: `Invalid date format for column ${columnId}`,
											});
										}
										break;
									case 'email':
										column_values_object[columnId] = {
											text: col.emailText || '',
											email: col.emailValue || '',
										};
										break;
									case 'link':
										column_values_object[columnId] = {
											text: col.linkText || '',
											url: col.url || '',
										};
										break;
									case 'phone':
										column_values_object[columnId] = {
											phone: `${col.countryCode?.split(' ')[0]}${col.phoneValue || ''}`.replace(
												/[^\d+]/g,
												'',
											),
											countryShortName: col.countryCode?.split(' ')[1] || '',
										};
										break;
									case 'fileLink':
										if (col.fileLinks && col.fileLinks.file) {
											const links = col.fileLinks.file.map((file: any) => ({
												fileType: 'LINK',
												linkToFile: file.linkToFile,
												name: file.name,
											}));
											column_values_object[columnId] = { files: links };
										}
										break;
									case 'button':
										const query = `query {
												items (ids: ${itemId}) {
													column_values (ids: "${columnId}") {
													... on ButtonValue {
														color
														label
														value
													}
													}
												}
												}`;

										const buttonResponse = await this.helpers.request({
											method: 'POST',
											url: 'https://api.monday.com/v2',
											headers,
											body: { query },
										});
										try {
											const buttonValue =
												JSON.parse(buttonResponse).data.items[0].column_values[0].value;
											const clicks = JSON.parse(buttonValue)?.clicks || 0;
											column_values_object[columnId] = {
												clicks: clicks + 1,
												changed_at: new Date().toISOString(),
											};
										} catch (error) {
											continue;
										}

										break;

									case 'fileLink':
										if (col.fileLinks && col.fileLinks.file) {
											const links = col.fileLinks.file.map((file: any) => ({
												fileType: 'LINK',
												linkToFile: file.linkToFile,
												name: file.name,
											}));
											column_values_object[columnId] = { files: links };
										}
										break;
									default:
										column_values_object[columnId] = columnValue;
										break;
								}
							}
						}
						console.log(
							'column_values_object FINAL:',
							JSON.stringify(column_values_object, null, 2),
						);
						const mutation = `mutation {
							change_multiple_column_values(
								create_labels_if_missing: true,
								board_id: ${boardId},
								item_id: "${itemId}",
								column_values: "${JSON.stringify(column_values_object)
									.replace(/"/g, '\\"')
									.replace(/(^|[^\\])\\n/g, '$1\\\\n')}"
							) {
								id
								url
								board {
									id
								}
							}
						}`;

						console.log('Generated Mutation:', mutation);

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'createItem': {
						const itemName = this.getNodeParameter('itemName', 0) as string;
						const groupId = this.getNodeParameter('groupId', 0, false) as string;
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const isSubitem = this.getNodeParameter('isSubitem', 0) as boolean;

						const raw = this.getNodeParameter('columnValues', 0) as {
							column: Array<{
								columnId: string;
								columnType?: string;
								objectValue?: string;
								columnValue?: string;
								checkboxValue?: boolean;
								statusLabel?: string;
								latitude?: string;
								longitude?: string;
								address?: string;
								dropdownValue?: string;
								peopleValue?: string[] | string;
								teamsValue?: string[] | string;
								startDate?: string;
								endDate?: string;
								addConnections?: boolean;
								dateValue?: string;
								emailText?: string;
								linkText?: string;
								url?: string;
								emailValue?: string;
								countryCode?: string;
								phoneValue?: string;
								fileLinks?: { file: { linkToFile: string; name: string }[] };
							}>;
						};

						const columnValues = raw.column;
						let column_values_object: Record<string, any> = {};

						console.log('Column Values:', JSON.stringify(raw, null, 2));

						if (columnValues?.length > 0) {
							const columnTypeResponse = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers: {
									Authorization: `Bearer ${apiKey}`,
									'Content-Type': 'application/json',
								},
								body: {
									query: `query {
									boards(ids: ${boardId}) {
										columns {
										id
										type
										}
									}
									}`,
								},
							});

							const columnsType = JSON.parse(columnTypeResponse).data.boards[0].columns as Array<{
								id: string;
								type: string;
							}>;

							for (const col of columnValues) {
								const columnId = col.columnId;
								const columnDef = columnsType.find((c) => c.id === columnId);
								const type = columnDef?.type;

								if (!type || type === 'text' || type === 'simple' || col.columnType === 'simple') {
									console.log('Processing text/simple column:', col);
									if (col.columnValue !== undefined) {
										const value = col.columnValue;
										if (typeof value === 'string' && type === 'file') {
											const links = value.split(',').map((item) => {
												const [link, ...nameParts] = item.trim().split(/\s+/);
												return {
													fileType: 'LINK',
													linkToFile: link,
													name: nameParts.join(' '),
												};
											});

											column_values_object[columnId] = { files: links };
										} else if (typeof value === 'string') {
											column_values_object[columnId] = value.replace(/\n/g, '\\n');
										} else {
											column_values_object[columnId] = value;
										}
									}
									continue;
								} else if (col.columnType === 'objectValue') {
									console.log('Processing objectValue for column:', columnId);
									try {
										const parsedValue = JSON.parse(col.objectValue || '{}');
										column_values_object[columnId] = parsedValue;
									} catch (error) {
										throw new NodeApiError(this.getNode(), {
											message: `Invalid JSON format for column ${columnId}: ${error.message}`,
										});
									}
									continue;
								}
								console.log('Processing column:', type);
								switch (type) {
									case 'board_relation':
									case 'connect_boards':
										{
											const rawValue = (col.columnValue as any) || '';
											const incomingIds = Array.isArray(rawValue)
												? rawValue
												: (rawValue as string).split(',').map((id) => id.trim());
											column_values_object[columnId] = { item_ids: incomingIds };
										}
										break;
									case 'dependency':
										{
											const rawValue = (col.columnValue as any) || '';
											const depIds = Array.isArray(rawValue)
												? rawValue
												: (rawValue as string).split(',').map((id) => id.trim());
											column_values_object[columnId] = { item_ids: depIds };
										}
										break;

									case 'people':
										{
											const personsAndTeams: any[] = [];
											const peopleList = Array.isArray(col.peopleValue)
												? (col.peopleValue as any[])
												: typeof col.peopleValue === 'string'
												? (col.peopleValue as string).split(',').map((id) => id.trim())
												: [];
											const teamsList = Array.isArray(col.teamsValue)
												? (col.teamsValue as any[])
												: typeof col.teamsValue === 'string'
												? (col.teamsValue as string).split(',').map((id) => id.trim())
												: [];
											for (const id of peopleList) {
												if (id) personsAndTeams.push({ id: parseInt(id, 10), kind: 'person' });
											}
											for (const id of teamsList) {
												if (id) personsAndTeams.push({ id: parseInt(id, 10), kind: 'team' });
											}
											if (personsAndTeams.length > 0) {
												column_values_object[columnId] = { personsAndTeams };
											}
										}
										break;

									case 'timeline':
										{
											const from = col.startDate?.split('T')[0] || '';
											const to = col.endDate?.split('T')[0] || '';
											column_values_object[columnId] = { from, to };
										}
										break;

									case 'checkbox':
										{
											const checked = col.checkboxValue;
											column_values_object[columnId] = { checked };
										}
										break;

									case 'hour':
										{
											const rawValue = col.columnValue as string;
											const [hourStr, minuteStr = '00'] = rawValue?.split(':') || [];
											column_values_object[columnId] = {
												hour: Number(hourStr),
												minute: Number(minuteStr),
											};
										}
										break;

									case 'status':
										{
											if (col.statusLabel !== undefined) {
												column_values_object[columnId] = { label: col.statusLabel };
											}
										}
										break;

									case 'location':
										{
											column_values_object[columnId] = {
												lat: col.latitude || '',
												lng: col.longitude || '',
												address: col.address || '',
											};
										}
										break;
									case 'phone':
										column_values_object[columnId] = {
											phone: `${col.countryCode?.split(' ')[0]}${col.phoneValue || ''}`.replace(
												/[^\d+]/g,
												'',
											),
											countryShortName: col.countryCode?.split(' ')[1] || '',
										};
										break;
									case 'file':
										console.log('Processing fileLink column:', col);
										if (col.fileLinks && col.fileLinks.file) {
											const links = col.fileLinks.file.map((file: any) => ({
												fileType: 'LINK',
												linkToFile: file.linkToFile,
												name: file.name,
											}));
											column_values_object[columnId] = { files: links };
										}
										break;
									case 'dropdown':
										{
											const labels = col.dropdownValue
												?.split(',')
												.map((t) => t.trim())
												.filter((t) => t);
											if (labels && labels.length) {
												column_values_object[columnId] = { labels };
											}
										}
										break;
									case 'date':
										const dateValue = col.dateValue as string;
										const date = new Date(dateValue);
										if (!isNaN(date.getTime())) {
											column_values_object[columnId] = {
												date: date.toISOString().split('T')[0],
											};
										} else {
											throw new NodeApiError(this.getNode(), {
												message: `Invalid date format for column ${columnId}`,
											});
										}
										break;
									case 'email':
										column_values_object[columnId] = {
											text: col.emailText || '',
											email: col.emailValue || '',
										};
										break;
									case 'link':
										column_values_object[columnId] = {
											text: col.linkText || '',
											url: col.url || '',
										};
										break;

									default:
										{
											if (col.columnValue !== undefined) {
												column_values_object[columnId] = col.columnValue;
											}
										}
										break;
								}
							}
						}

						const boardInfo = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {
								query: `query {
									boards(ids: ${boardId}) {
									name
									}
								}`,
							},
						});
						const parsedBoard = JSON.parse(boardInfo);
						const parentBoardName = parsedBoard.data.boards[0].name as string;

						let parentId = '';
						if (parentBoardName.startsWith('Subitems of') || (parentBoardName && isSubitem)) {
							parentId = this.getNodeParameter('parentId', 0) as string;
						}

						const columnValuesString = JSON.stringify(column_values_object)
							.replace(/"/g, '\\"')
							.replace(/(^|[^\\])\\n/g, '$1\\\\n');

						let groupLine = groupId ? `group_id: "${groupId}",` : '';

						const mutation = parentId
							? `mutation {
								create_subitem(
									create_labels_if_missing: true,
									parent_item_id: ${parentId},
									item_name: "${itemName}",
									column_values: "${columnValuesString}"
								) { id name url
									board {
										id
									} column_values {
									id
									text
									type
									
									value
									}}
							}`
							: `mutation {
								create_item(
									create_labels_if_missing: true,
									board_id: ${boardId},
									item_name: "${itemName}",
									${groupLine}
									column_values: "${columnValuesString}"
								) { id name url
									board {
										id
									} column_values {
									id
									text
									type
									value
									
									}}
							}`;

						console.log('Mutation:', mutation);

						const responseRaw = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: { query: mutation },
						});

						response = await parseApiResponse(responseRaw);

						if (!response.success) {
							const parsed = JSON.parse(response.data);
							const firstError = parsed.errors || { message: 'Unknown error' };
							console.log(firstError[0]);
							throw new NodeApiError(this.getNode(), firstError, {
								message: firstError.message,
								description: JSON.stringify(firstError, null, 2),
							});
						}

						const parsedResponse = JSON.parse(responseRaw);

						const itemData =
							parsedResponse.data?.create_item || parsedResponse.data?.create_subitem;

						const formattedResponse: Record<string, any> = {
							id: itemData.id,
							name: itemName,
							url: itemData.url,
							board: itemData.board.id,
							column_values: {},
						};

						for (const col of itemData.column_values || []) {
							if (col.type === 'subtasks') continue;

							const formattedCol: Record<string, any> = {
								type: col.type,
								value: col.value,
								text: col.text,
							};

							if ('display_value' in col) {
								formattedCol.display_value = col.display_value;
							}
							if ('linked_item_ids' in col) {
								formattedCol.linked_item_ids = col.linked_item_ids;
							}
							if ('mirrored_items' in col) {
								formattedCol.mirrored_items = col.mirrored_items;
							}

							formattedResponse.column_values[col.id] = formattedCol;
						}

						response = JSON.stringify(formattedResponse);

						break;
					}

					case 'updateColumnValues': {
						/* 		});
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
						}); */
						break;
					}

					case 'createOrUpdateItem': {
						const itemName = this.getNodeParameter('itemName', 0) as string;
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const isSubitem = this.getNodeParameter('isSubitem', 0) as boolean;
						const itemIdOptional = this.getNodeParameter('itemIdOptional', 0, false) as string;

						const raw = this.getNodeParameter('columnValues', 0) as {
							column: Array<{
								columnId: string;
								columnType?: string;
								objectValue?: string;
								columnValue?: string;
								checkboxValue?: boolean;
								statusLabel?: string;
								latitude?: string;
								longitude?: string;
								address?: string;
								dropdownValue?: string;
								peopleValue?: string[] | string;
								teamsValue?: string[] | string;
								startDate?: string;
								endDate?: string;
								addConnections?: boolean;
								dateValue?: string;
								emailText?: string;
								linkText?: string;
								url?: string;
								emailValue?: string;
								countryCode?: string;
								phoneValue?: string;
								fileLinks?: { file: { linkToFile: string; name: string }[] };
							}>;
						};

						const columnValues = raw.column;
						let column_values_object: Record<string, any> = {};

						console.log('Column Values:', JSON.stringify(raw, null, 2));

						if (columnValues?.length > 0) {
							const columnTypeResponse = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers: {
									Authorization: `Bearer ${apiKey}`,
									'Content-Type': 'application/json',
								},
								body: {
									query: `query {
									boards(ids: ${boardId}) {
										columns {
										id
										type
										}
									}
									}`,
								},
							});

							const columnsType = JSON.parse(columnTypeResponse).data.boards[0].columns as Array<{
								id: string;
								type: string;
							}>;

							for (const col of columnValues) {
								const columnId = col.columnId;
								const columnDef = columnsType.find((c) => c.id === columnId);
								const type = columnDef?.type;

								if (!type || type === 'text' || type === 'simple' || col.columnType === 'simple') {
									console.log('Processing text/simple column:', col);
									if (col.columnValue !== undefined) {
										const value = col.columnValue;
										if (typeof value === 'string' && type === 'file') {
											const links = value.split(',').map((item) => {
												const [link, ...nameParts] = item.trim().split(/\s+/);
												return {
													fileType: 'LINK',
													linkToFile: link,
													name: nameParts.join(' '),
												};
											});

											column_values_object[columnId] = { files: links };
										} else if (typeof value === 'string') {
											column_values_object[columnId] = value.replace(/\n/g, '\\n');
										} else {
											column_values_object[columnId] = value;
										}
									}
									continue;
								} else if (col.columnType === 'objectValue') {
									console.log('Processing objectValue for column:', columnId);
									try {
										const parsedValue = JSON.parse(col.objectValue || '{}');
										column_values_object[columnId] = parsedValue;
									} catch (error) {
										throw new NodeApiError(this.getNode(), {
											message: `Invalid JSON format for column ${columnId}: ${error.message}`,
										});
									}
									continue;
								}

								// Process other column types (same logic as createItem)
								switch (type) {
									case 'checkbox':
										column_values_object[columnId] = col.checkboxValue ? { checked: 'true' } : { checked: 'false' };
										break;
									case 'status':
										column_values_object[columnId] = { label: col.statusLabel || 'Working on it' };
										break;
									case 'location':
										column_values_object[columnId] = {
											lat: col.latitude || '0',
											lng: col.longitude || '0',
											address: col.address || '',
										};
										break;
									case 'dropdown':
										column_values_object[columnId] = { label: col.dropdownValue || '' };
										break;
									case 'people':
										if (col.peopleValue) {
											const peopleIds = Array.isArray(col.peopleValue) ? col.peopleValue : [col.peopleValue];
											column_values_object[columnId] = { personsAndTeams: peopleIds.map(id => ({ id, kind: 'person' })) };
										}
										break;
									case 'team':
										if (col.teamsValue) {
											const teamIds = Array.isArray(col.teamsValue) ? col.teamsValue : [col.teamsValue];
											column_values_object[columnId] = { personsAndTeams: teamIds.map(id => ({ id, kind: 'team' })) };
										}
										break;
									case 'timeline':
										column_values_object[columnId] = {
											from: col.startDate || '',
											to: col.endDate || '',
										};
										break;
									case 'date':
										column_values_object[columnId] = { date: col.dateValue || '' };
										break;
									case 'email':
										column_values_object[columnId] = {
											email: col.emailValue || '',
											text: col.emailText || '',
										};
										break;
									case 'link':
										column_values_object[columnId] = {
											url: col.url || '',
											text: col.linkText || '',
										};
										break;
									case 'phone':
										column_values_object[columnId] = {
											phone: col.phoneValue || '',
											countryShortName: col.countryCode || 'US',
										};
										break;
									case 'file':
										if (col.fileLinks?.file) {
											column_values_object[columnId] = { files: col.fileLinks.file };
										}
										break;
									default:
										if (col.columnValue !== undefined) {
											column_values_object[columnId] = col.columnValue;
										}
								}
							}
						}

						let mutation: string;
						let formatted: any;

						// Determine if we should create or update
						if (itemIdOptional && itemIdOptional.trim() !== '') {
							// UPDATE existing item
							console.log('Updating existing item:', itemIdOptional);
							
							mutation = `mutation {
								change_multiple_column_values(
									create_labels_if_missing: true,
									board_id: ${boardId},
									item_id: "${itemIdOptional}",
									column_values: "${JSON.stringify(column_values_object)
										.replace(/"/g, '\\"')
										.replace(/(^|[^\\])\\n/g, '$1\\\\n')}"
								) {
									id
									url
									board {
										id
									}
								}
							}`;

							console.log('Generated Update Mutation:', mutation);

							response = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers,
								body: { query: mutation },
							});

							const responseData = JSON.parse(response);
							const itemData = responseData.data.change_multiple_column_values;

							formatted = {
								id: itemData.id,
								url: itemData.url,
								operation: 'update',
								board_id: itemData.board.id,
								column_values: column_values_object,
							};
						} else {
							// CREATE new item
							console.log('Creating new item:', itemName);
							
							const parentId = this.getNodeParameter('parentId', 0, false) as string;
							
							if (isSubitem && parentId) {
								mutation = `mutation {
									create_subitem(
										parent_item_id: ${parentId},
										item_name: "${itemName}",
										column_values: "${JSON.stringify(column_values_object).replace(/"/g, '\\"').replace(/(^|[^\\])\\n/g, '$1\\\\n')}"
									) {
										id
										name
										url
										board {
											id
										}
									}
								}`;
							} else {
								mutation = `mutation {
									create_item(
										board_id: ${boardId},
										item_name: "${itemName}",
										column_values: "${JSON.stringify(column_values_object).replace(/"/g, '\\"').replace(/(^|[^\\])\\n/g, '$1\\\\n')}"
									) {
										id
										name
										url
										board {
											id
										}
									}
								}`;
							}

							response = await this.helpers.request({
								method: 'POST',
								url: 'https://api.monday.com/v2',
								headers,
								body: { query: mutation },
							});

							const responseData = JSON.parse(response);
							const itemData = isSubitem && parentId 
								? responseData.data.create_subitem 
								: responseData.data.create_item;

							formatted = {
								id: itemData.id,
								name: itemData.name,
								url: itemData.url,
								operation: 'create',
								board_id: itemData.board.id,
								column_values: column_values_object,
							};

							if (isSubitem && parentId) {
								formatted.parent_item = { id: parentId };
							}
						}

						return [[{ json: formatted }]];
					}

					case 'deleteItem': {
						console.log('Delete an item');

						const itemId = this.getNodeParameter('itemId', 0) as string;

						if (!itemId) {
							throw new NodeApiError(this.getNode(), { message: 'Item ID is required.' });
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

						const isSubitem = this.getNodeParameter('showSubitems', 0) as boolean;
						let itemId = '';
						let subitemId = '';
						if (isSubitem) {
							subitemId = this.getNodeParameter('subitemId', 0) as string;
						} else {
							itemId = this.getNodeParameter('itemId', 0) as string;
						}
						const withUpdates = this.getNodeParameter('withUpdates', 0) as boolean;

						const boardId = this.getNodeParameter('boardId', 0) as string;

						if (!itemId || !boardId) {
							throw new NodeApiError(this.getNode(), {
								message: 'Item ID and Board ID are required.',
							});
						}

						const mutation = `
								mutation {
									duplicate_item(
										item_id: ${itemId || subitemId},
										board_id: ${boardId},
										with_updates: ${withUpdates}
									) { id }
								}`;

						console.log('Mutation: ', mutation);

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}
					case 'listBoardItems': {
						console.log('List items in a board');

						const boardId = this.getNodeParameter('boardId', 0) as string;
						const limit = this.getNodeParameter('limit', 0) as number;

						if (!boardId) {
							throw new NodeApiError(this.getNode(), { message: 'Board ID is required.' });
						}

						const query = `
								query {
									boards (ids: ${boardId}) {
										items_page(limit: ${limit}) {
											items {
												id
												updates {
												id
												body
												}
												assets {
												id
												name
												public_url
												url
												}
												column_values {
												id
												text
												value
												}
												group {
												id
												title
												}
												subitems {
												id
												column_values {
													id
													text
													value
												}
												}
												url
											}
										}
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
					case 'searchItems': {
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const fetchColumnValues = this.getNodeParameter(
							'fetchColumnValues',
							0,
							false,
						) as boolean;

						const filterRules = this.getNodeParameter('filterRules', 0) as {
							rule: {
								columnId: string;
								compareAttribute?: string;
								compareValue: string;
								operator: string;
							}[];
						};

						const sortOptions = this.getNodeParameter('sortOptions', 0, { sortBy: [] }) as {
							sortBy: {
								columnId: string;
								direction: string;
							}[];
						};

						const logicalOperator = this.getNodeParameter('logicalOperator', 0) as string;

						let rulesArray = [] as string[];
						if (filterRules?.rule?.length > 0) {
							rulesArray = filterRules.rule.map((rule) => {
								let formattedValue;

								if (['is_empty', 'is_not_empty'].includes(rule.operator)) {
									if (formattedValue === 'null') {
										formattedValue = null;
									} else {
										formattedValue = '""';
									}
								} else if (rule.operator === 'between') {
									try {
										const rangeValues = JSON.parse(rule.compareValue);
										formattedValue = JSON.stringify(rangeValues);
									} catch (e) {
										const values = rule.compareValue.split(',').map((v) => v.trim());
										formattedValue = JSON.stringify(values);
									}
								} else if (['any_of', 'not_any_of'].includes(rule.operator)) {
									try {
										const multiValues = JSON.parse(rule.compareValue);
										formattedValue = Array.isArray(multiValues)
											? JSON.stringify(multiValues)
											: JSON.stringify([rule.compareValue]);
									} catch (e) {
										const values = rule.compareValue.split(',').map((v) => v.trim());
										formattedValue = JSON.stringify(values);
									}
								} else {
									formattedValue = JSON.stringify(rule.compareValue);
								}

								return `{
									column_id: "${rule.columnId}",
									compare_value: ${formattedValue},
									operator: ${rule.operator}
								}`;
							});
						}

						const orderByArray = [] as string[];
						if (sortOptions?.sortBy?.length > 0) {
							sortOptions.sortBy.forEach((sort) => {
								orderByArray.push(`{
									column_id: "${sort.columnId}",
									direction: ${sort.direction}
								}`);
							});
						}

						const query = `query {
							boards(ids: [${boardId}]) {
								items_page(limit: 100, query_params: {
									${logicalOperator ? `operator: ${logicalOperator},` : ''}
									${rulesArray.length > 0 ? `rules: [${rulesArray.join(', ')}],` : ''}
									${orderByArray.length > 0 ? `order_by: [${orderByArray.join(', ')}]` : ''}
								}) {
									items {
										id
										name
										column_values {
											id
											text
											value
											type
										}
										group {
											id
											title
											color
											position
										}
										state
										created_at
										updated_at
									}
									cursor
								}
							}
						}`;

						console.log('Query: ', query);

						const rawResponse = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						const parsed = JSON.parse(rawResponse);
						const items = parsed?.data?.boards?.[0]?.items_page?.items || [];

						const formattedItems = await Promise.all(
							items.map(async (item: any) => {
								const formatted: Record<string, any> = {
									id: item.id,
									name: item.name,
									group: item.group,
									state: item.state,
									created_at: item.created_at,
									updated_at: item.updated_at,
									column_values: !fetchColumnValues ? undefined : {},
								};

								if (!fetchColumnValues) return formatted;

								for (const col of item.column_values || []) {
									if (col.type === 'subtasks') continue;

									const formattedCol: Record<string, any> = {
										type: col.type,
										value: await parseValue(col.value),
										text: col.text,
									};

									if ('display_value' in col) {
										formattedCol.display_value = col.display_value;
									}
									if ('linked_item_ids' in col) {
										formattedCol.linked_item_ids = col.linked_item_ids;
									}
									if ('mirrored_items' in col) {
										formattedCol.mirrored_items = col.mirrored_items;
									}

									formatted.column_values[col.id] = formattedCol;
								}

								return formatted;
							}),
						);

						response = JSON.stringify(formattedItems);
						break;
					}
					case 'searchItemsAdvanced': {
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const limit = this.getNodeParameter('limit', 0, 25) as number;
						const cursor = this.getNodeParameter('cursor', 0, '') as string;
						const searchTerm = this.getNodeParameter('searchTerm', 0, '') as string;
						const fetchColumnValues = this.getNodeParameter(
							'fetchColumnValuesAdvanced',
							0,
							true,
						) as boolean;

						const advancedFilterRules = this.getNodeParameter('advancedFilterRules', 0) as {
							rule: {
								columnId: string;
								compareAttribute?: string;
								compareValue: string;
								operator: string;
							}[];
						};

						const advancedSortOptions = this.getNodeParameter('advancedSortOptions', 0, { sortBy: [] }) as {
							sortBy: {
								columnId: string;
								direction: string;
							}[];
						};

						const logicalOperator = this.getNodeParameter('logicalOperatorAdvanced', 0) as string;

						// Build advanced filters with enhanced date and numeric support
						let rulesArray = [] as string[];
						if (advancedFilterRules?.rule?.length > 0) {
							console.log('Processing filter rules:', advancedFilterRules.rule);
							rulesArray = advancedFilterRules.rule.map((rule) => {
								let formattedValue;

								// Enhanced handling for different operators
								if (['is_empty', 'is_not_empty'].includes(rule.operator)) {
									formattedValue = '""';
								} else if (rule.operator === 'between') {
									// Handle between operator - check if it's date values
									const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
									
									try {
										const rangeValues = JSON.parse(rule.compareValue);
										// Check if it's an array of dates
										if (Array.isArray(rangeValues) && rangeValues.length === 2) {
											const [startDate, endDate] = rangeValues;
											if (dateRegex.test(startDate) && dateRegex.test(endDate)) {
												// Convert both dates and format with EXACT
												const [startMonth, startDay, startYear] = startDate.split('/');
												const [endMonth, endDay, endYear] = endDate.split('/');
												const formattedStartDate = `${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
												const formattedEndDate = `${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
												formattedValue = JSON.stringify(["EXACT", formattedStartDate, "EXACT", formattedEndDate]);
											} else {
												formattedValue = JSON.stringify(rangeValues);
											}
										} else {
											formattedValue = JSON.stringify(rangeValues);
										}
									} catch (e) {
										const values = rule.compareValue.split(',').map((v) => v.trim());
										if (values.length === 2 && dateRegex.test(values[0]) && dateRegex.test(values[1])) {
											// Convert both dates and format with EXACT
											const [startMonth, startDay, startYear] = values[0].split('/');
											const [endMonth, endDay, endYear] = values[1].split('/');
											const formattedStartDate = `${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
											const formattedEndDate = `${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
											formattedValue = JSON.stringify(["EXACT", formattedStartDate, "EXACT", formattedEndDate]);
										} else {
											formattedValue = JSON.stringify(values);
										}
									}
								} else if (['within_the_next', 'within_the_last'].includes(rule.operator)) {
									// Enhanced date range handling
									try {
										const dateRange = JSON.parse(rule.compareValue);
										formattedValue = JSON.stringify(dateRange);
									} catch (e) {
										// Handle simple numeric values for days
										formattedValue = JSON.stringify({ days: parseInt(rule.compareValue) || 7 });
									}
								} else if (['greater_than', 'greater_than_or_equals', 'lower_than', 'lower_than_or_equal'].includes(rule.operator)) {
									// Enhanced numeric and date comparison
									const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
									const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
									
									if (dateRegex.test(rule.compareValue) || isoDateRegex.test(rule.compareValue)) {
										// Handle date comparisons - convert to proper format
										let formattedDate;
										if (dateRegex.test(rule.compareValue)) {
											// Convert MM/DD/YYYY to YYYY-MM-DD format
											const [month, day, year] = rule.compareValue.split('/');
											formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
										} else {
											// Already in correct format
											formattedDate = rule.compareValue;
										}
										
										// For date comparisons, use the date directly (not with EXACT)
										formattedValue = formattedDate;
									} else {
										// Handle numeric comparisons
										formattedValue = rule.compareValue;
									}
								} else if (rule.operator === 'equals') {
									// Handle equals operator - for date columns, convert to appropriate format
									const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
									const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
									
									// Check if it's multiple dates (comma separated or JSON array)
									const isMultipleDates = rule.compareValue.includes(',') || 
										(rule.compareValue.startsWith('[') && rule.compareValue.endsWith(']'));
									
									if (isMultipleDates) {
										// Handle multiple dates - format for between operator
										try {
											const rangeValues = JSON.parse(rule.compareValue);
											if (Array.isArray(rangeValues) && rangeValues.length === 2) {
												const [startDate, endDate] = rangeValues;
												if (dateRegex.test(startDate) && dateRegex.test(endDate)) {
													// Convert both dates and format with EXACT
													const [startMonth, startDay, startYear] = startDate.split('/');
													const [endMonth, endDay, endYear] = endDate.split('/');
													const formattedStartDate = `${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
													const formattedEndDate = `${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
													formattedValue = JSON.stringify(["EXACT", formattedStartDate, "EXACT", formattedEndDate]);
												} else {
													formattedValue = JSON.stringify(rangeValues);
												}
											} else {
												formattedValue = JSON.stringify(rangeValues);
											}
										} catch (e) {
											const values = rule.compareValue.split(',').map((v) => v.trim());
											if (values.length === 2 && dateRegex.test(values[0]) && dateRegex.test(values[1])) {
												// Convert both dates and format with EXACT
												const [startMonth, startDay, startYear] = values[0].split('/');
												const [endMonth, endDay, endYear] = values[1].split('/');
												const formattedStartDate = `${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
												const formattedEndDate = `${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
												formattedValue = JSON.stringify(["EXACT", formattedStartDate, "EXACT", formattedEndDate]);
											} else if (values.length === 2 && isoDateRegex.test(values[0]) && isoDateRegex.test(values[1])) {
												// Handle ISO format dates
												formattedValue = JSON.stringify(["EXACT", values[0], "EXACT", values[1]]);
											} else {
												formattedValue = JSON.stringify(values);
											}
										}
									} else if (dateRegex.test(rule.compareValue)) {
										// Single date - convert MM/DD/YYYY to YYYY-MM-DD format for Monday.com
										const [month, day, year] = rule.compareValue.split('/');
										const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
										// For date columns, use EXACT format as per Monday.com docs
										formattedValue = JSON.stringify(["EXACT", formattedDate]);
									} else if (isoDateRegex.test(rule.compareValue)) {
										// Already in correct format, add EXACT
										formattedValue = JSON.stringify(["EXACT", rule.compareValue]);
									} else {
										formattedValue = rule.compareValue;
									}
								} else if (rule.operator === 'any_of' || rule.operator === 'not_any_of') {
									// Special handling for date columns with any_of/not_any_of
									// Try to detect if it's a date value and format it properly
									const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
									const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
									
									// Check if it's multiple dates (comma separated)
									const isMultipleDates = rule.compareValue.includes(',');
									
									if (isMultipleDates) {
										// Handle multiple dates - format each with EXACT
										const values = rule.compareValue.split(',').map((v) => v.trim());
										const formattedDates = values.map(date => {
											if (dateRegex.test(date)) {
												// Convert MM/DD/YYYY to YYYY-MM-DD format
												const [month, day, year] = date.split('/');
												return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
											} else if (isoDateRegex.test(date)) {
												// Already in correct format
												return date;
											}
											return date;
										});
										
										// Format as array with EXACT for each date
										const exactDates = formattedDates.flatMap(date => ["EXACT", date]);
										formattedValue = JSON.stringify(exactDates);
									} else if (dateRegex.test(rule.compareValue)) {
										// Single date - convert MM/DD/YYYY to YYYY-MM-DD format for Monday.com
										const [month, day, year] = rule.compareValue.split('/');
										const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
										// For date columns, use EXACT format as per Monday.com docs
										formattedValue = JSON.stringify(["EXACT", formattedDate]);
									} else if (isoDateRegex.test(rule.compareValue)) {
										// Already in correct format, add EXACT
										formattedValue = JSON.stringify(["EXACT", rule.compareValue]);
									} else {
										// Handle other values
										try {
											const multiValues = JSON.parse(rule.compareValue);
											formattedValue = Array.isArray(multiValues)
												? JSON.stringify(multiValues)
												: JSON.stringify([rule.compareValue]);
										} catch (e) {
											const values = rule.compareValue.split(',').map((v) => v.trim());
											formattedValue = JSON.stringify(values);
										}
									}
								} else {
									// Handle other operators - check if it's a date value
									const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
									const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
									
									if (dateRegex.test(rule.compareValue)) {
										// Convert MM/DD/YYYY to YYYY-MM-DD format for Monday.com
										const [month, day, year] = rule.compareValue.split('/');
										const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
										// For date columns, use EXACT format as per Monday.com docs
										formattedValue = JSON.stringify(["EXACT", formattedDate]);
									} else if (isoDateRegex.test(rule.compareValue)) {
										// Already in correct format, add EXACT
										formattedValue = JSON.stringify(["EXACT", rule.compareValue]);
									} else {
										formattedValue = rule.compareValue;
									}
								}

								// For date columns with equals operator, determine the correct operator
								let actualOperator = rule.operator;
								const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
								const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
								
								if (rule.operator === 'equals') {
									// Check if it's multiple dates (comma separated or JSON array)
									// But exclude the case where it's already formatted as ["EXACT", "date"]
									const isAlreadyFormatted = rule.compareValue.startsWith('["EXACT"');
									const isMultipleDates = !isAlreadyFormatted && (
										rule.compareValue.includes(',') || 
										(rule.compareValue.startsWith('[') && rule.compareValue.endsWith(']'))
									);
									
									if (isMultipleDates) {
										// Multiple dates - use between operator
										actualOperator = 'between';
									} else if (dateRegex.test(rule.compareValue) || isoDateRegex.test(rule.compareValue) || isAlreadyFormatted) {
										// Single date - use any_of operator
										actualOperator = 'any_of';
									}
								} else if (rule.operator === 'any_of') {
									// For any_of operator, check if it's multiple dates
									const isMultipleDates = rule.compareValue.includes(',') || 
										(rule.compareValue.startsWith('[') && rule.compareValue.endsWith(']'));
									
									if (isMultipleDates) {
										// Multiple dates with any_of - keep as any_of
										actualOperator = 'any_of';
									}
								}
								
								const ruleString = `{
									column_id: "${rule.columnId}",
									${rule.compareAttribute ? `compare_attribute: "${rule.compareAttribute}",` : ''}
									compare_value: ${formattedValue},
									operator: ${actualOperator}
								}`;
								
								console.log(`Rule for column ${rule.columnId}:`, {
									originalOperator: rule.operator,
									actualOperator: actualOperator,
									compareValue: rule.compareValue,
									formattedValue: formattedValue,
									ruleString: ruleString
								});
								
								return ruleString;
							});
						}

						// Build advanced sort options
						const orderByArray = [] as string[];
						if (advancedSortOptions?.sortBy?.length > 0) {
							advancedSortOptions.sortBy.forEach((sort) => {
								orderByArray.push(`{
									column_id: "${sort.columnId}",
									direction: ${sort.direction}
								}`);
							});
						}

						// Build the advanced query with pagination and search
						const query = `query {
							boards(ids: [${boardId}]) {
								items_page(limit: ${limit}, ${cursor ? `cursor: "${cursor}",` : ''} query_params: {
									${logicalOperator ? `operator: ${logicalOperator},` : ''}
									${rulesArray.length > 0 ? `rules: [${rulesArray.join(', ')}],` : ''}
									${orderByArray.length > 0 ? `order_by: [${orderByArray.join(', ')}],` : ''}
									${searchTerm ? `search_term: "${searchTerm}"` : ''}
								}) {
									items {
										id
										name
										column_values {
											id
											text
											value
											type
										}
										group {
											id
											title
											color
											position
										}
										state
										created_at
										updated_at
										subscribers {
											id
											name
											email
										}
									}
									cursor
								}
							}
						}`;

						console.log('Advanced Search Query: ', query);
						console.log('Filter Rules: ', rulesArray);
						console.log('Search Term: ', searchTerm);
						console.log('Board ID: ', boardId);
						
						// First, let's check if there are any items in the board at all
						const testQuery = `query {
							boards(ids: [${boardId}]) {
								items_page(limit: 5) {
									items {
										id
										name
										column_values {
											id
											text
											value
											type
										}
									}
								}
							}
						}`;
						
						console.log('Test Query (no filters): ', testQuery);
						
						const testResponse = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: testQuery },
						});
						
						const testParsed = JSON.parse(testResponse);
						const testItems = testParsed?.data?.boards?.[0]?.items_page?.items || [];
						console.log('Test - Items in board (no filters):', testItems.length);
						if (testItems.length > 0) {
							console.log('Sample item column values:', testItems[0].column_values);
						}

						const rawResponse = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						
						const parsed = JSON.parse(rawResponse);
						const itemsPage = parsed?.data?.boards?.[0]?.items_page;
						const items = itemsPage?.items || [];
						const nextCursor = itemsPage?.cursor;
						const hasMore = nextCursor ? true : false;
						
						console.log('Raw API Response:', JSON.stringify(parsed, null, 2));
						console.log('Items found:', items.length);

						const formattedItems = await Promise.all(
							items.map(async (item: any) => {
								const formatted: Record<string, any> = {
									id: item.id,
									name: item.name,
									group: item.group,
									state: item.state,
									created_at: item.created_at,
									updated_at: item.updated_at,
									subscribers: item.subscribers,
									column_values: !fetchColumnValues ? undefined : {},
									// Add pagination info to each item for reference
									_pagination: {
										nextCursor,
										hasMore,
									},
								};

								if (!fetchColumnValues) return formatted;

								for (const col of item.column_values || []) {
									if (col.type === 'subtasks') continue;

									const formattedCol: Record<string, any> = {
										type: col.type,
										value: await parseValue(col.value),
										text: col.text,
									};

									if ('display_value' in col) {
										formattedCol.display_value = col.display_value;
									}

									formatted.column_values[col.id] = formattedCol;
								}

								return formatted;
							}),
						);

						// Return items with pagination metadata
						const result = {
							items: formattedItems,
							pagination: {
								nextCursor,
								hasMore,
								totalReturned: formattedItems.length,
							},
						};

						response = JSON.stringify(result);
						break;
					}
					case 'uploadItemFile': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const columnId = this.getNodeParameter('fileColumnId', 0) as string;
						const binaryNamesRaw = this.getNodeParameter('binaryPropertyName', 0) as string;

						if (!itemId || !columnId || !binaryNamesRaw) {
							throw new NodeApiError(this.getNode(), {
								message: 'Item ID, Column ID, and Binary Property Name(s) are required.',
							});
						}

						const binaryNames = binaryNamesRaw
							.split(',')
							.map((name) => name.trim())
							.filter(Boolean);

						for (const binaryName of binaryNames) {
							let binaryData;
							try {
								binaryData = this.helpers.assertBinaryData(0, binaryName);
							} catch (error) {
								console.warn(`Binary field '${binaryName}' not found. Skipping.`);
								continue;
							}

							const fileBuffer = Buffer.from(binaryData.data, 'base64');
							let fileName = binaryData.fileName || 'upload';
							// Only add extension if fileName doesn't already have one
							if (!fileName.includes('.') && binaryData.fileExtension) {
								fileName = `${fileName}.${binaryData.fileExtension}`;
							} else if (!fileName.includes('.')) {
								fileName = `${fileName}.dat`;
							}

							console.log('Binary Data:', binaryData);
							console.log('fileName:', fileName);

							const form = new FormData();
							form.append(
								'query',
								`mutation ($file: File!) {
				add_file_to_column (file: $file, item_id: ${itemId}, column_id: "${columnId}") {
					id
				}
			}`,
							);

							form.append('variables[file]', fileBuffer, {
								filename: fileName,
								contentType: binaryData.mimeType || 'application/octet-stream',
							});

							const uploadFile = await axios.post('https://api.monday.com/v2/file', form, {
								headers: {
									Authorization: headers.Authorization,
									...form.getHeaders(),
								},
								maxContentLength: Infinity,
								maxBodyLength: Infinity,
							});

							console.log(`Upload response for '${binaryName}':`, uploadFile.data);
							response = JSON.stringify(uploadFile.data);
						}

						break;
					}
					case 'listGroupItems': {
						const boardId = this.getNodeParameter('boardId', 0) as string;
						const groupId = this.getNodeParameter('groupId', 0) as string;

						if (!boardId || !groupId) {
							throw new NodeApiError(this.getNode(), {
								message: 'Board ID and Group ID are required.',
							});
						}

						const query = `
						query {
							boards (ids: [${boardId}]) {
								groups (ids: "${groupId}") {
									items_page {
										items {
											id
											name
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
											}
											group {
												id
												title
											}
											state
											created_at
											updated_at
										}
									}
								}
							}
						}
	`;

						const rawResponse = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});
						const parsed = JSON.parse(rawResponse);
						const items = parsed?.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];

						const formattedItems = await Promise.all(
							items.map(async (item: any) => {
								const formatted: Record<string, any> = {
									id: item.id,
									name: item.name,
									group: item.group,
									state: item.state,
									created_at: item.created_at,
									updated_at: item.updated_at,
									column_values: {},
								};

								for (const col of item.column_values || []) {
									if (col.type === 'subtasks') continue;

									const formattedCol: Record<string, any> = {
										type: col.type,
										value: await parseValue(col.value),
										text: col.text,
									};

									if ('display_value' in col) {
										formattedCol.display_value = col.display_value;
									}
									if ('linked_item_ids' in col) {
										formattedCol.linked_item_ids = col.linked_item_ids;
									}
									if ('mirrored_items' in col) {
										formattedCol.mirrored_items = col.mirrored_items;
									}

									formatted.column_values[col.id] = formattedCol;
								}

								return formatted;
							}),
						);

						// Return each item as a separate output item
						return [formattedItems.map((item: Record<string, any>) => ({ json: item as IDataObject }))];
					}

					default:
						throw new NodeApiError(this.getNode(), {
							message: `Unsupported operation: ${operation}`,
						});
				}
				break;
			}
			case 'update': {
				switch (operation) {
					case 'listUpdates': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const query = `
							query {
								items (ids: [${itemId}]) {
									updates {
									id
									text_body
									created_at
									updated_at
									creator {
										id
										name
									}
									assets {
										name
										public_url
										file_size
									}
									replies {
										text_body
										created_at
										creator {
										name
										}
									}
									pinned_to_top {
										item_id
									}
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

						response = await parseApiResponse(response);

						if (response.success) {
							const parsed = JSON.parse(response.data);
							const updates = parsed?.data?.items?.[0]?.updates || [];
							return [updates.map((update: unknown) => ({ json: update }))];
						} else {
							const parsed = JSON.parse(response.data);
							const firstError = parsed.errors || { message: 'Unknown error' };
							throw new NodeApiError(this.getNode(), firstError, {
								message: firstError.message,
								description: JSON.stringify(firstError, null, 2),
							});
						}
					}
					case 'createUpdate': {
						const items = this.getInputData();
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const body = this.getNodeParameter('bodyContent', 0) as string;
						const isReply = this.getNodeParameter('isReply', 0) as boolean;
						const shouldMention = this.getNodeParameter('mention', 0, false) as boolean;
						const mentionsCollection = this.getNodeParameter('mentionsList', 0, []) as {
							mention: Array<{
								id: string;
								type: 'User' | 'Team' | 'Board';
							}>;
						};

						let parentUpdateId = '';
						if (isReply) {
							parentUpdateId = this.getNodeParameter('updateId', 0) as string;
						}

						console.log('Mentions Collection:', JSON.stringify(mentionsCollection, null, 2));
						console.log('Should Mention:', shouldMention);

						let mentionsGraphQL = '';
						if (shouldMention && mentionsCollection.mention.length > 0) {
							const mentions = mentionsCollection.mention
								.map((m) => `{id: ${m.id}, type: ${m.type}}`)
								.join(', ');
							mentionsGraphQL = `, mentions_list: [${mentions}]`;
						}

						// Use GraphQL variables to properly handle special characters, line breaks, and HTML
						const mutation = isReply
							? `
							mutation ($body: String!, $itemId: ID!, $parentId: ID!) {
								create_update (
									item_id: $itemId,
									body: $body,
									parent_id: $parentId${mentionsGraphQL}
								) {
									id
								}
							}`
							: `
							mutation ($body: String!, $itemId: ID!) {
								create_update (
									item_id: $itemId,
									body: $body${mentionsGraphQL}
								) {
									id
								}
							}`;

						const variables: { body: string; itemId: string; parentId?: string } = {
							body,
							itemId: itemId.toString(),
						};

						if (isReply) {
							variables.parentId = parentUpdateId;
						}

						console.log('mutation:', mutation);
						console.log('variables:', variables);
						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation, variables },
						});

						console.log('Create Update Result:', JSON.stringify(response, null, 2));

						const updateId = JSON.parse(response).data?.create_update?.id;
						if (!updateId) {
							throw new NodeApiError(this.getNode(), {
								message: 'Error creating update: Update not created, no ID returned',
							});
						}

						for (let i = 0; i < items.length; i++) {
							const attachmentsString = this.getNodeParameter('attachmentsUpdate', i) as string;
							const binaryNames = attachmentsString
								.split(',')
								.map((name) => name.trim())
								.filter(Boolean);

							console.log(`Item ${i} - Binary names to process:`, binaryNames);

							for (const binaryName of binaryNames) {
								let binaryData;
								try {
									binaryData = this.helpers.assertBinaryData(i, binaryName);
								} catch (error) {
									console.warn(`Item ${i}: Binary field '${binaryName}' not found. Skipping.`);
									continue;
								}

								const fileBuffer = Buffer.from(binaryData.data, 'base64');
								const fileName = binaryData.fileName || 'upload.dat';

								const form = new FormData();
								form.append(
									'query',
									`mutation ($file: File!) {
										add_file_to_update (update_id: ${updateId}, file: $file) {
											id
										}
									}`,
								);
								form.append('variables[file]', fileBuffer, {
									filename: `${fileName}.${binaryData.fileExtension || 'txt'}`,
									contentType: binaryData.mimeType || 'application/octet-stream',
								});

								const uploadResponse = await axios.post('https://api.monday.com/v2/file', form, {
									headers: {
										Authorization: headers.Authorization,
										...form.getHeaders(),
									},
									maxContentLength: Infinity,
									maxBodyLength: Infinity,
								});

								console.log(
									`Item ${i} - Upload response for '${binaryName}':`,
									uploadResponse.data,
								);
							}
						}

						break;
					}

					case 'updateUpdate': {
						const items = this.getInputData();
						const updateId = this.getNodeParameter('updateId', 0) as string;
						const body = this.getNodeParameter('bodyContent', 0) as string;
						const shouldMention = this.getNodeParameter('mention', 0, false) as boolean;
						const mentionsCollection = this.getNodeParameter('mentionsList', 0, []) as {
							mention: Array<{
								id: string;
								type: 'User' | 'Team' | 'Board';
							}>;
						};

						console.log('Mentions Collection:', JSON.stringify(mentionsCollection, null, 2));
						console.log('Should Mention:', shouldMention);

						let mentionsGraphQL = '';
						if (shouldMention && mentionsCollection.mention.length > 0) {
							const mentions = mentionsCollection.mention
								.map((m) => `{id: ${m.id}, type: ${m.type}}`)
								.join(', ');
							mentionsGraphQL = `, mentions_list: [${mentions}]`;
						}

						// Use GraphQL variables to properly handle special characters, line breaks, and HTML
						const mutation = `
							mutation ($body: String!, $updateId: ID!) {
								edit_update (id: $updateId, body: $body${mentionsGraphQL}) {
									id
								}
							}
						`;

						const variables = {
							body,
							updateId: updateId.toString(),
						};

						console.log('mutation:', mutation);
						console.log('variables:', variables);
						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation, variables },
						});

						for (let i = 0; i < items.length; i++) {
							const attachmentsString = this.getNodeParameter('attachmentsUpdate', i) as string;
							const binaryNames = attachmentsString
								.split(',')
								.map((name) => name.trim())
								.filter(Boolean);

							console.log(`Item ${i} - Binary names to process:`, binaryNames);

							for (const binaryName of binaryNames) {
								let binaryData;
								try {
									binaryData = this.helpers.assertBinaryData(i, binaryName);
								} catch (error) {
									console.warn(`Item ${i}: Binary field '${binaryName}' not found. Skipping.`);
									continue;
								}

								const fileBuffer = Buffer.from(binaryData.data, 'base64');
								const fileName = binaryData.fileName || 'upload.dat';

								const form = new FormData();
								form.append(
									'query',
									`mutation ($file: File!) {
											add_file_to_update (update_id: ${updateId}, file: $file) {
												id
											}
										}`,
								);
								form.append('variables[file]', fileBuffer, {
									filename: `${fileName}.${binaryData.fileExtension || 'txt'}`,
									contentType: binaryData.mimeType || 'application/octet-stream',
								});

								const uploadResponse = await axios.post('https://api.monday.com/v2/file', form, {
									headers: {
										Authorization: headers.Authorization,
										...form.getHeaders(),
									},
									maxContentLength: Infinity,
									maxBodyLength: Infinity,
								});

								console.log(
									`Item ${i} - Upload response for '${binaryName}':`,
									uploadResponse.data,
								);
							}
						}
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

					case 'uploadFile': {
						const items = this.getInputData();
						const updateId = this.getNodeParameter('updateId', 0) as string;
						const attachmentsRaw = this.getNodeParameter('attachmentsUpdate', 0) as string;

						if (!updateId || !attachmentsRaw) {
							throw new NodeApiError(this.getNode(), {
								message: 'Update ID and attachmentsUpdate (binary names) are required.',
							});
						}

						const binaryNames = attachmentsRaw
							.split(',')
							.map((name) => name.trim())
							.filter(Boolean);

						for (let i = 0; i < items.length; i++) {
							for (const binaryName of binaryNames) {
								let binaryData;
								try {
									binaryData = this.helpers.assertBinaryData(i, binaryName);
								} catch (error) {
									console.warn(`Item ${i}: Binary field '${binaryName}' not found. Skipping.`);
									continue;
								}

								const fileBuffer = Buffer.from(binaryData.data, 'base64');
								const fileName = `${binaryData.fileName || 'upload'}.${
									binaryData.fileExtension || 'dat'
								}`;

								console.log(`Item ${i} - Uploading file '${fileName}' from '${binaryName}'`);

								const form = new FormData();
								form.append(
									'query',
									`mutation ($file: File!) {
										add_file_to_update (update_id: ${updateId}, file: $file) {
											id
										}
									}`,
								);
								form.append('variables[file]', fileBuffer, {
									filename: fileName,
									contentType: binaryData.mimeType || 'application/octet-stream',
								});

								const uploadResponse = await axios.post('https://api.monday.com/v2/file', form, {
									headers: {
										Authorization: headers.Authorization,
										...form.getHeaders(),
									},
									maxContentLength: Infinity,
									maxBodyLength: Infinity,
								});

								console.log(
									`Item ${i} - Upload response for '${binaryName}':`,
									uploadResponse.data,
								);
								response = JSON.stringify(uploadResponse.data);
							}
						}

						break;
					}

					default:
						throw new NodeApiError(this.getNode(), {
							message: `Unsupported operation: ${operation}`,
						});
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
						const teamId = this.getNodeParameter('team', 0) as string;

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
						const isGuest = this.getNodeParameter('isGuest', 0) as boolean;
						const subscriberIds = this.getNodeParameter('userIds', 0) as string;

						const allowEmptyTeam = this.getNodeParameter('allowEmptyTeam', 0) as boolean;

						const mutation = `mutation { create_team(
										input: {name: "${teamName}", is_guest_team: ${isGuest}, subscriber_ids: [${subscriberIds}] }
										options: {allow_empty_team: ${allowEmptyTeam} }
									) { id name } }`;

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

						const mutation = `mutation { delete_team(team_id: ${teamId}) { id } }`;

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
						const teamId = this.getNodeParameter('teamIds', 0) as string;
						const userIds = this.getNodeParameter('userIds', 0) as string;

						const mutation = `mutation {
								add_users_to_team (team_id: ${teamId}, user_ids: [${userIds}]) {
									successful_users {
									name
									email 
									}
									failed_users {
									name
									email
									}
								}
								}   `;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});
						break;
					}

					case 'removeUsersFromTeam': {
						const teamId = this.getNodeParameter('teamIds', 0) as string;
						const userIds = this.getNodeParameter('userIds', 0) as string;

						const mutation = `mutation {
							remove_users_from_team (team_id: ${teamId}, user_ids: [${userIds}]) {
								successful_users {
								name
								email 
								}
								failed_users {
								name
								email
								}
							}
}  `;

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

			case 'downloadFile': {
				const fileId = this.getNodeParameter('fileId', 0) as string;

				const query = `
					query {
						assets (ids: [${fileId}]) {
							public_url
							name
							file_extension
						}
					}
				`;

				const responseFile = await this.helpers.request({
					method: 'POST',
					url: 'https://api.monday.com/v2',
					headers,
					body: { query },
					json: true,
				});

				const asset = responseFile?.data?.assets?.[0];

				if (!asset?.public_url) {
					throw new NodeApiError(this.getNode(), {
						message: 'Public URL not found for the given file ID.',
					});
				}

				const fileResponse = await this.helpers.request({
					method: 'GET',
					url: asset.public_url,
					encoding: null,
					resolveWithFullResponse: true,
				});

				const fileBuffer = fileResponse.body;
				const mimeType = fileResponse.headers['content-type'] || 'application/octet-stream';
				const fileName = `${asset.name || 'file'}`;

				const binaryData = await this.helpers.prepareBinaryData(fileBuffer, fileName, mimeType);

				const result: INodeExecutionData[] = [
					{
						json: {},
						binary: {
							data: binaryData,
						},
					},
				];

				return [result];
			}

			case 'query': {
				const runQuery = this.getNodeParameter('runQuery', 0) as string[];
				if (!runQuery) {
					throw new NodeApiError(this.getNode(), { message: 'Invalid item data.' });
				}
				switch (operation) {
					case 'query': {
						console.log('Run Query:', runQuery);
						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: runQuery },
						});
						break;
					}

					default:
						throw new NodeApiError(this.getNode(), {
							message: `Unsupported operation: ${operation}`,
						});
				}
				break;
			}
			case 'user': {
				switch (operation) {
					case 'listUsers': {
						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {
								query: `{
												users {
													id
													name
													email
													photo_small
													title
													is_admin
													is_guest
													is_view_only
													enabled
													teams {
													id
													name
													}
												}
												}`,
							},
						});

						break;
					}
					case 'getUser': {
						const userIds = this.getNodeParameter('userIds', 0) as string;
						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {
								query: `{
												users (ids: [${userIds}]) {
													id
													name
													email
													photo_small
													title
													is_admin
													is_guest
													is_view_only
													enabled
													teams {
													id
													name
													}
												}
												}`,
							},
						});

						break;
					}
				}
				break;
			}

			default:
				throw new NodeApiError(this.getNode(), { message: `Unsupported resource: ${resource}` });
		}
		response = await parseApiResponse(response);

		console.log('Response res: ', JSON.stringify(response, null, 2));

		if (response.success) {
			const parsed = JSON.parse(response.data);
			console.log('Parsed res: ', parsed);
			return [[{ json: parsed }]];
		} else {
			const parsed = JSON.parse(response.data);
			const firstError = parsed.errors || { message: 'Unknown error' };
			console.log(firstError[0]);
			throw new NodeApiError(this.getNode(), firstError, {
				message: firstError.message,
				description: JSON.stringify(firstError, null, 2),
			});
		}
	}
}
