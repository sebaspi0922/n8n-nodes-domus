/* eslint-disable @n8n/community-nodes/no-restricted-globals */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { request as createRequest } from '@playwright/test';
import { n8nBaseURL, owner, storageStatePath } from './helpers/env';

const baseURL = n8nBaseURL;

export default async function globalSetup(): Promise<void> {
	mkdirSync(dirname(storageStatePath), { recursive: true });

	const request = await createRequest.newContext({ baseURL });
	let lastStatus = 0;

	for (let attempt = 0; attempt < 8; attempt += 1) {
		const setup = await request.post('/rest/owner/setup', {
			data: {
				email: owner.email,
				firstName: owner.firstName,
				lastName: owner.lastName,
				password: owner.password,
			},
		});
		if (![200, 201, 204, 400, 409].includes(setup.status())) {
			throw new Error(`n8n owner setup failed with HTTP ${setup.status()}`);
		}

		const login = await request.post('/rest/login', {
			data: {
				email: owner.email,
				emailOrLdapLoginId: owner.email,
				password: owner.password,
			},
		});
		lastStatus = login.status();
		if (login.ok()) {
			await request.storageState({ path: storageStatePath });
			await request.dispose();
			return;
		}

		if (login.status() === 429) {
			await new Promise((resolve) => setTimeout(resolve, 3_000 * (attempt + 1)));
			continue;
		}

		throw new Error(`n8n login failed with HTTP ${login.status()}`);
	}

	await request.dispose();
	throw new Error(`n8n login was rate-limited (last HTTP ${lastStatus})`);
}
