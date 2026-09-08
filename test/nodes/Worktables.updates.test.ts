import axios from 'axios';
import FormData from 'form-data';
import { Worktables } from '../../nodes/Worktables/Worktables.node';
import {
	createMockContext,
	jsonResponse,
	requestedQuery,
	requestedVariables,
	TEST_API_KEY,
} from '../helpers/mockContext';

jest.mock('axios');
const post = jest.mocked(axios.post);
const node = new Worktables();
const params = { resource: 'update', itemId: '51', updateId: '70' };

beforeEach(() => {
	post.mockReset();
	jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('update operations', () => {
	it('filters update dates inclusively and normalizes pinned status', async () => {
		const mock = createMockContext({
			params: { ...params, operation: 'listUpdates', fromDate: '2026-01-02', toDate: '2026-01-03' },
		});
		mock.request.mockResolvedValueOnce(
			jsonResponse({
				data: {
					items: [
						{
							updates: [
								{ id: '1', created_at: '2026-01-01' },
								{ id: '2', created_at: '2026-01-02', pinned_to_top: [{ item_id: '51' }] },
								{ id: '3', created_at: '2026-01-03', pinned_to_top: [] },
								{ id: '4', created_at: '2026-01-04' },
							],
						},
					],
				},
			}),
		);
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
			[
				{ json: { id: '2', created_at: '2026-01-02', pinned_to_top: true } },
				{ json: { id: '3', created_at: '2026-01-03', pinned_to_top: false } },
			],
		]);
		expect(requestedQuery(mock.request)).toContain('updates(limit: 25)');
	});

	it.each([{ tail: [] }, { tail: [{ id: 'last' }] }])(
		'fetches all update pages until the final page: %j',
		async ({ tail }) => {
			const mock = createMockContext({ params: { ...params, operation: 'listUpdates', limit: 0 } });
			const first = Array.from({ length: 100 }, (_, id) => ({ id: String(id) }));
			mock.request
				.mockResolvedValueOnce(jsonResponse({ data: { items: [{ updates: first }] } }))
				.mockResolvedValueOnce(jsonResponse({ data: { items: [{ updates: tail }] } }));
			const result = await node.execute.call(mock.asExecute());
			expect(result?.[0]).toHaveLength(100 + tail.length);
			expect(result?.[0][0].json).toEqual({ id: '0', pinned_to_top: false });
			expect(requestedQuery(mock.request, 1)).toContain('updates(limit: 100, page: 2)');
			expect(mock.request).toHaveBeenCalledTimes(2);
		},
	);

	describe.each(['listUpdates', 'pinUpdate'])('%s errors', (operation) => {
		it.each([false, true])('honors continueOnFail=%s', async (continueOnFail) => {
			const mock = createMockContext({ params: { ...params, operation }, continueOnFail });
			const error = { message: 'Access denied' };
			mock.request.mockResolvedValueOnce(jsonResponse({ errors: [error] }));
			const run = node.execute.call(mock.asExecute());
			if (continueOnFail)
				await expect(run).resolves.toEqual([
					[{ json: { error: { message: error.message, details: error } } }],
				]);
			else await expect(run).rejects.toThrow('Access denied');
		});
	});

	it('pins the selected update with GraphQL variables', async () => {
		const mock = createMockContext({ params: { ...params, operation: 'pinUpdate' } });
		const payload = { data: { pin_to_top: { id: '70' } } };
		mock.request.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[{ json: payload }]]);
		expect(requestedVariables(mock.request)).toEqual({ updateId: '70', itemId: '51' });
		expect(requestedQuery(mock.request)).toContain('pin_to_top (id: $updateId, item_id: $itemId)');
	});

	it.each([{ itemId: '' }, { updateId: '' }])('requires both IDs to pin: %j', async (missing) => {
		const mock = createMockContext({ params: { ...params, operation: 'pinUpdate', ...missing } });
		await expect(node.execute.call(mock.asExecute())).rejects.toThrow(
			'Item ID and Update ID are required',
		);
		expect(mock.request).not.toHaveBeenCalled();
	});

	it('deletes the selected update', async () => {
		const mock = createMockContext({ params: { ...params, operation: 'deleteUpdate' } });
		const payload = { data: { delete_update: { id: '70' } } };
		mock.request.mockResolvedValueOnce(jsonResponse(payload));
		await expect(node.execute.call(mock.asExecute())).resolves.toEqual([[{ json: payload }]]);
		expect(requestedQuery(mock.request)).toContain('delete_update (id: 70)');
	});

	it.each(['updateUpdate', 'uploadFile'])(
		'%s uploads binary attachments and skips missing fields',
		async (operation) => {
			const buffer = Buffer.from('report contents');
			const mock = createMockContext({
				params: {
					...params,
					operation,
					bodyContent: '<p>Ready "now"</p>\nNext',
					mention: true,
					mentionsList: { mention: [{ id: '8', type: 'Team' }] },
					attachmentsUpdate: 'missing,report',
				},
				binary: {
					report: {
						buffer,
						data: {
							data: buffer.toString('base64'),
							mimeType: 'text/plain',
							fileName: 'report',
							fileExtension: 'txt',
						},
					},
				},
			});
			const edit = { data: { edit_update: { id: '70' } } };
			const upload = { data: { add_file_to_update: { id: '80' } } };
			mock.request.mockResolvedValueOnce(jsonResponse(edit));
			post.mockResolvedValueOnce({ data: upload });
			await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
				[{ json: operation === 'updateUpdate' ? edit : upload }],
			]);
			expect(post).toHaveBeenCalledTimes(1);
			const [url, form, config] = post.mock.calls[0];
			expect(url).toBe('https://api.monday.com/v2/file');
			expect(config?.headers).toMatchObject({
				Authorization: `Bearer ${TEST_API_KEY}`,
				'API-Version': '2026-01',
			});
			expect(form).toBeInstanceOf(FormData);
			if (!(form instanceof FormData)) throw new Error('Expected multipart form');
			const multipart = form.getBuffer().toString();
			expect(multipart).toContain('add_file_to_update (update_id: 70, file: $file)');
			expect(multipart).toContain('filename="report.txt"');
			expect(multipart).toContain('report contents');
			expect(mock.context.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(0, 'report');
			if (operation === 'updateUpdate') {
				expect(requestedVariables(mock.request)).toEqual({
					body: '<p>Ready "now"</p>\nNext',
					updateId: '70',
				});
				expect(requestedQuery(mock.request)).toContain('mentions_list: [{id: 8, type: Team}]');
			} else expect(mock.request).not.toHaveBeenCalled();
		},
	);

	it.each([
		{ updateId: '', attachmentsUpdate: 'report' },
		{ updateId: '70', attachmentsUpdate: '' },
	])('rejects incomplete upload parameters: %j', async (fields) => {
		const mock = createMockContext({ params: { ...params, operation: 'uploadFile', ...fields } });
		await expect(node.execute.call(mock.asExecute())).rejects.toThrow(
			'Update ID and attachmentsUpdate',
		);
		expect(post).not.toHaveBeenCalled();
	});
});

describe('remaining upload operations', () => {
	it.each(['createUpdate', 'uploadItemFile'])(
		'%s uploads to the selected target',
		async (operation) => {
			const mock = createMockContext({
				params: {
					resource: operation === 'createUpdate' ? 'update' : 'item',
					operation,
					itemId: '51',
					bodyContent: 'Ready',
					attachmentsUpdate: 'missing,report',
					binaryPropertyName: 'missing,report',
					fileColumnId: 'files',
				},
				binary: {
					report: {
						buffer: Buffer.from('contents'),
						data: { data: '', mimeType: '', fileName: 'report.txt' },
					},
				},
			});
			const payload = { data: { create_update: { id: '70' } } };
			mock.request.mockResolvedValueOnce(jsonResponse(payload));
			const upload = { data: { add_file_to_column: { id: '80' } } };
			post.mockResolvedValueOnce({ data: upload });
			await expect(node.execute.call(mock.asExecute())).resolves.toEqual([
				[{ json: operation === 'createUpdate' ? payload : upload }],
			]);
			expect(post).toHaveBeenCalledTimes(1);
			const form = post.mock.calls[0][1];
			if (!(form instanceof FormData)) throw new Error('Expected multipart form');
			const body = form.getBuffer().toString();
			expect(body).toContain(
				operation === 'createUpdate'
					? 'add_file_to_update (update_id: 70'
					: 'add_file_to_column (file: $file, item_id: 51, column_id: "files")',
			);
			expect(body).toContain('Content-Type: application/octet-stream');
			expect(body).toContain('contents');
		},
	);
	it.each(['itemId', 'fileColumnId', 'binaryPropertyName'])(
		'uploadItemFile requires %s',
		async (key) => {
			const mock = createMockContext({
				params: {
					resource: 'item',
					operation: 'uploadItemFile',
					itemId: '51',
					fileColumnId: 'files',
					binaryPropertyName: 'data',
					[key]: '',
				},
			});
			await expect(node.execute.call(mock.asExecute())).rejects.toThrow('are required');
			expect(post).not.toHaveBeenCalled();
		},
	);
});
