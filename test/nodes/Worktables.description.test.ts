import { Worktables } from '../../nodes/Worktables/Worktables.node';
import type { INodeProperties } from 'n8n-workflow';

const node = new Worktables();
const { description } = node;

function collectProperties(props: INodeProperties[]): INodeProperties[] {
	const all: INodeProperties[] = [];
	const walk = (list: any[]) => {
		for (const prop of list) {
			all.push(prop);
			// fixedCollection nests its own properties under options[].values
			if (prop.type === 'fixedCollection' || prop.type === 'collection') {
				for (const option of prop.options ?? []) {
					if (Array.isArray(option.values)) walk(option.values);
					if (Array.isArray(option.options)) walk(option.options);
				}
			}
		}
	};
	walk(props);
	return all;
}

const allProperties = collectProperties(description.properties);

describe('Worktables node description', () => {
	it('has the expected identity', () => {
		expect(description.name).toBe('worktables');
		expect(description.displayName).toBe('Worktables');
		expect(description.version).toBe(1);
		expect(description.usableAsTool).toBe(true);
	});

	it('requires the WorktablesApi credential', () => {
		expect(description.credentials).toEqual([{ name: 'WorktablesApi', required: true }]);
	});

	it('targets the Monday.com v2 API with a pinned API version', () => {
		expect(description.requestDefaults).toEqual({
			baseURL: 'https://api.monday.com/v2',
			headers: { 'Content-Type': 'application/json', 'API-Version': '2026-01' },
		});
	});

	it('exposes every documented resource', () => {
		const resource = description.properties.find((p) => p.name === 'resource');
		expect(resource).toBeDefined();
		const values = (resource!.options as Array<{ value: string }>).map((o) => o.value).sort();
		expect(values).toEqual(
			['board', 'downloadFile', 'item', 'notification', 'query', 'subitem', 'team', 'update', 'user'].sort(),
		);
		expect(resource!.default).toBe('board');
	});

	it('gives every property a name, displayName and type', () => {
		for (const prop of allProperties) {
			expect(prop.name).toEqual(expect.any(String));
			expect(prop.displayName).toEqual(expect.any(String));
			expect(prop.type).toEqual(expect.any(String));
		}
	});

	it('only references loadOptions methods that exist', () => {
		const available = Object.keys(node.methods.loadOptions);
		const referenced = new Set<string>();
		for (const prop of allProperties) {
			const method = (prop.typeOptions as any)?.loadOptionsMethod;
			if (method) referenced.add(method);
		}
		expect(referenced.size).toBeGreaterThan(0);
		for (const method of referenced) {
			expect(available).toContain(method);
		}
	});

	it('maps each operation selector to a resource', () => {
		const operationProps = description.properties.filter((p) => p.name === 'operation');
		const mapping: Record<string, string[]> = {};
		for (const prop of operationProps) {
			const resources = prop.displayOptions?.show?.resource as string[];
			expect(resources).toHaveLength(1);
			mapping[resources[0]] = (prop.options as Array<{ value: string }>).map((o) => o.value);
		}

		// Documents the current state of the node. Two known gaps are captured here on purpose:
		// - "subitem" is a declared resource but has no operation selector (its fields are
		//   shown under "item" operations via displayOptions).
		// - "account" has an operation selector but is not a declared resource, so it is
		//   unreachable from the UI.
		expect(Object.keys(mapping).sort()).toEqual(
			['account', 'board', 'downloadFile', 'item', 'notification', 'query', 'team', 'update', 'user'].sort(),
		);
		for (const ops of Object.values(mapping)) {
			expect(ops.length).toBeGreaterThan(0);
			expect(new Set(ops).size).toBe(ops.length);
		}
	});

	it('has item operations that cover the documented item and subitem behaviour', () => {
		const itemOps = description.properties.find(
			(p) => p.name === 'operation' && (p.displayOptions?.show?.resource as string[])?.[0] === 'item',
		)!;
		const values = (itemOps.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toEqual(
			expect.arrayContaining([
				'getItem',
				'createItem',
				'updateItem',
				'createOrUpdateItem',
				'deleteItem',
				'duplicateItem',
				'listBoardItems',
				'searchItems',
			]),
		);
	});

	it('gives every options-type property a non-empty options list', () => {
		for (const prop of allProperties) {
			if (prop.type === 'options' || prop.type === 'multiOptions') {
				const hasStaticOptions = Array.isArray(prop.options) && prop.options.length > 0;
				const isDynamic = Boolean((prop.typeOptions as any)?.loadOptionsMethod);
				expect(hasStaticOptions || isDynamic).toBe(true);
			}
		}
	});
});
