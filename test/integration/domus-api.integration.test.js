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

	it('returns the full property status catalog used by Change Status', async () => {
		const response = await requestDomus('/general/status');

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		if (response.data.data.length === 0) return;

		const status = response.data.data[0];
		assert.ok(status.code !== undefined);
		assert.equal(typeof status.name, 'string');
	});

	it('returns status-change sources used by the Change Status locator', async () => {
		const response = await requestDomus('/administrative/sources');

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		if (response.data.data.length === 0) return;

		const source = response.data.data[0];
		assert.ok(source.code !== undefined);
		assert.equal(typeof source.name, 'string');
	});

	it('returns the amenities catalog used by Search filters', async () => {
		const response = await requestDomus('/general/amenities');

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		if (response.data.data.length === 0) return;

		const amenity = response.data.data[0];
		assert.ok(amenity.code !== undefined);
		assert.equal(typeof amenity.name, 'string');
	});

	it('returns city zones used by the Search city-zone locator', async () => {
		const response = await requestDomus('/general/city-zones');

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		if (response.data.data.length === 0) return;

		const zone = response.data.data[0];
		assert.ok(zone.code !== undefined);
		assert.equal(typeof zone.name, 'string');
	});

	it('returns the full city catalog used by Create and Update', async () => {
		const response = await requestDomus('/general/cities');

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		if (response.data.data.length === 0) return;

		const city = response.data.data[0];
		assert.ok(city.code !== undefined);
		assert.equal(typeof city.name, 'string');
	});

	it('returns full business-type and property-type catalogs', async () => {
		for (const path of ['/general/biz', '/general/types', '/general/zones']) {
			const response = await requestDomus(path);
			assert.equal(response.status, 200);
			assert.ok(Array.isArray(response.data?.data));
			if (response.data.data.length === 0) continue;

			const row = response.data.data[0];
			assert.ok(row.code !== undefined);
			assert.equal(typeof row.name, 'string');
		}
	});

	it('returns catalog neighborhoods that can be scoped by city', async () => {
		const response = await requestDomus('/general/neighborhoods', {
			query: { city: 11001 },
		});

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		if (response.data.data.length === 0) return;

		const neighborhood = response.data.data[0];
		assert.ok(neighborhood.code !== undefined);
		assert.equal(typeof neighborhood.name, 'string');
	});

	it('returns typed neighborhoods as name rows without requiring a code', async () => {
		const response = await requestDomus('/search/digited-neighborhoods', {
			headers: { Inmobiliaria: '1' },
		});

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		if (response.data.data.length === 0) return;

		const neighborhood = response.data.data[0];
		assert.equal(typeof neighborhood.name, 'string');
	});

	it('returns a nested status-history envelope for a discovered property', async () => {
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

		const response = await requestDomus(`/properties/status/${propertyCode}`, {
			headers: { Perpage: '1' },
			query: { page: 1 },
		});

		assert.equal(response.status, 200);
		const envelope = response.data?.data;
		assert.ok(envelope);
		assert.ok(envelope.current_page !== undefined || Array.isArray(envelope));
		if (Array.isArray(envelope?.data) && envelope.data.length > 0) {
			assert.ok(envelope.data[0].status !== undefined || envelope.data[0].code !== undefined);
		}
	});
});
