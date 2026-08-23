const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
	DOMUS_BASE_URL_EXPRESSION,
	DOMUS_PRODUCTION_BASE_URL,
	DOMUS_TEST_BASE_URL,
} = require('../dist/nodes/Domus/constants.js');
const { DomusApi } = require('../dist/credentials/DomusApi.credentials.js');
const { Domus } = require('../dist/nodes/Domus/Domus.node.js');
const {
	searchBusinessTypes,
	searchCities,
	searchNeighborhoods,
	searchPropertyTypes,
	searchSources,
	searchStatuses,
	searchZones,
} = require('../dist/nodes/Domus/methods/listSearch.js');
const {
	splitNestedStatusHistory,
} = require('../dist/nodes/Domus/resources/property/statusHistory.helpers.js');

const getProperty = (properties, name) => properties.find((property) => property.name === name);

const createListSearchContext = ({ data, entireAgency = true, filters = {} }) => {
	const requests = [];
	const context = {
		getCredentials: async () => ({ environment: DOMUS_PRODUCTION_BASE_URL }),
		getCurrentNodeParameter: (name) => (name === 'entireAgency' ? entireAgency : undefined),
		getCurrentNodeParameters: () => ({ filters }),
		helpers: {
			httpRequestWithAuthentication: async (credentialName, options) => {
				requests.push({ credentialName, options });
				return { data };
			},
		},
	};

	return { context, requests };
};

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
		assert.equal(environment.displayName, 'Environment');
		assert.deepEqual(
			environment.options.map((option) => option.name),
			['Testing', 'Production'],
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

		assert.deepEqual(resource.options, [{ name: 'Property', value: 'property' }]);
		assert.deepEqual(
			operation.options.map((option) => option.name),
			['Search', 'Get', 'Get Status History', 'Change Status'],
		);
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
			'zone',
		]);
		assert.deepEqual(limit.displayOptions.show.returnAll, [false]);
		assert.equal(limit.routing.request.headers.Perpage, '={{$value}}');
		assert.equal(limit.routing.output.maxResults, '={{$value}}');
		assert.deepEqual(perPage.displayOptions.show.returnAll, [true]);
		assert.equal(perPage.routing.request.headers.Perpage, '={{$value}}');
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
				zone: 'zone',
			},
		);
	});

	it('exposes searchable dynamic filters with a manual-code fallback', () => {
		const node = new Domus();
		const filters = getProperty(node.description.properties, 'filters').options;
		const expectedMethods = {
			businessType: 'searchBusinessTypes',
			city: 'searchCities',
			neighborhoodCode: 'searchNeighborhoods',
			propertyType: 'searchPropertyTypes',
			zone: 'searchZones',
		};

		for (const [filterName, methodName] of Object.entries(expectedMethods)) {
			const filter = getProperty(filters, filterName);
			assert.equal(filter.type, 'resourceLocator');
			assert.equal(filter.modes[0].typeOptions.searchListMethod, methodName);
			assert.equal(filter.modes[0].typeOptions.searchable, true);
			assert.equal(filter.modes[1].name, 'id');
			assert.equal(typeof node.methods.listSearch[methodName], 'function');
		}
	});

	it('loads, filters, and sorts cities through authenticated Domus requests', async () => {
		const { context, requests } = createListSearchContext({
			data: [
				{ code: 11001, name: 'Bogotá', state_name: 'Bogotá' },
				{ code: 76001, name: 'Cali', state_name: 'Valle del Cauca' },
				{ code: 76001, name: 'Cali duplicada' },
				{ invalid: true },
			],
		});

		const result = await searchCities.call(context, 'cali');

		assert.deepEqual(result, {
			results: [{ name: 'Cali — Valle del Cauca', value: '76001' }],
		});
		assert.equal(requests.length, 1);
		assert.equal(requests[0].credentialName, 'domusApi');
		assert.equal(requests[0].options.baseURL, DOMUS_PRODUCTION_BASE_URL);
		assert.equal(requests[0].options.url, '/search/cities');
		assert.equal(requests[0].options.headers.Inmobiliaria, 1);
		assert.equal(requests[0].options.headers.Authorization, undefined);
	});

	it('uses the documented Domus search endpoint for every dynamic filter', async () => {
		const methods = [
			[searchBusinessTypes, '/search/biz'],
			[searchPropertyTypes, '/search/types'],
			[searchZones, '/search/zones'],
		];

		for (const [method, endpoint] of methods) {
			const { context, requests } = createListSearchContext({ data: [] });
			await method.call(context);
			assert.equal(requests[0].options.url, endpoint);
		}
	});

	it('scopes neighborhood options to the selected city', async () => {
		const { context, requests } = createListSearchContext({
			data: [{ code: 4174, name: 'Urbanización Colseguros', city_name: 'Cali' }],
			filters: { city: { mode: 'list', value: '76001' } },
		});

		const result = await searchNeighborhoods.call(context, 'colseguros');

		assert.deepEqual(result, {
			results: [{ name: 'Urbanización Colseguros — Cali', value: '4174' }],
		});
		assert.deepEqual(requests[0].options.qs, { city: '76001' });
		assert.equal(requests[0].options.url, '/search/neighborhoods');
	});
});

describe('Domus property get operation', () => {
	it('registers Inmueble → Obtener with the documented detail endpoint', () => {
		const node = new Domus();
		const operation = getProperty(node.description.properties, 'operation');
		const get = operation.options.find((option) => option.value === 'get');

		assert.equal(get.routing.request.method, 'GET');
		assert.equal(
			get.routing.request.url,
			'=/properties/{{$parameter.propertyCode}}{{$parameter.propertyId ? "/" + $parameter.propertyId : ""}}',
		);
		assert.deepEqual(get.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
	});

	it('requires codpro and supports the optional idpro path segment', () => {
		const node = new Domus();
		const propertyCode = getProperty(node.description.properties, 'propertyCode');
		const propertyId = getProperty(node.description.properties, 'propertyId');

		assert.equal(propertyCode.required, true);
		assert.equal(propertyCode.default, '');
		assert.deepEqual(propertyCode.displayOptions.show.operation, [
			'get',
			'changeStatus',
			'getStatusHistory',
		]);
		assert.equal(propertyId.required, undefined);
		assert.equal(propertyId.default, '');
		assert.deepEqual(propertyId.displayOptions.show.operation, ['get']);
	});

	it('reuses Domus authentication and maps every documented detail header', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const getOptions = getProperty(properties, 'getOptions').options;

		assert.deepEqual(node.description.credentials, [{ name: 'domusApi', required: true }]);
		assert.equal(
			getProperty(properties, 'getEntireAgency').routing.request.headers.Inmobiliaria,
			'={{ $value ? 1 : 0 }}',
		);
		assert.equal(
			getProperty(properties, 'getIncludeSheet').routing.request.headers.Ficha,
			'={{ $value ? 1 : 0 }}',
		);
		assert.equal(
			getProperty(getOptions, 'includeOwner').routing.request.headers.Propietario,
			'={{ $value ? 1 : 0 }}',
		);
		assert.equal(getProperty(getOptions, 'mapZoom').routing.request.headers.Mapa, '={{$value}}');
	});

	it('lets n8n propagate authentication, not-found, HTTP, and network errors', () => {
		const node = new Domus();
		const operation = getProperty(node.description.properties, 'operation');
		const get = operation.options.find((option) => option.value === 'get');

		assert.equal(node.description.requestDefaults.ignoreHttpStatusErrors, undefined);
		assert.equal(get.routing.request.ignoreHttpStatusErrors, undefined);
		assert.equal(get.routing.request.returnFullResponse, undefined);
	});
});

describe('Domus property status history operation', () => {
	it('registers GET /properties/status/{codpro} and splits nested history rows', () => {
		const node = new Domus();
		const operation = getProperty(node.description.properties, 'operation');
		const getStatusHistory = operation.options.find(
			(option) => option.value === 'getStatusHistory',
		);

		assert.equal(getStatusHistory.routing.request.method, 'GET');
		assert.equal(
			getStatusHistory.routing.request.url,
			'=/properties/status/{{$parameter.propertyCode}}',
		);
		assert.equal(getStatusHistory.routing.output.postReceive[0], splitNestedStatusHistory);
	});

	it('paginates through the nested Domus history envelope', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const returnAll = getProperty(properties, 'historyReturnAll');
		const pagination = returnAll.routing.operations.pagination;

		assert.equal(returnAll.routing.send.paginate, '={{$value}}');
		assert.match(pagination.properties.continue, /data\?\.current_page/);
		assert.match(pagination.properties.continue, /data\?\.last_page/);
		assert.equal(
			getProperty(properties, 'historyLimit').routing.request.headers.Perpage,
			'={{$value}}',
		);
		assert.equal(getProperty(properties, 'historyPage').routing.send.property, 'page');
	});

	it('turns nested history payloads into one n8n item per change', async () => {
		const items = await splitNestedStatusHistory.call(
			{},
			[],
			{
				body: {
					code: 200,
					data: {
						current_page: 1,
						last_page: 1,
						data: [
							{ code: 1, description: 'API - vendido' },
							{ code: 2, description: 'Disponible' },
						],
					},
				},
			},
		);

		assert.deepEqual(
			items.map((item) => item.json),
			[
				{ code: 1, description: 'API - vendido' },
				{ code: 2, description: 'Disponible' },
			],
		);
	});
});

describe('Domus property change status operation', () => {
	it('registers PUT /properties/status/{codpro} as form-urlencoded', () => {
		const node = new Domus();
		const operation = getProperty(node.description.properties, 'operation');
		const changeStatus = operation.options.find((option) => option.value === 'changeStatus');

		assert.equal(changeStatus.routing.request.method, 'PUT');
		assert.equal(
			changeStatus.routing.request.url,
			'=/properties/status/{{$parameter.propertyCode}}',
		);
		assert.equal(
			changeStatus.routing.request.headers['Content-Type'],
			'application/x-www-form-urlencoded',
		);
		assert.deepEqual(changeStatus.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'property' } },
		]);
	});

	it('requires status and maps optional form fields to the documented body keys', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const status = getProperty(properties, 'status');
		const extraFields = getProperty(properties, 'changeStatusFields').options;

		assert.equal(status.required, true);
		assert.equal(status.type, 'resourceLocator');
		assert.equal(status.modes[0].typeOptions.searchListMethod, 'searchStatuses');
		assert.equal(status.routing.send.type, 'body');
		assert.equal(status.routing.send.property, 'status');
		assert.deepEqual(
			Object.fromEntries(
				extraFields.map((field) => [field.name, field.routing.send.property]),
			),
			{
				broker: 'broker',
				changeDate: 'change_date',
				description: 'description',
				value: 'value',
				realState: 'real_state',
				source: 'source',
			},
		);
		assert.equal(getProperty(extraFields, 'source').modes[0].typeOptions.searchListMethod, 'searchSources');
	});

	it('loads statuses and sources from the full catalogs, not inventory search', async () => {
		const { context: statusContext, requests: statusRequests } = createListSearchContext({
			data: [
				{ code: 1, name: 'Disponible' },
				{ code: 3, name: 'Vendido' },
			],
		});
		const statuses = await searchStatuses.call(statusContext, 'vend');
		assert.deepEqual(statuses, { results: [{ name: 'Vendido', value: '3' }] });
		assert.equal(statusRequests[0].options.url, '/general/status');
		assert.equal(statusRequests[0].options.headers.Inmobiliaria, undefined);

		const { context: sourceContext, requests: sourceRequests } = createListSearchContext({
			data: [{ code: 57, name: 'Cliente-Propietario' }],
		});
		const sources = await searchSources.call(sourceContext);
		assert.deepEqual(sources, {
			results: [{ name: 'Cliente-Propietario', value: '57' }],
		});
		assert.equal(sourceRequests[0].options.url, '/administrative/sources');
		assert.equal(sourceRequests[0].options.headers.Inmobiliaria, undefined);
	});
});
