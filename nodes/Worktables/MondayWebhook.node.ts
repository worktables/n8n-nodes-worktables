/* eslint-disable n8n-nodes-base/node-class-description-inputs-wrong-regular-node */
/* eslint-disable n8n-nodes-base/node-class-description-outputs-wrong */
/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

export class MondayWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Worktables Webhook',
		name: 'mondayWebhook',
		icon: 'file:worktables_icon.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers workflows when an event occurs in Monday.com',
		defaults: {
			name: 'Monday Webhook',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: '/webhook',
			},
		],
		properties: [],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();

		const body = req.body;

		console.log('Webhook received', body);

		// ✅ Respond to Monday.com's challenge request
		if (body.challenge) {
			res.status(200).json({ challenge: body.challenge });
			return {};
		}

		// ✅ Emit event to n8n workflow
		return {
			workflowData: [this.helpers.returnJsonArray([body])],
		};
	}
}
