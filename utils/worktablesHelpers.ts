import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { parseValue } from './parseValue';

/**
 * Build mentions GraphQL string from mentions collection
 */
export function buildMentionsGraphQL(
	shouldMention: boolean,
	mentionsCollection: { mention: Array<{ id: string; type: 'User' | 'Team' | 'Board' }> },
): string {
	if (shouldMention && mentionsCollection.mention.length > 0) {
		const mentions = mentionsCollection.mention
			.map((m) => `{id: ${m.id}, type: ${m.type}}`)
			.join(', ');
		return `, mentions_list: [${mentions}]`;
	}
	return '';
}

/**
 * Parse binary names from comma-separated string
 */
export function parseBinaryNames(binaryNamesString: string): string[] {
	return binaryNamesString
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);
}

/**
 * Make GraphQL request to Monday.com API
 */
export async function makeGraphQLRequest(
	executeFunctions: IExecuteFunctions,
	query: string,
	headers: Record<string, string>,
	variables?: Record<string, any>,
): Promise<string> {
	return await executeFunctions.helpers.request({
		method: 'POST',
		url: 'https://api.monday.com/v2',
		headers,
		body: variables ? { query, variables } : { query },
	});
}

/**
 * Format a single column value from Monday.com API response
 * Filters out column types that are not updateable: subtasks, formula, auto_number, creation_log, last_updated
 * Note: mirror columns are included for read operations (getItem, searchItems) even though they're not updateable
 */
export async function formatColumnValue(col: any): Promise<Record<string, any>> {
	// Filter out column types that are not updateable
	// Note: mirror is not filtered here - it should be included in read operations
	if (
		col.type === 'subtasks' ||
		col.type === 'formula' ||
		col.type === 'auto_number' ||
		col.type === 'creation_log' ||
		col.type === 'last_updated'
	) {
		return null as any; // Caller should check for null
	}

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

	return formattedCol;
}

/**
 * Format file name with extension, handling cases where extension might already be included
 */
export function formatFileName(
	fileName: string | undefined,
	fileExtension: string | undefined,
	defaultName: string = 'upload',
	defaultExtension: string = 'dat',
): string {
	let name = fileName || defaultName;

	// Only add extension if fileName doesn't already have one
	if (!name.includes('.')) {
		if (fileExtension) {
			name = `${name}.${fileExtension}`;
		} else {
			name = `${name}.${defaultExtension}`;
		}
	}

	return name;
}

/**
 * Escape a string for use in GraphQL string literals
 * Escapes backslashes, quotes, and newlines
 */
export function escapeGraphQLString(str: string): string {
	return str
		.replace(/\\/g, '\\\\')  // Escape backslashes first
		.replace(/"/g, '\\"')    // Escape quotes
		.replace(/\n/g, '\\n')   // Escape newlines
		.replace(/\r/g, '\\r')   // Escape carriage returns
		.replace(/\t/g, '\\t');  // Escape tabs
}

/**
 * Escape a JSON stringified object for use in GraphQL string literals
 * This properly escapes the JSON string so it can be safely embedded in a GraphQL query
 */
export function escapeGraphQLJSONString(obj: any): string {
	const jsonString = JSON.stringify(obj);
	return escapeGraphQLString(jsonString);
}

/**
 * Process column values and build column_values_object for Monday.com API
 * Used in createOrUpdateItem operation
 */
export async function processColumnValues(
	executeFunctions: IExecuteFunctions,
	columnValues: Array<{
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
	}>,
	boardId: string,
	apiKey: string,
): Promise<Record<string, any>> {
	const column_values_object: Record<string, any> = {};

	if (!columnValues || columnValues.length === 0) {
		return column_values_object;
	}

	// Fetch column types from board
	const columnTypeResponse = await executeFunctions.helpers.request({
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

	// Process each column value
	for (const col of columnValues) {
		const columnId = col.columnId;
		const columnDef = columnsType.find((c) => c.id === columnId);
		// Use columnType from parameter if available, otherwise use type from board
		const type = col.columnType || columnDef?.type;

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
					column_values_object[columnId] = value;
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
			} catch (error: any) {
				throw new NodeApiError(executeFunctions.getNode(), {
					message: `Invalid JSON format for column ${columnId}: ${error.message}`,
				});
			}
			continue;
		}

		// Process other column types (matching updateItem logic)
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
			case 'multiple-person':
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
						if (id) personsAndTeams.push({ id: parseInt(String(id), 10), kind: 'person' });
					}
					for (const id of teamsList) {
						if (id) personsAndTeams.push({ id: parseInt(String(id), 10), kind: 'team' });
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
			case 'dropdown':
				{
					const dropdownLabels = col.dropdownValue
						?.split(',')
						.map((label) => label.trim())
						.filter(Boolean);
					if (dropdownLabels?.length) {
						column_values_object[columnId] = { labels: dropdownLabels };
					}
				}
				break;
			case 'date':
				{
					const dateValue = col.dateValue as string;
					if (dateValue) {
						const date = new Date(dateValue);
						if (isNaN(date.getTime())) {
							throw new NodeApiError(executeFunctions.getNode(), {
								message: `Invalid date format for column ${columnId}`,
							});
						}

						// Preserve provided date part and time (if any) instead of converting to UTC
						const [rawDatePart = '', rawTimePart] = dateValue.split('T');
						const datePart = rawDatePart || date.toISOString().split('T')[0];
						// Capture HH:mm[:ss] ignoring trailing timezone info
						const timeMatch = rawTimePart?.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);

						const datePayload: { date: string; time?: string } = { date: datePart };
						if (timeMatch) {
							const [, hours, minutes, seconds = '00'] = timeMatch;
							datePayload.time = `${hours}:${minutes}:${seconds}`;
						}

						column_values_object[columnId] = datePayload;
					}
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
					phone: `${col.countryCode?.split(' ')[0] || ''}${col.phoneValue || ''}`.replace(
						/[^\d+]/g,
						'',
					),
					countryShortName: col.countryCode?.split(' ')[1] || '',
				};
				break;
			case 'fileLink':
			case 'file':
				if (col.fileLinks?.file) {
					const links = col.fileLinks.file.map((file: any) => ({
						fileType: 'LINK',
						linkToFile: file.linkToFile,
						name: file.name,
					}));
					column_values_object[columnId] = { files: links };
				}
				break;
			default:
				if (col.columnValue !== undefined) {
					column_values_object[columnId] = col.columnValue;
				}
		}
	}

	return column_values_object;
}

