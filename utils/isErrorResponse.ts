/**
 * Parse API response and check for errors
 * API 2025-04+: Updated to handle new error formats including complexity budget errors
 */
export async function parseApiResponse(response: any) {
	console.log('Response:', JSON.stringify(response, null, 2));
	const parsed = JSON.parse(response);
	
	if (parsed.errors) {
		// API 2025-04+: Check for complexity budget exhausted error with new format
		const complexityError = parsed.errors.find(
			(err: any) => err.extensions?.code === 'COMPLEXITY_BUDGET_EXHAUSTED'
		);
		
		if (complexityError) {
			console.log('Complexity budget exhausted:', {
				complexity: complexityError.extensions?.complexity,
				budgetLeft: complexityError.extensions?.complexity_budget_left,
				budgetLimit: complexityError.extensions?.complexity_budget_limit,
				retryInSeconds: complexityError.extensions?.retry_in_seconds,
			});
		}
		
		return {
			success: false,
			data: response,
		};
	}

	return {
		success: true,
		data: response,
	};
}
