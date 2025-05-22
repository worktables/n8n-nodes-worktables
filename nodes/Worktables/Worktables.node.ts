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
	NodeOperationError,
} from 'n8n-workflow';
import { parseApiResponse } from '../../utils/isErrorResponse';

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
				noDataExpression: true,
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
				description: 'Select the category of actions to perform',
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
						action: 'Run api a query',
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
					{
						name: 'List Item Subscribers',
						value: 'listItemSubscribers',
						description: 'List all subscribers of an item',
						action: 'List item subscribers',
					},
					{
						name: 'Upload a File to an Item Column',
						value: 'uploadItemFile',
						action: 'Upload a file to an item column',
					},
					{
						name: 'Download Files From an Item Column',
						value: 'downloadFilesFromItem',
						action: 'Download files from an item column',
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
						name: 'Upload',
						value: 'uploadFile',
						description: 'Upload a file to an update',
						action: 'Upload an update',
					},
					{
						name: 'Download',
						value: 'downloadFile',
						description: 'Download a file from update',
						action: 'Download an update',
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
						name: 'List Members of a Team',
						value: 'listTeamMembers',
						description: 'List all members of a specific team',
						action: 'List members of a team',
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

			// Fields

			// Board Fields
			{
				displayName: 'Board',
				name: 'boardName',
				type: 'string',
				default: '',
				description: 'Enter the board name',
				displayOptions: { show: { operation: ['createBoard', 'duplicateBoard'] } },
			},
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
						operation: [
							'createBoard',
							'duplicateBoard',
							'getBoard',
							'listBoards',
							'listBoardGroups',
							'createGroup',
							'duplicateGroup',
							'listBoardActivityLogs',
							'listBoardSubscribers',
							'addBoardSubscribers',
							'removeBoardSubscribers',
							'createItem',
							'updateItem',
							'duplicateItem',
							'searchItems',
							'uploadItemFile',
							'listUpdates',
							'createUpdate',
						],
					},
				},
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
				displayName: 'Template',
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
				displayName: 'Board',
				name: 'boardId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBoards',
					loadOptionsDependsOn: ['workspace', 'limit', 'state', 'orderBy', 'boardKind'],
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
							'listUpdates',
							'createUpdate',
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
				description:
					'Select a folder. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: { show: { operation: ['createFolder', 'duplicateBoard', 'createBoard'] } },
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
					show: { operation: ['createItem', 'duplicateGroup'] }, // before resource: ['item']
				},
			},
			{
				displayName: 'Group',
				name: 'groupName',
				type: 'string',
				default: '',
				description: 'Enter the group name',
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
						operation: ['updateItem', 'createSubitem', 'uploadFile', 'listUpdates', 'createUpdate'],
					},
				},
			},
			{
				displayName: 'Board',
				name: 'boardId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getBoards',
					loadOptionsDependsOn: ['workspace'],
				},
				default: '',
				required: true,
				description:
					'Select a Monday board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['createItem', 'duplicateItem', 'searchItems', 'uploadItemFile'],
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
						operation: ['createItem', 'createSubitem'],
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
						operation: ['createItem'],
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
				description: 'Select the binary file to upload. Use the expression: {{$binary.data}}.',
			},

			// Update Fields
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
			{
				displayName: 'Update ID',
				name: 'updateId',
				type: 'string',

				displayOptions: {
					show: {
						operation: ['updateUpdate', 'deleteUpdate'],
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

				allWorkspace.push({ name: '🏆 Team Hub', value: '-1' });
				return allWorkspace.sort((a, b) => a.name.localeCompare(b.name));
			},
			async getBoards() {
				const credentials = await this.getCredentials('WorktablesApi');
				const workspaceId = this.getCurrentNodeParameter('workspace') as string;
				const limit = this.getCurrentNodeParameter('limit') as number;
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

				const queryLimit = limit === 0 || !limit ? 100 : limit;

				const workspaceFilter =
					workspaceId === '-1' ? 'workspace_ids: [null]' : `workspace_ids: [${workspaceId}]`;

				const orderByFilter = orderBy === 'none' || !orderBy ? '' : `, order_by: ${orderBy}`;
				const boardKindFilter =
					boardKind === 'all' || !boardKind ? '' : `, board_kind: ${boardKind}`;

				const query = JSON.stringify({
					query: `{
						boards(
							limit: ${queryLimit},
							page: ${page},
							${workspaceFilter},
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

				console.log('Query: ', query);

				while (hasMore) {
					const currentQuery = JSON.stringify({
						query: `{
							boards(
								limit: ${queryLimit},
								page: ${page},
								${workspaceFilter},
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

					console.log('Query (page ' + page + '): ', currentQuery);

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

					console.log('Boards: ', allBoards);
					console.log('Boards length: ', boards.length);

					if (limit > 0 || boards.length < queryLimit) {
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
							column.type !== 'button' &&
							column.type !== 'creation_log' &&
							column.type !== 'formula' &&
							column.type !== 'item_id' &&
							column.type !== 'last_updated' &&
							column.type !== 'progress' &&
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
								) { id }
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

						// Adicionando usuários como Subscribers
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

						// Adicionando equipes como Owners
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

						// Adicionando equipes como Subscribers
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
						const workspaceId = this.getNodeParameter('workspace', 0) as string;
						const limit = this.getNodeParameter('limit', 0) as number;
						const boardKind = this.getNodeParameter('boardKind', 0) as string;
						const orderBy = this.getNodeParameter('orderBy', 0) as string;
						const state = this.getNodeParameter('state', 0) as string;

						const apiKey = credentials?.apiKey;

						if (!apiKey) {
							throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
						}

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
												workspace_ids: ${workspaceId},
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
					case 'getItem': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const isSubitem = this.getNodeParameter('isSubitem', 0) as boolean;

						const fetchSubitems =
							!isSubitem && (this.getNodeParameter('fetchSubitems', 0) as boolean);

						const fetchParentItem =
							isSubitem && (this.getNodeParameter('fetchParentItems', 0) as boolean);

						const queryColumnValues = `
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

						const querySubitems = `
							subitems {
								${queryColumnValues}
							}
						`;

						const queryParentItem = `
							parent_item {
								id
								name
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
						};

						for (const col of columnValues) {
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

							formatted[col.id] = formattedCol;
						}

						if (item.subitems && Array.isArray(item.subitems)) {
							formatted.subitems = item.subitems.map((subitem: any) => {
								const subFormatted: Record<string, any> = {};

								for (const col of subitem.column_values || []) {
									const subCol: Record<string, any> = {
										type: col.type,
										value: col.value,
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

									subFormatted[col.id] = subCol;
								}

								return subFormatted;
							});
						}

						if (item.parent_item && typeof item.parent_item === 'object') {
							const parentItem = item.parent_item;
							const parentFormatted: Record<string, any> = {
								id: parentItem.id,
								name: parentItem.name,
								created_at: parentItem.created_at,
								updated_at: parentItem.updated_at,
							};

							for (const col of parentItem.column_values || []) {
								const subCol: Record<string, any> = {
									type: col.type,
									value: col.value,
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

								parentFormatted[col.id] = subCol;
							}

							formatted.parent_item = parentFormatted;
						}

						return [[{ json: formatted }]];
					}

					case 'updateItem': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
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

						const mutation = `mutation {
									change_multiple_column_values(
										create_labels_if_missing: true
										board_id: ${boardId},
										item_id: "${itemId}",
										column_values: ${JSON.stringify(column_values)}
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
					case 'createItem': {
						const itemName = this.getNodeParameter('itemName', 0) as string;
						const groupId = this.getNodeParameter('groupId', 0) as string;
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

						let parentId = '';
						if (parentBoardName.startsWith('Subitems of')) {
							parentId = this.getNodeParameter('parentId', 0) as string;
						}

						console.log('Parent ID: ', parentId);
						const mutation = parentId
							? `mutation {
								create_subitem(
									create_labels_if_missing: true,
									parent_item_id: ${parentId},
									item_name: "${itemName}",
									column_values: ${JSON.stringify(column_values)}
								) { id }
							}`
							: `mutation {
								create_item(
									create_labels_if_missing: true,
									board_id: ${boardId},
									item_name: "${itemName}",
									group_id: "${groupId}",
									column_values: ${JSON.stringify(column_values)}
								) { id }
							}`;

						console.log('Mutation: ', mutation);
						console.log('ParentID: ', parentId);

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: mutation },
						});

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

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query },
						});

						break;
					}
					case 'uploadItemFile': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const columnId = this.getNodeParameter('fileColumnId', 0) as string;
						const items = this.getInputData();
						let returnData: { fileName: string; mimeType: string; data: string } | null = null;

						for (let i = 0; i < items.length; i++) {
							const fileInput = this.getNodeParameter('binaryPropertyName', i) as string;

							if (items[i].binary?.[fileInput]) {
								const file = items[i].binary?.[fileInput];
								if (!file) {
									throw new NodeOperationError(
										this.getNode(),
										`Binary property "${fileInput}" is undefined.`,
									);
								}
								returnData = {
									fileName: file?.fileName!,
									mimeType: file.mimeType,
									data: file.data,
								};
								break;
							}
						}

						if (!returnData) {
							throw new NodeOperationError(this.getNode(), 'No valid file data found in input.');
						}

						const formData = new FormData();
						formData.append(
							'query',
							`
        mutation ($file: File!) {
            add_file_to_update (update_id: 1234567890, file: $file) {
                id
            }
        }
    `,
						);

						const fileBlob = new Blob([Buffer.from(returnData.data, 'base64')], {
							type: returnData.mimeType,
						});

						formData.append('variables[file]', fileBlob, returnData.fileName);

						const getUploadUrlQuery = `mutation {
        add_file_to_column(item_id: ${itemId}, column_id: "${columnId}") {
            id
            url
        }
    }`;

						response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.monday.com/v2',
							headers,
							body: { query: getUploadUrlQuery },
							json: true,
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
						break;
					}
					case 'createUpdate': {
						const itemId = this.getNodeParameter('itemId', 0) as string;
						const body = this.getNodeParameter('bodyContent', 0) as string;

						const isReply = this.getNodeParameter('isReply', 0) as boolean;

						let parentUpdateId = '';
						if (isReply) {
							parentUpdateId = this.getNodeParameter('updateId', 0) as string;
						}

						const mutation = `
							mutation {
								create_update (item_id: ${itemId}, body: "${body}", ${
							isReply ? `parent_id: ${parentUpdateId}` : ''
						}) {
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
						const body = this.getNodeParameter('bodyContent', 0) as string;

						const mutation = `
							mutation {
								edit_update (id: ${updateId}, body: "${body}") {
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

					case 'uploadFileUpdate': {
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
						const teamId = this.getNodeParameter('team', 0) as string;

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
			case 'query': {
				const runQuery = this.getNodeParameter('runQuery', 0) as string[];
				if (!runQuery) {
					throw new NodeApiError(this.getNode(), { message: 'Invalid item data.' });
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
