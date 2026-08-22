const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { requestDomus } = require('../helpers/domus-http');
const { getDomusTestConfig } = require('../helpers/env');

const config = getDomusTestConfig();

const skipWithoutToken = !config.hasToken
	? 'Set DOMUS_TEST_TOKEN to run Domus contract tests against newapi.domus.la'
	: false;

const firstProperty = (payload) => {
	if (Array.isArray(payload?.data)) return payload.data[0];
	if (payload?.data && typeof payload.data === 'object') return payload.data;
	return undefined;
};

describe('Domus API contract (testing host)', { skip: skipWithoutToken }, () => {
	it('validates credentials with GET /general/countries', async () => {
		const response = await requestDomus('/general/countries');

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		assert.ok(response.data.data.length > 0);
		assert.ok(
			response.data.data.some(
				(item) => item && (item.code !== undefined || item.name !== undefined),
			),
		);
	});

	it('returns searchable cities used by the Property locators', async () => {
		const response = await requestDomus('/search/cities', {
			headers: { Inmobiliaria: '1' },
		});

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		if (response.data.data.length === 0) return;

		const city = response.data.data[0];
		assert.ok(city.code !== undefined);
		assert.equal(typeof city.name, 'string');
	});

	it('returns a paginated property search envelope', async () => {
		const response = await requestDomus('/properties', {
			headers: { Perpage: '1', Inmobiliaria: '1' },
			query: { page: 1 },
		});

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		assert.ok(response.data.current_page !== undefined);
		if (response.data.data.length === 0) return;

		const property = firstProperty(response.data);
		assert.ok(property.codpro !== undefined);
	});

	it('returns one property detail object for a discovered or configured code', async () => {
		const code = config.propertyCode;
		let propertyCode = code;

		if (!propertyCode) {
			const search = await requestDomus('/properties', {
				headers: { Perpage: '1', Inmobiliaria: '1' },
				query: { page: 1 },
			});
			propertyCode = firstProperty(search.data)?.codpro;
		}

		if (!propertyCode) {
			return;
		}

		const response = await requestDomus(`/properties/${propertyCode}`, {
			headers: { Inmobiliaria: '1' },
		});

		assert.equal(response.status, 200);
		const property = firstProperty(response.data) ?? response.data;
		assert.ok(property);
		assert.ok(property.codpro !== undefined);
	});
});
