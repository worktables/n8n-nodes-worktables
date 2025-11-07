/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	root: true,

	env: {
		browser: true,
		es6: true,
		node: true,
	},

	parser: '@typescript-eslint/parser',

	parserOptions: {
		project: ['./tsconfig.json'],
		sourceType: 'module',
		extraFileExtensions: ['.json'],
	},

	ignorePatterns: ['.eslintrc.js', '**/*.js', '**/node_modules/**', '**/dist/**'],

	overrides: [
		{
			files: ['package.json'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/community'],
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'off',
				'n8n-nodes-base/node-param-required-false': 'off',
			},
		},
		{
			files: ['./credentials/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			rules: {
				'n8n-nodes-base/cred-class-field-documentation-url-missing': 'off',
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
				'n8n-nodes-base/node-param-required-false': 'off',
				'n8n-nodes-base/node-param-min-value-wrong-for-limit': 'off',
			},
		},
		{
			files: ['./nodes/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/nodes'],
			rules: {
				'n8n-nodes-base/node-execute-block-missing-continue-on-fail': 'off',
				'n8n-nodes-base/node-resource-description-filename-against-convention': 'off',
				'n8n-nodes-base/node-param-fixed-collection-type-unsorted-items': 'off',
				'n8n-nodes-base/node-dirname-against-convention': 'off',
				'n8n-nodes-base/node-param-color-type-unused': 'off',
				'n8n-nodes-base/node-param-display-name-miscased': 'off',
				'n8n-nodes-base/node-param-description-comma-separated-hyphen': 'off',
				'n8n-nodes-base/node-param-description-missing-from-dynamic-options': 'off',
				'n8n-nodes-base/node-param-description-missing-from-dynamic-multi-options': 'off',
				'n8n-nodes-base/node-param-description-boolean-without-whether': 'off',
				'n8n-nodes-base/node-param-required-false': 'off',
				'n8n-nodes-base/node-param-min-value-wrong-for-limit': 'off',
			},
		},
		{
			files: ['./credentials/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			rules: {
				'n8n-nodes-base/cred-class-field-documentation-url-missing': 'off',
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
				'n8n-nodes-base/cred-class-name-unsuffixed': 'off',
				'n8n-nodes-base/cred-class-field-name-uppercase-first-char': 'off',
				'n8n-nodes-base/cred-class-field-type-options-password-missing': 'off',
				'n8n-nodes-base/node-param-color-type-unused': 'off',
				'n8n-nodes-base/node-param-display-name-miscased': 'off',
				'n8n-nodes-base/node-param-description-comma-separated-hyphen': 'off',
				'n8n-nodes-base/node-param-required-false': 'off',
				'n8n-nodes-base/node-param-min-value-wrong-for-limit': 'off',
			},
		},
	],
};
