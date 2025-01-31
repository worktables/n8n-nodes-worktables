import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class WorktablesAPI implements ICredentialType {
	name = 'WorktablesApi'; //
	displayName = 'Worktables API'; 
	documentationUrl = 'https://docs.your-api.com'; 

	properties: INodeProperties[] = [
		{
			displayName: 'API Key', 
			name: 'apiKey', 
			type: 'string',
			default: '', 
			required: true, 
			description: 'The API key to access Worktables', 
		},
	];
}
