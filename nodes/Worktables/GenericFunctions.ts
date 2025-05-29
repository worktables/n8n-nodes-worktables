import { ILoadOptionsFunctions, INodeListSearchResult, NodeApiError } from 'n8n-workflow';

export async function getBoardSearchList(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const credentials = await this.getCredentials('WorktablesApi');
	const apiKey = credentials?.apiKey;

	if (!apiKey) {
		throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
	}

	const limit = 100;
	let currentPage = 1;
	let allBoard: { id: string; name: string }[] = [];

	while (true) {
		const responseData = await this.helpers.request({
			method: 'POST',
			url: 'https://api.monday.com/v2',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: `{ boards (limit: ${limit}, page: ${currentPage}) { id name } }`,
			}),
		});

		const parsed = JSON.parse(responseData);
		const board = parsed?.data?.boards ?? [];

		allBoard = allBoard.concat(board);

		if (board.length < limit) {
			break;
		}

		currentPage++;
	}

	const filteredResults = allBoard
		.filter((ws) => (filter ? ws.name.toLowerCase().includes(filter.toLowerCase()) : true))
		.map((ws) => ({
			name: ws.name,
			value: ws.id,
		}));
	console.log('All Boards:', allBoard);
	console.log('All Boards Filtered:', filteredResults);
	return {
		results: filteredResults.sort((a, b) => a.name.localeCompare(b.name)),
	};
}

export async function getItemSearchList(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	console.log('getItemSearchList ');
	const credentials = await this.getCredentials('WorktablesApi');
	const apiKey = credentials?.apiKey;

	if (!apiKey) {
		throw new NodeApiError(this.getNode(), { message: 'API Key not found' });
	}

	let allItems: { id: string; name: string }[] = [];

	const boardId = this.getNodeParameter('boardId', 0) as {
		value: string;
	};
	const groupId = this.getNodeParameter('groupId', 0) as string;

	console.log('Board ID:', boardId.value);
	console.log('Group ID:', groupId);

	const responseData = await this.helpers.request({
		method: 'POST',
		url: 'https://api.monday.com/v2',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: `{
				boards(ids: "${boardId.value}") {
					groups(ids: "${groupId}") {
					items_page (limit: 500) {
						items {
						id
						name
						}
					}
					}
				}
				}`,
		}),
	});

	const parsed = JSON.parse(responseData);
	console.log('Response Data:', JSON.stringify(parsed, null, 2));
	allItems = parsed?.data?.boards[0].groups[0].items_page.items ?? [];

	const filteredResults = allItems
		.filter((ws) => (filter ? ws.name.toLowerCase().includes(filter.toLowerCase()) : true))
		.map((ws) => ({
			name: ws.name,
			value: ws.id,
		}));

	return {
		results: filteredResults.sort((a, b) => a.name.localeCompare(b.name)),
	};
}

export async function getColumnsItems(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const boardId = this.getCurrentNodeParameter('boardId') as {
		value: string;
	};

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
				boards(ids: ${boardId.value}) {
					columns {
						id
						title
						type
					}
				}
			}`,
		}),
	});

	const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
	console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));
	const columns = parsedResponse?.data?.boards?.[0]?.columns ?? [];
	const filteredColumns = columns
		.filter(
			(column: { type: string }) =>
				![
					'subitem',
					'auto_number',
					'button',
					'creation_log',
					'formula',
					'item_id',
					'last_updated',
					'progress',
					'subtasks',
				].includes(column.type),
		)
		.map((column: { id: string; title: string }) => ({
			name: column.title,
			value: column.id,
		}));

	return {
		results: filteredColumns,
	};
}
