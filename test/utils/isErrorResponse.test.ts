import { parseApiResponse } from '../../utils/isErrorResponse';

describe('parseApiResponse', () => {
	it('flags a successful response and echoes the raw payload', async () => {
		const raw = JSON.stringify({ data: { boards: [{ id: '1' }] } });
		await expect(parseApiResponse(raw)).resolves.toEqual({ success: true, data: raw });
	});

	it('flags a response that contains errors', async () => {
		const raw = JSON.stringify({
			errors: [{ message: 'Not found', extensions: { code: 'InvalidBoardIdException' } }],
		});
		await expect(parseApiResponse(raw)).resolves.toEqual({ success: false, data: raw });
	});

	it('logs complexity budget details when that error code is returned', async () => {
		const raw = JSON.stringify({
			errors: [
				{
					message: 'Complexity budget exhausted',
					extensions: {
						code: 'COMPLEXITY_BUDGET_EXHAUSTED',
						complexity: 5000,
						complexity_budget_left: 0,
						complexity_budget_limit: 10000,
						retry_in_seconds: 12,
					},
				},
			],
		});

		const result = await parseApiResponse(raw);

		expect(result.success).toBe(false);
		expect(console.log).toHaveBeenCalledWith(
			'Complexity budget exhausted:',
			expect.objectContaining({
				complexity: 5000,
				budgetLeft: 0,
				budgetLimit: 10000,
				retryInSeconds: 12,
			}),
		);
	});

	it('treats an errors key with a non-array value as an error', async () => {
		const raw = JSON.stringify({ errors: { message: 'boom' } });
		// .find is not available on a plain object, so this surfaces as a thrown error
		await expect(parseApiResponse(raw)).rejects.toThrow();
	});

	it('rejects when the response is not valid JSON', async () => {
		await expect(parseApiResponse('<html>Bad gateway</html>')).rejects.toThrow(SyntaxError);
	});
});
