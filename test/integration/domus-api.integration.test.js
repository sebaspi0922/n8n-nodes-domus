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

const listRows = (payload) => {
	if (Array.isArray(payload?.data)) return payload.data;
	if (
		payload?.code === 200 &&
		payload.data === undefined &&
		typeof payload.message === 'string'
	) {
		return [];
	}
	return undefined;
};

const valueType = (value) => {
	if (Array.isArray(value)) return 'array';
	if (value === null) return 'null';
	return typeof value;
};

const messageCategory = (payload) => {
	const message = [payload?.message, payload?.error]
		.filter((value) => typeof value === 'string')
		.join(' ')
		.toLowerCase();
	if (!message) return undefined;
	if (/auth|permission|forbidden|unauthori[sz]ed/.test(message)) return 'authorization';
	if (/not found|no captures?|empty/.test(message)) return 'not-found-or-empty';
	if (/sql|database|query/.test(message)) return 'backend-data';
	if (/null|undefined|property|array|offset/.test(message)) return 'backend-exception';
	return 'other';
};

const responseSummary = (response) => {
	const payload = response.data;
	return {
		status: response.status,
		bodyType: valueType(payload),
		bodyKeys:
			payload && typeof payload === 'object' && !Array.isArray(payload)
				? Object.keys(payload).sort()
				: [],
		dataType: valueType(payload?.data),
		arrayLength: Array.isArray(payload)
			? payload.length
			: Array.isArray(payload?.data)
				? payload.data.length
				: undefined,
		code: typeof payload?.code === 'number' ? payload.code : undefined,
		messageCategory: messageCategory(payload),
	};
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

	it('returns typed neighborhoods as name rows without requiring a code', async (t) => {
		const response = await requestDomus('/search/digited-neighborhoods', {
			headers: { Inmobiliaria: '1' },
		});
		const rows = listRows(response.data);
		t.diagnostic(`typed-neighborhoods response: ${JSON.stringify(responseSummary(response))}`);

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		const neighborhood = rows[0];
		assert.equal(typeof neighborhood.name, 'string');
	});

	it('returns a paginated owner search envelope', async () => {
		const response = await requestDomus('/owners', {
			headers: { Perpage: '1', Inmobiliaria: '1' },
			query: { page: 1 },
		});

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		assert.ok(response.data.current_page !== undefined);
		if (response.data.data.length === 0) return;

		const owner = response.data.data[0];
		assert.ok(owner.code !== undefined);
		assert.ok(owner.document !== undefined);
	});

	it('returns one owner detail object for a discovered document', async () => {
		const search = await requestDomus('/owners', {
			headers: { Perpage: '1', Inmobiliaria: '1' },
			query: { page: 1 },
		});
		const document = search.data?.data?.[0]?.document;

		if (document === undefined) {
			return;
		}

		const response = await requestDomus(`/owners/${document}`, {
			headers: { Inmobiliaria: '1' },
		});

		assert.equal(response.status, 200);
		const owner = response.data?.data;
		assert.ok(owner);
		assert.ok(owner.code !== undefined);
	});

	it('returns the phone-type and document-type catalogs used by Owner writes', async () => {
		for (const path of ['/general/phone-types', '/administrative/document_types']) {
			const response = await requestDomus(path);

			assert.equal(response.status, 200);
			assert.ok(Array.isArray(response.data?.data), `${path} did not return a data array`);
			if (response.data.data.length === 0) continue;

			const row = response.data.data[0];
			assert.ok(row.code !== undefined);
			assert.equal(typeof row.name, 'string');
		}
	});

	it('returns advisors and branches used by the property locators', async () => {
		const brokers = await requestDomus('/administrative/brokers', {
			headers: { Inmobiliaria: '1' },
		});
		assert.equal(brokers.status, 200);
		assert.ok(Array.isArray(brokers.data?.data));

		const branches = await requestDomus('/administrative/branches');
		assert.equal(branches.status, 200);
		assert.ok(Array.isArray(branches.data?.data));
	});

	it('returns a paginated Domus V2 project envelope', async () => {
		const response = await requestDomus('/projects-v2', {
			headers: { Perpage: '1' },
			query: { page: 1 },
		});

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data?.data));
		assert.ok(response.data.current_page !== undefined);
		if (response.data.data.length === 0) return;

		const project = response.data.data[0];
		assert.ok(project.unique_code !== undefined);
		assert.equal(typeof project.name, 'string');
	});

	it('returns one Domus V2 project detail for a discovered code', async () => {
		const search = await requestDomus('/projects-v2', {
			headers: { Perpage: '1' },
			query: { page: 1 },
		});
		const project = search.data?.data?.[0];

		if (!project) {
			return;
		}

		const response = await requestDomus(`/projects-v2/${project.code ?? 0}`, {
			query: { unique_code: project.unique_code },
		});

		assert.equal(response.status, 200);
		assert.ok(response.data?.data);
		assert.ok(response.data.data.unique_code !== undefined);
	});

	it('returns a paginated Domus V2 acquisition envelope', async (t) => {
		const response = await requestDomus('/captures-v2', {
			headers: { Perpage: '1' },
			query: { page: 1 },
		});

		if (response.status !== 200) {
			const probes = await Promise.all([
				requestDomus('/captures-v2', { headers: { Perpage: '1' } }),
				requestDomus('/captures-v2', {
					headers: { Perpage: '1', Inmobiliaria: '1' },
					query: { page: 1 },
				}),
				requestDomus('/captures-v2', {
					headers: { Perpage: '1', Inmobiliaria: '0' },
					query: { page: 1 },
				}),
			]);
			t.diagnostic(
				`captures-v2 diagnostic: ${JSON.stringify({
					documented: responseSummary(response),
					withoutPage: responseSummary(probes[0]),
					wholeAgency: responseSummary(probes[1]),
					branchOnly: responseSummary(probes[2]),
				})}`,
			);
		}

		assert.equal(
			response.status,
			200,
			`documented /captures-v2 request failed: ${JSON.stringify(responseSummary(response))}`,
		);
		assert.ok(Array.isArray(response.data?.data));
		assert.ok(response.data.current_page !== undefined);
		if (response.data.data.length === 0) return;

		const acquisition = response.data.data[0];
		assert.ok(acquisition.unique_code !== undefined);
		assert.ok(acquisition.property_code !== undefined);
	});

	it('returns one Domus V2 acquisition detail for a discovered code', async (t) => {
		const search = await requestDomus('/captures-v2', {
			headers: { Perpage: '1' },
			query: { page: 1 },
		});
		if (search.status !== 200) {
			const summary = JSON.stringify(responseSummary(search));
			t.skip(`blocked because acquisition discovery is outside contract: ${summary}`);
			return;
		}
		const acquisition = search.data?.data?.[0];

		if (!acquisition) {
			return;
		}

		const response = await requestDomus(`/captures-v2/${acquisition.code ?? 0}`, {
			query: { unique_code: acquisition.unique_code },
		});

		assert.equal(response.status, 200);
		assert.ok(response.data?.data);
		assert.ok(response.data.data.unique_code !== undefined);
	});

	it('returns a bare portal-publication array for a discovered property', async () => {
		const search = await requestDomus('/properties', {
			headers: { Perpage: '1', Inmobiliaria: '1' },
			query: { page: 1 },
		});
		const property = firstProperty(search.data);

		if (property?.idpro === undefined) {
			return;
		}

		const response = await requestDomus(`/properties/portals/${property.idpro}`, {
			headers: { Inmobiliaria: '1' },
		});

		assert.equal(response.status, 200);
		assert.ok(Array.isArray(response.data));
		if (response.data.length === 0) return;

		const publication = response.data[0];
		assert.ok(publication.property_id !== undefined);
		assert.ok(publication.portal_name !== undefined);
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
