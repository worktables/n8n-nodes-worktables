import { IExecuteFunctions } from 'n8n-workflow';
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

