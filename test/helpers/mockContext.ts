import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	INode,
	INodeExecutionData,
	IBinaryData,
} from 'n8n-workflow';

export interface MockContextOptions {
	/** Node parameters returned by getNodeParameter / getCurrentNodeParameter. */
	params?: Record<string, unknown>;
	/** Credentials returned by getCredentials. Pass null to simulate none configured. */
	credentials?: Record<string, unknown> | null;
	/** Value returned by continueOnFail(). */
	continueOnFail?: boolean;
	/** Items returned by getInputData(). */
	inputData?: INodeExecutionData[];
	/** Binary data available to assertBinaryData / getBinaryDataBuffer, keyed by property name. */
	binary?: Record<string, { data: IBinaryData; buffer: Buffer }>;
	/** Request body for webhook contexts. */
	webhookBody?: unknown;
}

export const TEST_API_KEY = 'test-api-key-123';

export const TEST_NODE: INode = {
	id: 'node-1',
	name: 'Worktables',
	type: 'worktables',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

/**
 * Builds a mocked n8n execution context that satisfies the subset of
 * IExecuteFunctions / ILoadOptionsFunctions / IWebhookFunctions used by the nodes.
 *
 * `helpers.request` is a jest mock; tests queue responses with mockResolvedValueOnce
 * and assert on the GraphQL body that was sent.
 */
export function createMockContext(options: MockContextOptions = {}) {
	const {
		params = {},
		credentials = { apiKey: TEST_API_KEY },
		continueOnFail = false,
		inputData = [{ json: {} }],
		binary = {},
		webhookBody = {},
	} = options;

	const request = jest.fn();
	const prepareBinaryData = jest.fn(
		async (buffer: Buffer, fileName?: string, mimeType?: string): Promise<IBinaryData> => ({
			data: buffer.toString('base64'),
			mimeType: mimeType ?? 'application/octet-stream',
			fileName,
		}),
	);
	const returnJsonArray = jest.fn((data: unknown) => {
		const list = Array.isArray(data) ? data : [data];
		return list.map((json) => ({ json })) as INodeExecutionData[];
	});
	const assertBinaryData = jest.fn((_index: number, propertyName: string) => {
		const entry = binary[propertyName];
		if (!entry) {
			throw new Error(`No binary data property "${propertyName}"`);
		}
		return entry.data;
	});
	const getBinaryDataBuffer = jest.fn(async (_index: number, propertyName: string) => {
		const entry = binary[propertyName];
		if (!entry) {
			throw new Error(`No binary data property "${propertyName}"`);
		}
		return entry.buffer;
	});

	const response = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn().mockReturnThis(),
		send: jest.fn().mockReturnThis(),
		end: jest.fn().mockReturnThis(),
	};

	const getNodeParameter = jest.fn((name: string, _index?: number, fallback?: unknown) => {
		if (name in params) return params[name];
		return fallback;
	});

	const context = {
		getNode: jest.fn(() => TEST_NODE),
		getNodeParameter,
		getCurrentNodeParameter: jest.fn((name: string) => params[name]),
		getCredentials: jest.fn(async () => credentials),
		continueOnFail: jest.fn(() => continueOnFail),
		getInputData: jest.fn(() => inputData),
		getRequestObject: jest.fn(() => ({ body: webhookBody })),
		getResponseObject: jest.fn(() => response),
		helpers: {
			request,
			prepareBinaryData,
			returnJsonArray,
			assertBinaryData,
			getBinaryDataBuffer,
		},
	};

	return {
		context,
		request,
		response,
		asExecute: () => context as unknown as IExecuteFunctions,
		asLoadOptions: () => context as unknown as ILoadOptionsFunctions,
		asWebhook: () => context as unknown as IWebhookFunctions,
	};
}

/** Returns the GraphQL query string from the nth helpers.request call. */
export function requestedQuery(request: jest.Mock, callIndex = 0): string {
	const call = request.mock.calls[callIndex];
	if (!call) {
		throw new Error(`helpers.request was not called ${callIndex + 1} time(s)`);
	}
	const body = call[0].body;
	const parsed = typeof body === 'string' ? JSON.parse(body) : body;
	return parsed.query as string;
}

/** Returns the GraphQL variables object from the nth helpers.request call, if any. */
export function requestedVariables(request: jest.Mock, callIndex = 0): Record<string, unknown> | undefined {
	const body = request.mock.calls[callIndex][0].body;
	const parsed = typeof body === 'string' ? JSON.parse(body) : body;
	return parsed.variables;
}

/** Collapses all whitespace runs so GraphQL strings can be compared loosely. */
export function squash(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

export function jsonResponse(payload: unknown): string {
	return JSON.stringify(payload);
}
