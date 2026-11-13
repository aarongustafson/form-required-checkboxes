import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './test/browser',
	workers: 1,
	use: { baseURL: 'http://checkboxes.test' },
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
	],
	webServer: {
		command: 'node scripts/serve.js',
		url: 'http://127.0.0.1:4190/demo/index.html',
		reuseExistingServer: false,
	},
});
