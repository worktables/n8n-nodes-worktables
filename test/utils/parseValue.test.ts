import { parseValue } from '../../utils/parseValue';

describe('parseValue', () => {
	it('returns null for falsy input', async () => {
		await expect(parseValue(null)).resolves.toBeNull();
		await expect(parseValue(undefined)).resolves.toBeNull();
		await expect(parseValue('')).resolves.toBeNull();
		await expect(parseValue(0)).resolves.toBeNull();
		await expect(parseValue(false)).resolves.toBeNull();
	});

	it('parses a JSON object string', async () => {
		await expect(parseValue('{"index":1,"label":"Done"}')).resolves.toEqual({
			index: 1,
			label: 'Done',
		});
	});

	it('parses a JSON array string', async () => {
		await expect(parseValue('[1,2,3]')).resolves.toEqual([1, 2, 3]);
	});

	it('parses JSON scalars', async () => {
		await expect(parseValue('42')).resolves.toBe(42);
		await expect(parseValue('true')).resolves.toBe(true);
		await expect(parseValue('"quoted"')).resolves.toBe('quoted');
	});

	it('returns the original string when it is not valid JSON', async () => {
		await expect(parseValue('hello world')).resolves.toBe('hello world');
		await expect(parseValue('{not json')).resolves.toBe('{not json');
	});

	it('passes through already parsed objects', async () => {
		const obj = { a: 1 };
		// JSON.parse throws on non-strings, so the catch branch returns the input as-is
		await expect(parseValue(obj)).resolves.toBe(obj);
	});
});
