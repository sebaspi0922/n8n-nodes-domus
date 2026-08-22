/* eslint-disable @n8n/community-nodes/no-restricted-globals */
import { defineConfig, devices } from '@playwright/test';
import { n8nBaseURL, storageStatePath } from './test/e2e/helpers/env';

const headed = process.env.PLAYWRIGHT_HEADED === '1';
const debugArtifacts = process.env.PLAYWRIGHT_DEBUG === '1';

export default defineConfig({
	testDir: './test/e2e',
	globalSetup: './test/e2e/global-setup.ts',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 90_000,
	expect: {
		timeout: 15_000,
	},
	forbidOnly: Boolean(process.env.CI),
	reporter: process.env.CI ? [['list'], ['github']] : [['list']],
	use: {
		baseURL: n8nBaseURL,
		storageState: storageStatePath,
		...devices['Desktop Chrome'],
		headless: !headed,
		trace: debugArtifacts ? 'retain-on-failure' : 'off',
		video: 'off',
		screenshot: debugArtifacts ? 'only-on-failure' : 'off',
		testIdAttribute: 'data-test-id',
		actionTimeout: 20_000,
		navigationTimeout: 20_000,
	},
	outputDir: 'test-results/e2e',
});
