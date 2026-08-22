/* eslint-disable @n8n/community-nodes/no-restricted-globals */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const loadLocalEnv = (fileName = '.env'): void => {
	const envPath = resolve(process.cwd(), fileName);
	if (!existsSync(envPath)) return;

	for (const rawLine of readFileSync(envPath, 'utf8').split('\n')) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		const separator = line.indexOf('=');
		if (separator === -1) continue;

		const key = line.slice(0, separator).trim();
		let value = line.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		if (key && process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
};

loadLocalEnv();

export const n8nBaseURL = process.env.N8N_BASE_URL || 'http://127.0.0.1:5680';
export const storageStatePath =
	process.env.N8N_E2E_STORAGE_STATE || 'test-results/.auth.json';

export const owner = {
	email: process.env.N8N_E2E_EMAIL || 'e2e@n8n-nodes-domus.local',
	password: process.env.N8N_E2E_PASSWORD || 'DomusE2ePass1!',
	firstName: process.env.N8N_E2E_FIRST_NAME || 'E2E',
	lastName: process.env.N8N_E2E_LAST_NAME || 'Domus',
};

export const domusToken = (process.env.DOMUS_TEST_TOKEN || '').trim();
export const hasDomusToken = domusToken.length > 0;
export const domusBaseURL = process.env.DOMUS_TEST_BASE_URL || 'https://newapi.domus.la';
export const configuredPropertyCode = (process.env.DOMUS_TEST_PROPERTY_CODE || '').trim();
