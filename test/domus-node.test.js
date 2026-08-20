const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
	DOMUS_BASE_URL_EXPRESSION,
	DOMUS_PRODUCTION_BASE_URL,
	DOMUS_TEST_BASE_URL,
} = require('../dist/nodes/Domus/constants.js');
const { DomusApi } = require('../dist/credentials/DomusApi.credentials.js');
const { Domus } = require('../dist/nodes/Domus/Domus.node.js');

const getProperty = (properties, name) => properties.find((property) => property.name === name);

describe('Domus API credentials', () => {
	it('stores the token as a password and supports both environments', () => {
		const credentials = new DomusApi();
		const token = getProperty(credentials.properties, 'token');
		const environment = getProperty(credentials.properties, 'environment');

		assert.equal(token.required, true);
		assert.equal(token.typeOptions.password, true);
		assert.deepEqual(
			environment.options.map((option) => option.value),
			[DOMUS_TEST_BASE_URL, DOMUS_PRODUCTION_BASE_URL],
		);
	});

	it('sends the raw token only in the Authorization header', () => {
		const credentials = new DomusApi();

		assert.deepEqual(credentials.authenticate.properties, {
			headers: { Authorization: '={{$credentials.token}}' },
		});
		assert.doesNotMatch(credentials.authenticate.properties.headers.Authorization, /Bearer/i);
	});

	it('tests credentials using a small authenticated read request', () => {
		const credentials = new DomusApi();

		assert.equal(credentials.test.request.baseURL, DOMUS_BASE_URL_EXPRESSION);
		assert.equal(credentials.test.request.url, '/general/countries');
		assert.equal(credentials.test.request.method, 'GET');
	});
});

describe('Domus property search node', () => {
	it('uses the documented Domus API endpoints', () => {
		assert.equal(DOMUS_TEST_BASE_URL, 'https://newapi.domus.la');
		assert.equal(DOMUS_PRODUCTION_BASE_URL, 'https://api.domus.la/3.0');

		const node = new Domus();
		assert.equal(node.description.requestDefaults.baseURL, DOMUS_BASE_URL_EXPRESSION);
	});

	it('routes Inmueble → Buscar to GET /properties and emits each data item', () => {
		const node = new Domus();
		const resource = getProperty(node.description.properties, 'resource');
		const operation = getProperty(node.description.properties, 'operation');
		const search = operation.options.find((option) => option.value === 'search');

		assert.deepEqual(resource.options, [{ name: 'Inmueble', value: 'property' }]);
		assert.equal(search.routing.request.method, 'GET');
		assert.equal(search.routing.request.url, '/properties');
		assert.deepEqual(search.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
	});

	it('configures automatic pagination and a bounded result mode', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const returnAll = getProperty(properties, 'returnAll');
		const limit = getProperty(properties, 'limit');
		const perPage = getProperty(properties, 'perPage');
		const pagination = returnAll.routing.operations.pagination;
		const paginationQuery = pagination.properties.request.qs;

		assert.equal(returnAll.routing.send.paginate, '={{$value}}');
		assert.equal(pagination.type, 'generic');
		assert.match(pagination.properties.continue, /current_page/);
		assert.match(pagination.properties.continue, /last_page/);
		assert.match(paginationQuery.page, /current_page/);
		assert.match(paginationQuery.page, /\$request\.qs\?\.page/);
		assert.deepEqual(Object.keys(paginationQuery).sort(), [
			'biz',
			'city',
			'codpro',
			'keyword',
			'neighborhood',
			'neighborhood_code',
			'page',
			'reference',
			'stratum',
			'type',
		]);
		assert.deepEqual(limit.displayOptions.show.returnAll, [false]);
		assert.equal(limit.routing.request.headers.Perpage, '={{$value}}');
		assert.equal(limit.routing.output.maxResults, '={{$value}}');
		assert.deepEqual(perPage.displayOptions.show.returnAll, [true]);
		assert.equal(
			perPage.routing.request.headers.Perpage,
			'={{$value}}',
		);
	});

	it('maps Domus headers and initial filters correctly', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const filters = getProperty(properties, 'filters').options;

		assert.equal(getProperty(properties, 'page').routing.send.property, 'page');
		assert.equal(getProperty(properties, 'page').routing.send.type, 'query');
		assert.equal(
			getProperty(properties, 'entireAgency').routing.request.headers.Inmobiliaria,
			'={{ $value ? 1 : 0 }}',
		);
		assert.equal(
			getProperty(properties, 'includeSheet').routing.request.headers.Ficha,
			'={{ $value ? 1 : 0 }}',
		);

		assert.deepEqual(
			Object.fromEntries(filters.map((filter) => [filter.name, filter.routing.send.property])),
			{
				neighborhood: 'neighborhood',
				city: 'city',
				neighborhoodCode: 'neighborhood_code',
				propertyCode: 'codpro',
				stratum: 'stratum',
				businessType: 'biz',
				keyword: 'keyword',
				reference: 'reference',
				propertyType: 'type',
			},
		);
	});
});
