// The nodes log heavily with console.log / console.error. Silence them so test
// output stays readable. Individual tests can still assert on the spies.
beforeEach(() => {
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
	jest.restoreAllMocks();
});
