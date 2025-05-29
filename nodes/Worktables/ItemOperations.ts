import { INodeProperties } from 'n8n-workflow';

export const itemOperations: INodeProperties[] = [
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
				value: 'create',
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
		default: 'create',
		required: true,
		displayOptions: {
			show: { resource: ['item'] },
		},
	},
];

export const itemFields: INodeProperties[] = [
	{
		displayName: 'Board',
		name: 'boardId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'List Boards',
				name: 'list',
				type: 'list',
				placeholder: 'Select a board...',
				typeOptions: {
					searchListMethod: 'getBoardSearchList',
					searchable: true,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'Board',
			},
		],
		displayOptions: {
			show: {
				resource: ['item'],
				operation: ['updateItem' ],
			},
		},
	},
	{
		displayName: 'Group Name or ID',
		name: 'groupId',
		type: 'options',
		typeOptions: {
			loadOptionsDependsOn: ['boardId'],
			loadOptionsMethod: 'getGroupsFromBoard',
		},
		default: '',
		required: true,
		description:
			'Select an item from the selected board. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['item'],
				operation: ['updateItem'],
			},
		},
	},
	{
		displayName: 'Item',
		name: 'itemId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'List items',
				name: 'list',
				type: 'list',
				placeholder: 'Select an item...',
				typeOptions: {
					searchListMethod: 'getItemSearchList',
					searchable: true,
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'item',
			},
		],
		displayOptions: {
			show: {
				resource: ['item'],
				operation: ['updateItem'],
			},
		},
	},
	{
		displayName: 'Column Values',
		name: 'columnValues',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: [],
		placeholder: 'Add Column Value',
		displayOptions: {
			show: {
				resource: ['item'],
				operation: ['updateItem'],
			},
		},
		options: [
			{
				displayName: 'Value',
				name: 'value',
				placeholder: 'Add Column Value',
				values: [
					{
						displayName: 'Column',
						name: 'columnId',
						type: 'resourceLocator',
						default: { mode: 'list', value: '' },
						required: true,
						modes: [
							{
								displayName: 'List Columns',
								name: 'list',
								type: 'list',
								placeholder: 'Select a column...',
								typeOptions: {
									searchListMethod: 'getColumnsItems',
									searchable: true,
								},
							},
							{
								displayName: 'ID',
								name: 'id',
								type: 'string',
								placeholder: 'columnId',
							},
						],
						typeOptions: {
							loadOptionsDependsOn: ['boardId'],
						},
					},
					{
						displayName: 'Value',
						name: 'newValue',
						type: 'string',
						default: '',

					},

				],
			},
		],
	},
];
