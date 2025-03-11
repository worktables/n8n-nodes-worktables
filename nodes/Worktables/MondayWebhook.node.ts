import {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

export class MondayWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Monday Webhook',
		name: 'mondayWebhook',
		group: ['trigger'],
		version: 1,
		description: 'Triggers workflows when an event occurs in Monday.com',
		defaults: {
			name: 'Monday Webhook',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'monday-webhook',
			},
		],
		properties: [],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();

		const body = req.body;

		// ✅ Respond to Monday.com's challenge request
		if (body.challenge) {
			res.status(200).json({ challenge: body.challenge });
			return {
				webhookResponse: 'Challenge received',
			};
		}

		// ✅ Emit event to n8n workflow
		return {
			workflowData: [this.helpers.returnJsonArray([body])],
			// Optional: You can also customize the response if necessary
		};
	}
}
