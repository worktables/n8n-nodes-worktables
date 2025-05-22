export async function parseApiResponse(response: any) {
	console.log('Response:', JSON.stringify(response, null, 2));
	if (JSON.parse(response).errors) {
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
