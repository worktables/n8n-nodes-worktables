import { WorktablesAPI } from '../../credentials/WorktablesAPI.credentials';

describe('WorktablesAPI credentials', () => {
	const credentials = new WorktablesAPI();

	it('uses the credential name the nodes reference', () => {
		expect(credentials.name).toBe('WorktablesApi');
		expect(credentials.displayName).toBeTruthy();
	});

	it('declares a single required, masked apiKey field', () => {
		expect(credentials.properties).toHaveLength(1);
		const [apiKey] = credentials.properties;
		expect(apiKey).toMatchObject({
			name: 'apiKey',
			type: 'string',
			required: true,
			default: '',
			typeOptions: { password: true },
		});
	});
});
