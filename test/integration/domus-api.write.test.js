const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { requestDomus } = require('../helpers/domus-http');
const { assertOfficialWriteHost, getDomusTestConfig } = require('../helpers/env');

const config = getDomusTestConfig();

if (config.writeEnabled) {
	assertOfficialWriteHost(config.baseURL);
}

const skipWithoutWrite =
	!config.hasToken
		? 'Set DOMUS_TEST_TOKEN to run Domus write tests against newapi.domus.la'
		: !config.writeEnabled
			? 'Set DOMUS_TEST_WRITE=1 on a manual run to execute the testing-host write cycle'
			: false;

describe('Domus API write cycle (manual opt-in)', { skip: skipWithoutWrite }, () => {
	it('creates, reads, and updates a testing property when explicitly enabled', async () => {
		assertOfficialWriteHost(config.baseURL);

		const stamp = Date.now();
		const description = `n8n-e2e contract ${stamp}`;
		const create = await requestDomus('/properties', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				description,
				reference: `n8n-e2e-${stamp}`,
			}).toString(),
		});

		assert.ok(create.status < 500, `Create failed with HTTP ${create.status}`);
		if (!create.ok) {
			return;
		}

		const createdCode = create.data?.property?.codpro;
		assert.ok(createdCode);

		const detail = await requestDomus(`/properties/${createdCode}`, {
			headers: { Inmobiliaria: '1' },
		});
		assert.equal(detail.status, 200);

		const updatedDescription = `${description} updated`;
		const update = await requestDomus(`/properties/${createdCode}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				description: updatedDescription,
			}).toString(),
		});
		assert.ok(update.ok, `Update failed with HTTP ${update.status}`);
	});
});
