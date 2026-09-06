const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { getNodeParameters } = require('n8n-workflow');

const {
	DOMUS_BASE_URL_EXPRESSION,
	DOMUS_PRODUCTION_BASE_URL,
	DOMUS_TEST_BASE_URL,
} = require('../dist/nodes/Domus/constants.js');
const { DomusApi } = require('../dist/credentials/DomusApi.credentials.js');
const { Domus } = require('../dist/nodes/Domus/Domus.node.js');
const {
	searchAmenities,
	searchBranches,
	searchBrokers,
	searchBusinessTypes,
	searchDocumentTypes,
	searchPhoneTypes,
	searchCatalogBusinessTypes,
	searchCatalogCities,
	searchCatalogNeighborhoods,
	searchCatalogPropertyTypes,
	searchCatalogZones,
	searchCities,
	searchCityZones,
	searchCountries,
	searchNeighborhoods,
	searchPropertyTypes,
	searchSources,
	searchStatuses,
	searchTypedNeighborhoods,
	searchZones,
} = require('../dist/nodes/Domus/methods/listSearch.js');
const {
	splitNestedStatusHistory,
} = require('../dist/nodes/Domus/resources/property/statusHistory.helpers.js');
const {
	serializeOwnerPhones,
} = require('../dist/nodes/Domus/resources/owner/phones.helpers.js');

const getProperty = (properties, name) => properties.find((property) => property.name === name);

const getResourceProperty = (properties, resource, name) =>
	properties.find(
		(property) =>
			property.name === name &&
			property.displayOptions?.show?.resource?.includes(resource),
	);

const createListSearchContext = ({
	data,
	response,
	entireAgency = true,
	filters = {},
	parameters = {},
}) => {
	const requests = [];
	const context = {
		getCredentials: async () => ({ environment: DOMUS_PRODUCTION_BASE_URL }),
		getCurrentNodeParameter: (name) => {
			if (name === 'entireAgency') return entireAgency;
			if (name in parameters) return parameters[name];
			if (name in filters) return filters[name];
			return undefined;
		},
		getCurrentNodeParameters: () => ({ filters, ...parameters }),
		helpers: {
			httpRequestWithAuthentication: async (credentialName, options) => {
				requests.push({ credentialName, options });
				return response ?? { data };
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

		assert.equal(resource.default, 'property');
		assert.deepEqual(
			operation.options.map((option) => option.name),
			[
				'Search',
				'Get',
				'Create',
				'Update',
				'Get Status History',
				'Get Portal Publications',
				'Retry Portal Publication',
				'Change Status',
			],
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
			'amenities',
			'amenitiesin',
			'biz',
			'branch',
			'broker',
			'city',
			'city_zone',
			'codpro',
			'keyword',
			'maxarea',
			'maxbath',
			'maxbed',
			'minarea',
			'minbath',
			'minbed',
			'multiple_codpro',
			'neighborhood',
			'neighborhood_code',
			'nostatus',
			'order',
			'page',
			'pcmax',
			'pcmin',
			'pvmax',
			'pvmin',
			'reference',
			'sort',
			'status',
			'stratum',
			'type',
			'update',
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
				amenities: 'amenities',
				amenitiesIn: 'amenitiesin',
				anyStatus: 'nostatus',
				branch: 'branch',
				broker: 'broker',
				businessType: 'biz',
				city: 'city',
				cityZone: 'city_zone',
				keyword: 'keyword',
				maxBathrooms: 'maxbath',
				maxBedrooms: 'maxbed',
				maxBuiltArea: 'maxarea',
				maxRent: 'pcmax',
				maxSalePrice: 'pvmax',
				minBathrooms: 'minbath',
				minBedrooms: 'minbed',
				minBuiltArea: 'minarea',
				minRent: 'pcmin',
				minSalePrice: 'pvmin',
				multiplePropertyCodes: 'multiple_codpro',
				neighborhood: 'neighborhood',
				neighborhoodCode: 'neighborhood_code',
				order: 'order',
				propertyCode: 'codpro',
				propertyType: 'type',
				reference: 'reference',
				sort: 'sort',
				status: 'status',
				stratum: 'stratum',
				updatedSince: 'update',
				zone: 'zone',
			},
		);
		assert.equal(
			getProperty(filters, 'anyStatus').routing.send.value,
			'={{ $value ? 0 : undefined }}',
		);
	});

	it('exposes searchable dynamic filters with a manual-code fallback', () => {
		const node = new Domus();
		const filters = getProperty(node.description.properties, 'filters').options;
		const expectedMethods = {
			amenities: 'searchAmenities',
			amenitiesIn: 'searchAmenities',
			businessType: 'searchBusinessTypes',
			city: 'searchCities',
			cityZone: 'searchCityZones',
			neighborhoodCode: 'searchNeighborhoods',
			propertyType: 'searchPropertyTypes',
			status: 'searchStatuses',
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

	it('loads amenities from the full catalog and scopes them by property type', async () => {
		const { context, requests } = createListSearchContext({
			data: [
				{ code: 1, name: 'Aire Acondicionado', type: 1 },
				{ code: 24, name: 'Piscina', type: 1 },
			],
			filters: { propertyType: { mode: 'list', value: '1' } },
		});

		const result = await searchAmenities.call(context, 'pis');

		assert.deepEqual(result, { results: [{ name: 'Piscina', value: '24' }] });
		assert.equal(requests[0].options.url, '/general/amenities');
		assert.equal(requests[0].options.headers.Inmobiliaria, undefined);
		assert.deepEqual(requests[0].options.qs, { type: '1' });
	});

	it('loads city zones from the full catalog and scopes them by city', async () => {
		const { context, requests } = createListSearchContext({
			data: [{ code: 1, name: 'ZONA NORTE', city_code: 11001, city_name: 'Bogotá' }],
			filters: { city: { mode: 'list', value: '11001' } },
		});

		const result = await searchCityZones.call(context, 'norte');

		assert.deepEqual(result, {
			results: [{ name: 'ZONA NORTE — Bogotá', value: '1' }],
		});
		assert.equal(requests[0].options.url, '/general/city-zones');
		assert.equal(requests[0].options.headers.Inmobiliaria, undefined);
		assert.deepEqual(requests[0].options.qs, { city: '11001' });
	});

	it('loads full catalogs for create and update locators', async () => {
		const methods = [
			[searchCatalogCities, '/general/cities'],
			[searchCatalogPropertyTypes, '/general/types'],
			[searchCatalogBusinessTypes, '/general/biz'],
			[searchCatalogZones, '/general/zones'],
		];

		for (const [method, endpoint] of methods) {
			const { context, requests } = createListSearchContext({ data: [] });
			await method.call(context);
			assert.equal(requests[0].options.url, endpoint);
			assert.equal(requests[0].options.headers.Inmobiliaria, undefined);
		}
	});

	it('scopes catalog neighborhoods by city and forwards the typed name', async () => {
		const { context, requests } = createListSearchContext({
			data: [{ code: 4751, name: 'Colina', city_name: 'Bogotá' }],
			parameters: { city: { mode: 'list', value: '11001' } },
		});

		const result = await searchCatalogNeighborhoods.call(context, 'colina');

		assert.deepEqual(result, {
			results: [{ name: 'Colina — Bogotá', value: '4751' }],
		});
		assert.equal(requests[0].options.url, '/general/neighborhoods');
		assert.deepEqual(requests[0].options.qs, { city: '11001', name: 'colina' });
		assert.equal(requests[0].options.headers.Inmobiliaria, undefined);
	});

	it('uses typed-neighborhood names as values because Domus omits codes', async () => {
		const { context, requests } = createListSearchContext({
			data: [{ name: 'Barrio de prueba', city_code: 11001, city_name: 'Bogotá' }],
			filters: { city: { mode: 'list', value: '11001' } },
		});

		const result = await searchTypedNeighborhoods.call(context, 'prueba');

		assert.deepEqual(result, {
			results: [{ name: 'Barrio de prueba — Bogotá', value: 'Barrio de prueba' }],
		});
		assert.equal(requests[0].options.url, '/search/digited-neighborhoods');
		assert.equal(requests[0].options.headers.Inmobiliaria, 1);
		assert.deepEqual(requests[0].options.qs, { city: '11001' });
	});

	it('returns no typed-neighborhood options for the testing host no-data envelope', async () => {
		const { context } = createListSearchContext({
			response: { code: 200, message: 'No typed neighborhoods found' },
		});

		const result = await searchTypedNeighborhoods.call(context);

		assert.deepEqual(result, { results: [] });
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
			'retryPortalPublication',
			'update',
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

describe('Domus property portal operations', () => {
	it('registers the publications endpoint with idpro first and codpro optional', () => {
		const node = new Domus();
		const operation = getProperty(node.description.properties, 'operation');
		const publications = operation.options.find(
			(option) => option.value === 'getPortalPublications',
		);

		assert.equal(publications.routing.request.method, 'GET');
		assert.equal(
			publications.routing.request.url,
			'=/properties/portals/{{$parameter.portalPropertyId}}{{$parameter.portalPropertyCode ? "/" + $parameter.portalPropertyCode : ""}}',
		);
		assert.equal(publications.routing.output, undefined);
	});

	it('requires idpro and maps the agency header for publications', () => {
		const node = new Domus();
		const properties = node.description.properties;

		assert.equal(getProperty(properties, 'portalPropertyId').required, true);
		assert.equal(getProperty(properties, 'portalPropertyCode').required, undefined);
		assert.equal(
			getProperty(properties, 'portalEntireAgency').routing.request.headers.Inmobiliaria,
			'={{ $value ? 1 : 0 }}',
		);
	});

	it('uses the documented retry path, not the colliding badge path', () => {
		const node = new Domus();
		const operation = getProperty(node.description.properties, 'operation');
		const retry = operation.options.find((option) => option.value === 'retryPortalPublication');

		assert.equal(retry.routing.request.method, 'GET');
		assert.equal(
			retry.routing.request.url,
			'=/properties/retry-portals/{{$parameter.propertyCode}}{{$parameter.retryPropertyId ? "/" + $parameter.retryPropertyId : ""}}',
		);
	});

	it('sends the retry transaction as the documented method query parameter', () => {
		const node = new Domus();
		const retryMethod = getProperty(node.description.properties, 'retryMethod');

		assert.equal(retryMethod.required, true);
		assert.equal(retryMethod.routing.send.type, 'query');
		assert.equal(retryMethod.routing.send.property, 'method');
		assert.deepEqual(
			retryMethod.options.map((option) => [option.name, option.value]),
			[
				['Create', '1'],
				['Unpublish', '3'],
				['Update', '2'],
			],
		);
	});

	it('reuses the shared property code field for the retry operation', () => {
		const node = new Domus();
		const propertyCode = getProperty(node.description.properties, 'propertyCode');

		assert.ok(propertyCode.displayOptions.show.operation.includes('retryPortalPublication'));
	});
});

describe('Domus advisor and branch locators', () => {
	it('lists advisors by full name and scopes them with the agency header', async () => {
		const { context, requests } = createListSearchContext({
			data: [
				{ code: 1256, name: 'Ana', last_name: 'Restrepo' },
				{ code: 1257, name: 'Carlos', last_name: 'Mejía' },
			],
		});
		const brokers = await searchBrokers.call(context);

		assert.deepEqual(brokers, {
			results: [
				{ name: 'Ana Restrepo', value: '1256' },
				{ name: 'Carlos Mejía', value: '1257' },
			],
		});
		assert.equal(requests[0].options.url, '/administrative/brokers');
		assert.equal(requests[0].options.headers.Inmobiliaria, 1);
	});

	it('matches an advisor filter against the last name too', async () => {
		const { context } = createListSearchContext({
			data: [
				{ code: 1256, name: 'Ana', last_name: 'Restrepo' },
				{ code: 1257, name: 'Carlos', last_name: 'Mejía' },
			],
		});

		assert.deepEqual(await searchBrokers.call(context, 'restrepo'), {
			results: [{ name: 'Ana Restrepo', value: '1256' }],
		});
	});

	it('lists branches from the administrative directory without the agency header', async () => {
		const { context, requests } = createListSearchContext({
			data: [{ code: 601, name: 'Sede Norte' }],
		});
		const branches = await searchBranches.call(context);

		assert.deepEqual(branches, { results: [{ name: 'Sede Norte', value: '601' }] });
		assert.equal(requests[0].options.url, '/administrative/branches');
		assert.equal(requests[0].options.headers.Inmobiliaria, undefined);
	});

	it('wires advisor and branch locators into every operation that sends those codes', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const filters = getProperty(properties, 'filters').options;
		const createFields = getProperty(properties, 'additionalFields').options;
		const changeStatusFields = getProperty(properties, 'changeStatusFields').options;

		const locatorMethod = (fields, name) =>
			getProperty(fields, name).modes[0].typeOptions.searchListMethod;

		assert.equal(locatorMethod(filters, 'branch'), 'searchBranches');
		assert.equal(locatorMethod(filters, 'broker'), 'searchBrokers');
		assert.equal(locatorMethod(createFields, 'branch'), 'searchBranches');
		assert.equal(locatorMethod(createFields, 'broker'), 'searchBrokers');
		assert.equal(locatorMethod(createFields, 'catcherBroker'), 'searchBrokers');
		assert.equal(locatorMethod(createFields, 'promoterBroker'), 'searchBrokers');
		assert.equal(locatorMethod(changeStatusFields, 'broker'), 'searchBrokers');
	});
});

describe('Domus property create operation', () => {
	it('registers POST /properties as form-urlencoded and unwraps property', () => {
		const node = new Domus();
		const operation = getProperty(node.description.properties, 'operation');
		const create = operation.options.find((option) => option.value === 'create');

		assert.equal(create.routing.request.method, 'POST');
		assert.equal(create.routing.request.url, '/properties');
		assert.equal(
			create.routing.request.headers['Content-Type'],
			'application/x-www-form-urlencoded',
		);
		assert.deepEqual(create.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'property' } },
		]);
	});

	it('requires city, address, business type, and property type', () => {
		const node = new Domus();
		const properties = node.description.properties;

		assert.equal(getProperty(properties, 'city').required, true);
		assert.equal(getProperty(properties, 'city').routing.send.property, 'city');
		assert.equal(getProperty(properties, 'city').modes[0].typeOptions.searchListMethod, 'searchCatalogCities');
		assert.equal(getProperty(properties, 'address').required, true);
		assert.equal(getProperty(properties, 'address').routing.send.property, 'address');
		assert.equal(getProperty(properties, 'businessType').required, true);
		assert.equal(getProperty(properties, 'businessType').routing.send.property, 'biz');
		assert.equal(
			getProperty(properties, 'propertyType').modes[0].typeOptions.searchListMethod,
			'searchCatalogPropertyTypes',
		);
		assert.equal(getProperty(properties, 'rent').routing.send.property, 'rent');
		assert.match(getProperty(properties, 'rent').routing.send.value, /undefined/);
		assert.equal(getProperty(properties, 'salePrice').routing.send.property, 'saleprice');
	});

	it('maps additional create fields to documented form keys', () => {
		const node = new Domus();
		const extraFields = getProperty(node.description.properties, 'additionalFields').options;

		assert.deepEqual(
			Object.fromEntries(extraFields.map((field) => [field.name, field.routing.send.property])),
			{
				administration: 'administration',
				amenities: 'amenities',
				bathrooms: 'bathrooms',
				bedrooms: 'bedrooms',
				branch: 'branch',
				broker: 'broker',
				builtArea: 'area_cons',
				builtYear: 'built_year',
				catcherBroker: 'catcher_broker',
				cityZone: 'city_zone',
				comment: 'comment',
				commissionPercentage: 'comission_percentage',
				consignationDate: 'consignation_date',
				description: 'description',
				destination: 'destination',
				exclusive: 'exclusive',
				featured: 'great',
				floor: 'floor',
				floorType: 'floor_type',
				iva: 'iva',
				latitude: 'latitude',
				levels: 'level',
				linkWeb: 'link_web',
				longitude: 'longitude',
				lotArea: 'area_lot',
				neighborhood: 'neighborhood',
				parking: 'parking',
				parkingCovered: 'parking_covered',
				privateArea: 'private_area',
				project: 'project',
				promoterBroker: 'promoter_broker',
				propertyCode: 'codpro',
				publicationDate: 'publication_date',
				reference: 'reference',
				registration: 'registration',
				remodelingYear: 'remodeling_year',
				status: 'status',
				stratum: 'stratum',
				tour3d: 'tour3d',
				updateDate: 'update_date',
				video: 'video',
				windowSign: 'window_sign',
				zone: 'zone',
			},
		);
		assert.equal(getProperty(extraFields, 'featured').routing.send.value, '={{ $value ? 1 : 0 }}');
		assert.equal(
			getProperty(extraFields, 'zone').modes[0].typeOptions.searchListMethod,
			'searchCatalogZones',
		);
		assert.equal(getProperty(extraFields, 'status').type, 'resourceLocator');
		assert.equal(
			getProperty(extraFields, 'neighborhoodCode'),
			undefined,
		);
	});
});

describe('Domus property update operation', () => {
	it('registers PUT /properties/{codpro} as form-urlencoded without a status field', () => {
		const node = new Domus();
		const operation = getProperty(node.description.properties, 'operation');
		const update = operation.options.find((option) => option.value === 'update');
		const extraFields = getProperty(node.description.properties, 'updateFields').options;

		assert.equal(update.routing.request.method, 'PUT');
		assert.equal(update.routing.request.url, '=/properties/{{$parameter.propertyCode}}');
		assert.equal(
			update.routing.request.headers['Content-Type'],
			'application/x-www-form-urlencoded',
		);
		assert.deepEqual(update.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'property' } },
		]);
		assert.equal(getProperty(extraFields, 'status'), undefined);
		assert.equal(getProperty(extraFields, 'deletePictures').routing.send.property, 'delete_pictures');
		assert.equal(getProperty(extraFields, 'city').routing.send.property, 'city');
		assert.equal(getProperty(extraFields, 'address').routing.send.property, 'address');
		assert.equal(getProperty(extraFields, 'salePrice').routing.send.property, 'saleprice');
	});
});

const getOwnerOperation = (value) => {
	const node = new Domus();
	const operation = node.description.properties.find(
		(property) =>
			property.name === 'operation' &&
			property.displayOptions?.show?.resource?.includes('owner'),
	);

	return { node, operation, option: operation.options.find((entry) => entry.value === value) };
};

describe('Domus owner resource', () => {
	it('exposes the four documented owner operations on their documented endpoints', () => {
		const { operation } = getOwnerOperation('search');

		assert.deepEqual(
			operation.options.map((option) => option.name),
			['Search', 'Get', 'Create', 'Update'],
		);
		assert.deepEqual(
			operation.options.map((option) => [option.routing.request.method, option.routing.request.url]),
			[
				['GET', '/owners'],
				['GET', '=/owners/{{$parameter.ownerDocument}}'],
				['POST', '/owners'],
				['PUT', '=/owners/{{$parameter.ownerDocument}}'],
			],
		);
	});

	it('unwraps the list envelope on reads and the property envelope on writes', () => {
		const dataEnvelope = [{ type: 'rootProperty', properties: { property: 'data' } }];
		const writeEnvelope = [{ type: 'rootProperty', properties: { property: 'property' } }];

		assert.deepEqual(getOwnerOperation('search').option.routing.output.postReceive, dataEnvelope);
		assert.deepEqual(getOwnerOperation('get').option.routing.output.postReceive, dataEnvelope);
		assert.deepEqual(getOwnerOperation('create').option.routing.output.postReceive, writeEnvelope);
		assert.deepEqual(getOwnerOperation('update').option.routing.output.postReceive, writeEnvelope);
	});

	it('sends owner writes as form-urlencoded, as Domus documents', () => {
		for (const value of ['create', 'update']) {
			assert.equal(
				getOwnerOperation(value).option.routing.request.headers['Content-Type'],
				'application/x-www-form-urlencoded',
			);
		}
	});

	it('maps every documented search filter to its query parameter', () => {
		const node = new Domus();
		const filters = getResourceProperty(node.description.properties, 'owner', 'filters').options;

		assert.deepEqual(
			Object.fromEntries(filters.map((filter) => [filter.name, filter.routing.send.property])),
			{
				branch: 'branch',
				city: 'city',
				codpro: 'codpro',
				document: 'document',
				email: 'email',
				hasEmail: 'has_email',
				hasProperties: 'has_properties',
				name: 'name',
				order: 'order',
				phone: 'phone',
				precisePhone: 'precise_phone',
				sort: 'sort',
			},
		);
		assert.equal(
			getProperty(filters, 'hasEmail').routing.send.value,
			'={{ $value ? 1 : undefined }}',
		);
		assert.deepEqual(
			getProperty(filters, 'order').options.map((option) => option.value),
			['code', 'name', 'last_name'],
		);
	});

	it('follows Domus pagination for owners while repeating the active filters', () => {
		const node = new Domus();
		const returnAll = getResourceProperty(node.description.properties, 'owner', 'returnAll');
		const pagination = returnAll.routing.operations.pagination;

		assert.equal(returnAll.routing.send.paginate, '={{$value}}');
		assert.equal(
			pagination.properties.continue,
			'={{ Number($response.body?.current_page ?? 0) < Number($response.body?.last_page ?? 0) }}',
		);
		assert.equal(pagination.properties.request.qs.document, '={{ $request.qs?.["document"] }}');
		assert.equal(
			pagination.properties.request.qs.page,
			'={{ $response.body?.current_page ? Number($response.body.current_page) + 1 : Number($request.qs?.page ?? 1) }}',
		);
	});

	it('requires name, last name, and document on create and maps the optional fields', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const required = ['name', 'lastName', 'document'].map((name) =>
			getResourceProperty(properties, 'owner', name),
		);
		const extraFields = getResourceProperty(properties, 'owner', 'ownerFields').options;

		assert.deepEqual(
			required.map((field) => [field.required, field.routing.send.property]),
			[
				[true, 'name'],
				[true, 'last_name'],
				[true, 'document'],
			],
		);
		assert.deepEqual(
			Object.fromEntries(extraFields.map((field) => [field.name, field.routing.send.property])),
			{
				birthday: 'birthday',
				branch: 'branch',
				city: 'city',
				description: 'description',
				documentType: 'document_type',
				email: 'email',
				neighborhood: 'neighborhood',
				phones: 'phones',
				property: 'property',
				sharePercentage: 'share_percentage',
				verificationDigit: 'verification_digit',
			},
		);
		assert.equal(
			getProperty(extraFields, 'documentType').modes[0].typeOptions.searchListMethod,
			'searchDocumentTypes',
		);
	});

	it('lets update rewrite the identity fields and replace the phone list', () => {
		const node = new Domus();
		const extraFields = getResourceProperty(
			node.description.properties,
			'owner',
			'ownerUpdateFields',
		).options;

		assert.equal(getProperty(extraFields, 'name').routing.send.property, 'name');
		assert.equal(getProperty(extraFields, 'lastName').routing.send.property, 'last_name');
		assert.equal(getProperty(extraFields, 'document').routing.send.property, 'document');
		assert.equal(
			getProperty(extraFields, 'phonesRecursive').routing.send.property,
			'phones_recursive',
		);
		assert.equal(
			getProperty(extraFields, 'phonesRecursive').routing.send.value,
			'={{ $value ? 1 : undefined }}',
		);
	});

	it('offers the owner code and property status filters on get', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const document = getResourceProperty(properties, 'owner', 'ownerDocument');
		const options = getResourceProperty(properties, 'owner', 'ownerGetOptions').options;

		assert.equal(document.required, true);
		assert.deepEqual(document.displayOptions.show.operation, ['get', 'update']);
		assert.equal(getProperty(options, 'code').routing.send.property, 'code');
		assert.equal(
			getProperty(options, 'propertyStatusCode').routing.send.property,
			'property_status_code',
		);
	});

	it('loads phone and document types from their documented catalogs', async () => {
		const { context: phoneContext, requests: phoneRequests } = createListSearchContext({
			data: [{ code: 1, name: 'Casa' }],
		});
		assert.deepEqual(await searchPhoneTypes.call(phoneContext), {
			results: [{ name: 'Casa', value: '1' }],
		});
		assert.equal(phoneRequests[0].options.url, '/general/phone-types');
		assert.equal(phoneRequests[0].options.headers.Inmobiliaria, undefined);

		const { context: documentContext, requests: documentRequests } = createListSearchContext({
			data: [{ code: 1, name: 'Cedula' }],
		});
		assert.deepEqual(await searchDocumentTypes.call(documentContext), {
			results: [{ name: 'Cedula', value: '1' }],
		});
		assert.equal(documentRequests[0].options.url, '/administrative/document_types');
	});
});

describe('Domus advisor resource', () => {
	const getAdvisorOperation = () => {
		const node = new Domus();
		const operation = node.description.properties.find(
			(property) =>
				property.name === 'operation' &&
				property.displayOptions?.show?.resource?.includes('advisor'),
		);

		return { node, operation };
	};

	it('registers Advisor as a resource alongside Owner and Property', () => {
		const node = new Domus();
		const resource = getProperty(node.description.properties, 'resource');

		assert.deepEqual(resource.options, [
			{ name: 'Acquisition', value: 'acquisition' },
			{ name: 'Advisor', value: 'advisor' },
			{ name: 'Owner', value: 'owner' },
			{ name: 'Project', value: 'project' },
			{ name: 'Property', value: 'property' },
		]);
	});

	it('exposes only the documented advisor read operation', () => {
		const { operation } = getAdvisorOperation();
		const search = operation.options.find((option) => option.value === 'search');

		assert.deepEqual(
			operation.options.map((option) => option.name),
			['Search'],
		);
		assert.equal(search.routing.request.method, 'GET');
		assert.equal(search.routing.request.url, '/administrative/brokers');
		assert.deepEqual(search.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
	});

	it('maps every documented advisor filter to its query parameter', () => {
		const node = new Domus();
		const filters = getResourceProperty(node.description.properties, 'advisor', 'filters')
			.options;

		assert.deepEqual(
			Object.fromEntries(filters.map((filter) => [filter.name, filter.routing.send.property])),
			{
				branch: 'branch',
				city: 'city',
				email: 'email',
				exactEmail: 'exact_email',
				name: 'name',
				order: 'order',
				phone: 'phone',
				sort: 'sort',
			},
		);
		assert.deepEqual(
			getProperty(filters, 'order').options.map((option) => option.value),
			['code', 'order', 'email', 'name', 'last_name'],
		);
		assert.equal(getProperty(filters, 'branch').modes[0].typeOptions.searchListMethod, 'searchBranches');
		assert.equal(
			getProperty(filters, 'city').modes[0].typeOptions.searchListMethod,
			'searchCatalogCities',
		);
	});

	it('bounds results client-side because Domus does not paginate advisors', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const returnAll = getResourceProperty(properties, 'advisor', 'returnAll');
		const limit = getResourceProperty(properties, 'advisor', 'limit');

		assert.equal(returnAll.routing, undefined);
		assert.equal(limit.routing.output.maxResults, '={{$value}}');
		assert.equal(limit.routing.request, undefined);
		assert.equal(
			getResourceProperty(properties, 'advisor', 'entireAgency').routing.request.headers
				.Inmobiliaria,
			'={{ $value ? 1 : 0 }}',
		);
	});
});

describe('Domus project resource', () => {
	const getProjectOperation = (value) => {
		const node = new Domus();
		const operation = node.description.properties.find(
			(property) =>
				property.name === 'operation' &&
				property.displayOptions?.show?.resource?.includes('project'),
		);

		return { node, operation, option: operation.options.find((entry) => entry.value === value) };
	};

	it('targets the Domus V2 project endpoints, not the MLS ones', () => {
		const { operation } = getProjectOperation('search');

		assert.deepEqual(
			operation.options.map((option) => [option.routing.request.method, option.routing.request.url]),
			[
				['GET', '/projects-v2'],
				['GET', '=/projects-v2/{{$parameter.projectCode}}'],
			],
		);
		for (const option of operation.options) {
			assert.deepEqual(option.routing.output.postReceive, [
				{ type: 'rootProperty', properties: { property: 'data' } },
			]);
		}
	});

	it('identifies a project by assigned code with unique code as the fallback', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const code = getResourceProperty(properties, 'project', 'projectCode');
		const uniqueCode = getResourceProperty(properties, 'project', 'projectUniqueCode');

		assert.equal(code.required, true);
		assert.equal(code.routing, undefined);
		assert.equal(uniqueCode.required, undefined);
		assert.equal(uniqueCode.routing.send.type, 'query');
		assert.equal(uniqueCode.routing.send.property, 'unique_code');
	});

	it('maps every documented project filter to its query parameter', () => {
		const node = new Domus();
		const filters = getResourceProperty(node.description.properties, 'project', 'filters')
			.options;

		assert.deepEqual(
			Object.fromEntries(filters.map((filter) => [filter.name, filter.routing.send.property])),
			{
				anyStatus: 'nostatus',
				branch: 'branch',
				city: 'city',
				code: 'code',
				country: 'country',
				name: 'name',
				neighborhood: 'neighborhood',
				order: 'order',
				sort: 'sort',
				status: 'status',
			},
		);
		assert.equal(
			getProperty(filters, 'anyStatus').routing.send.value,
			'={{ $value ? 0 : undefined }}',
		);
		assert.equal(
			getProperty(filters, 'country').modes[0].typeOptions.searchListMethod,
			'searchCountries',
		);
	});

	it('follows the Laravel envelope while repeating the active project filters', () => {
		const node = new Domus();
		const returnAll = getResourceProperty(node.description.properties, 'project', 'returnAll');
		const pagination = returnAll.routing.operations.pagination;

		assert.equal(returnAll.routing.send.paginate, '={{$value}}');
		assert.equal(
			pagination.properties.continue,
			'={{ Number($response.body?.current_page ?? 0) < Number($response.body?.last_page ?? 0) }}',
		);
		assert.deepEqual(Object.keys(pagination.properties.request.qs).sort(), [
			'branch',
			'city',
			'code',
			'country',
			'name',
			'neighborhood',
			'nostatus',
			'order',
			'page',
			'sort',
			'status',
		]);
	});

	it('loads countries from the general catalog without the agency header', async () => {
		const { context, requests } = createListSearchContext({
			data: [
				{ code: 1, name: 'Colombia' },
				{ code: 2, name: 'Panamá' },
			],
		});

		assert.deepEqual(await searchCountries.call(context, 'colom'), {
			results: [{ name: 'Colombia', value: '1' }],
		});
		assert.equal(requests[0].options.url, '/general/countries');
		assert.equal(requests[0].options.headers.Inmobiliaria, undefined);
	});
});

describe('Domus acquisition resource', () => {
	const getAcquisitionOperation = () => {
		const node = new Domus();
		return node.description.properties.find(
			(property) =>
				property.name === 'operation' &&
				property.displayOptions?.show?.resource?.includes('acquisition'),
		);
	};

	it('targets the documented captures V2 endpoints', () => {
		const operation = getAcquisitionOperation();

		assert.deepEqual(
			operation.options.map((option) => [option.routing.request.method, option.routing.request.url]),
			[
				['GET', '/captures-v2'],
				['GET', '=/captures-v2/{{$parameter.acquisitionCode}}'],
			],
		);
		for (const option of operation.options) {
			assert.deepEqual(option.routing.output.postReceive, [
				{ type: 'rootProperty', properties: { property: 'data' } },
			]);
		}
	});

	it('identifies an acquisition by assigned code with unique code as the fallback', () => {
		const node = new Domus();
		const properties = node.description.properties;
		const code = getResourceProperty(properties, 'acquisition', 'acquisitionCode');
		const uniqueCode = getResourceProperty(properties, 'acquisition', 'acquisitionUniqueCode');

		assert.equal(code.required, true);
		assert.equal(code.routing, undefined);
		assert.equal(uniqueCode.routing.send.property, 'unique_code');
	});

	it('maps every documented acquisition filter to its query parameter', () => {
		const node = new Domus();
		const filters = getResourceProperty(node.description.properties, 'acquisition', 'filters')
			.options;

		assert.deepEqual(
			Object.fromEntries(filters.map((filter) => [filter.name, filter.routing.send.property])),
			{
				branch: 'branch',
				broker: 'broker',
				businessType: 'biz',
				city: 'city',
				contact: 'contact',
				maxAdministration: 'administration_max',
				maxArea: 'maxarea',
				maxBathrooms: 'maxbath',
				maxBedrooms: 'maxbed',
				maxValue: 'price_max',
				minAdministration: 'administration_min',
				minArea: 'minarea',
				minBathrooms: 'minbath',
				minBedrooms: 'minbed',
				minValue: 'price_min',
				neighborhood: 'neighborhood',
				order: 'order',
				propertyType: 'type',
				sort: 'sort',
				stratum: 'stratum',
			},
		);
		assert.equal(
			getProperty(filters, 'broker').modes[0].typeOptions.searchListMethod,
			'searchBrokers',
		);
		assert.equal(
			getProperty(filters, 'propertyType').modes[0].typeOptions.searchListMethod,
			'searchCatalogPropertyTypes',
		);
	});

	it('repeats every acquisition filter across paginated requests', () => {
		const node = new Domus();
		const returnAll = getResourceProperty(
			node.description.properties,
			'acquisition',
			'returnAll',
		);
		const paginationQuery = returnAll.routing.operations.pagination.properties.request.qs;

		assert.deepEqual(Object.keys(paginationQuery).sort(), [
			'administration_max',
			'administration_min',
			'biz',
			'branch',
			'broker',
			'city',
			'contact',
			'maxarea',
			'maxbath',
			'maxbed',
			'minarea',
			'minbath',
			'minbed',
			'neighborhood',
			'order',
			'page',
			'price_max',
			'price_min',
			'sort',
			'stratum',
			'type',
		]);
	});
});

describe('Domus resource isolation', () => {
	const resolve = (values) => {
		const node = new Domus();
		return getNodeParameters(
			node.description.properties,
			values,
			true,
			false,
			null,
			node.description,
		);
	};

	it('keeps owner and property parameters apart even where they share a name', () => {
		assert.deepEqual(Object.keys(resolve({ resource: 'owner', operation: 'create' })).sort(), [
			'document',
			'lastName',
			'name',
			'operation',
			'ownerFields',
			'resource',
		]);
		assert.deepEqual(Object.keys(resolve({ resource: 'owner', operation: 'get' })).sort(), [
			'operation',
			'ownerDocument',
			'ownerGetEntireAgency',
			'ownerGetOptions',
			'resource',
		]);
		assert.deepEqual(Object.keys(resolve({ resource: 'property', operation: 'get' })).sort(), [
			'getEntireAgency',
			'getIncludeSheet',
			'getOptions',
			'operation',
			'propertyCode',
			'propertyId',
			'resource',
		]);
	});

	it('shows the property sheet header only on the property search', () => {
		const ownerSearch = Object.keys(resolve({ resource: 'owner', operation: 'search' }));
		const propertySearch = Object.keys(resolve({ resource: 'property', operation: 'search' }));

		assert.equal(ownerSearch.includes('includeSheet'), false);
		assert.equal(propertySearch.includes('includeSheet'), true);
		for (const shared of ['returnAll', 'limit', 'page', 'entireAgency', 'filters']) {
			assert.ok(ownerSearch.includes(shared));
			assert.ok(propertySearch.includes(shared));
		}
	});
});

describe('Domus owner phone serialization', () => {
	it('turns the phone collection into the documented JSON array', async () => {
		const requestOptions = {
			body: {
				name: 'Ana',
				phones: {
					phone: [
						{ type: '3', number: '3001234567' },
						{ type: 1, number: 6015551234 },
					],
				},
			},
		};

		const result = await serializeOwnerPhones.call({}, requestOptions);

		assert.equal(
			result.body.phones,
			'[{"type":"3","number":"3001234567"},{"type":"1","number":"6015551234"}]',
		);
		assert.equal(result.body.name, 'Ana');
	});

	it('drops the field when no number was filled in', async () => {
		const requestOptions = { body: { phones: { phone: [{ type: '3', number: '  ' }] } } };

		const result = await serializeOwnerPhones.call({}, requestOptions);

		assert.equal('phones' in result.body, false);
	});

	it('leaves a request without a body untouched', async () => {
		const requestOptions = { url: '/owners' };

		assert.deepEqual(await serializeOwnerPhones.call({}, requestOptions), requestOptions);
	});
});
