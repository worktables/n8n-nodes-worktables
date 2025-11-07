export async function parseValue(value: any) {
	if (!value) return null;

	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}
