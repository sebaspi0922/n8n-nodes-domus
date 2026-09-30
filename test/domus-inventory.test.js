const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { DOMUS_PRODUCTION_BASE_URL } = require('../dist/nodes/Domus/constants.js');
const { Domus } = require('../dist/nodes/Domus/Domus.node.js');
const {
	searchCatalogCities,
	searchDestinations,
	searchDetachStatuses,
	searchExtraAmenities,
	searchPopulatedCenters,
	searchStates,
} = require('../dist/nodes/Domus/methods/listSearch.js');

const operationFor = (resource) => {
	const node = new Domus().getNodeType();
	return node.description.properties.find(
		(property) =>
			property.name === 'operation' &&
			property.displayOptions?.show?.resource?.includes(resource),
	);
};

const propertiesFor = (resource, name) => {
	const node = new Domus().getNodeType();
	return node.description.properties.find(
		(property) =>
			property.name === name && property.displayOptions?.show?.resource?.includes(resource),
	);
};

const createListSearchContext = ({ data, parameters = {} }) => {
	const requests = [];
	const context = {
		getCredentials: async () => ({ environment: DOMUS_PRODUCTION_BASE_URL }),
		getCurrentNodeParameter: (name) => {
			if (name === 'entireAgency') return false;
			if (name in parameters) return parameters[name];
			return undefined;
		},
		getCurrentNodeParameters: () => parameters,
		helpers: {
			httpRequestWithAuthentication: async (credentialName, options) => {
				requests.push({ credentialName, options });
				return { data };
			},
		},
	};

	return { context, requests };
};

describe('Domus node version', () => {
	it('keeps version 1 on the original resources and a single credential', () => {
		const node = new Domus().getNodeType(1);

		assert.equal(node.description.version, 1);
		assert.equal(node.description.name, 'domus');
		assert.deepEqual(
			node.description.properties.find((property) => property.name === 'resource').options.map(
				(option) => option.value,
			),
			['acquisition', 'advisor', 'branch', 'owner', 'project', 'property'],
		);
		assert.deepEqual(node.description.credentials, [{ name: 'domusApi', required: true }]);
	});

	it('adds CRM resources on version 2 with both credentials', () => {
		const node = new Domus().getNodeType();

		assert.equal(node.description.version, 2);
		assert.deepEqual(
			node.description.properties.find((property) => property.name === 'resource').options.map(
				(option) => option.value,
			),
			[
				'acquisition',
				'advisor',
				'branch',
				'contact',
				'meeting',
				'opportunity',
				'owner',
				'profile',
				'project',
				'property',
			],
		);
		assert.deepEqual(
			node.description.credentials.map((credential) => credential.name),
			['domusApi', 'domusCrmApi'],
		);
	});
});

describe('Property Search Map', () => {
	it('calls GET /properties/map and splits the data array', () => {
		const searchMap = operationFor('property').options.find((option) => option.value === 'searchMap');

		assert.equal(searchMap.routing.request.method, 'GET');
		assert.equal(searchMap.routing.request.url, '/properties/map');
		assert.equal(searchMap.routing.request.url.includes('deatch'), false);
		assert.deepEqual(searchMap.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
	});

	it('paginates with the map query parameters and the agency header', () => {
		const node = new Domus().getNodeType();
		const returnAll = node.description.properties.find(
			(property) =>
				property.name === 'returnAll' &&
				property.displayOptions?.show?.operation?.includes('searchMap'),
		);
		const pagination = returnAll.routing.operations.pagination;

		assert.equal(returnAll.routing.send.paginate, '={{$value}}');
		assert.match(pagination.properties.continue, /current_page/);
		assert.match(pagination.properties.continue, /last_page/);
		assert.deepEqual(Object.keys(pagination.properties.request.qs).sort(), [
			'amenities',
			'amenitiesin',
			'biz',
			'branch',
			'broker',
			'city',
			'codpro',
			'destination',
			'keyword',
			'maxarea',
			'maxbath',
			'maxbed',
			'minarea',
			'minbath',
			'minbed',
			'neighborhood',
			'neighborhood_code',
			'nostatus',
			'order',
			'page',
			'pcmax',
			'pcmin',
			'polygon',
			'pvmax',
			'pvmin',
			'sort',
			'status',
			'stratum',
			'type',
			'zone',
		]);
		assert.equal(
			node.description.properties.find(
				(property) =>
					property.name === 'entireAgency' &&
					property.displayOptions?.show?.operation?.includes('searchMap'),
			).routing.request.headers.Inmobiliaria,
			'={{ $value ? 1 : 0 }}',
		);
		assert.equal(
			node.description.properties.some(
				(property) =>
					property.name === 'includeSheet' &&
					property.displayOptions?.show?.operation?.includes('searchMap'),
			),
			false,
		);
	});

	it('sends polygon and destination on the map filters only', () => {
		const node = new Domus().getNodeType();
		const filters = node.description.properties.find(
			(property) =>
				property.name === 'filters' &&
				property.displayOptions?.show?.operation?.includes('searchMap'),
		).options;
		const polygon = filters.find((filter) => filter.name === 'polygon');
		const destination = filters.find((filter) => filter.name === 'destination');

		assert.equal(polygon.routing.send.property, 'polygon');
		assert.equal(destination.routing.send.property, 'destination');
		assert.equal(destination.modes[0].typeOptions.searchListMethod, 'searchDestinations');
		assert.equal(
			filters.some((filter) => filter.routing?.send?.property === 'estate'),
			false,
		);
	});
});

describe('Property Separate', () => {
	it('uses the Guzzle detach path and the detach-status catalog', () => {
		const separate = operationFor('property').options.find((option) => option.value === 'separate');
		const node = new Domus().getNodeType();
		const status = node.description.properties.find((property) => property.name === 'separationStatus');
		const fields = node.description.properties.find((property) => property.name === 'separateFields')
			.options;

		assert.equal(separate.routing.request.method, 'PUT');
		assert.equal(separate.routing.request.url, '=/properties/detach/{{$parameter.propertyCode}}');
		assert.equal(separate.routing.request.url.includes('deatch'), false);
		assert.equal(
			separate.routing.request.headers['Content-Type'],
			'application/x-www-form-urlencoded',
		);
		assert.deepEqual(separate.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.equal(status.required, true);
		assert.equal(status.routing.send.type, 'body');
		assert.equal(status.routing.send.property, 'status');
		assert.equal(status.modes[0].typeOptions.searchListMethod, 'searchDetachStatuses');
		assert.deepEqual(
			Object.fromEntries(fields.map((field) => [field.name, field.routing.send.property])),
			{
				comment: 'comment',
				days: 'days',
				value: 'value',
			},
		);
	});
});

describe('Owner Unlink', () => {
	it('deletes the association and keeps the owner record', () => {
		const unlink = operationFor('owner').options.find((option) => option.value === 'unlink');
		const ownerCode = propertiesFor('owner', 'ownerCode');
		const propertyCode = propertiesFor('owner', 'linkedPropertyCode');

		assert.equal(unlink.routing.request.method, 'DELETE');
		assert.equal(
			unlink.routing.request.url,
			'=/owners/{{$parameter.ownerCode}}/{{$parameter.linkedPropertyCode}}',
		);
		assert.match(unlink.description, /not deleted/i);
		assert.deepEqual(unlink.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.equal(ownerCode.required, true);
		assert.equal(propertyCode.required, true);
		assert.equal(
			propertiesFor('owner', 'unlinkEntireAgency').routing.request.headers.Inmobiliaria,
			'={{ $value ? 1 : 0 }}',
		);
	});
});

describe('Advisor create and update', () => {
	it('posts and puts form bodies and does not invent a get-by-id', () => {
		const operation = operationFor('advisor');
		const create = operation.options.find((option) => option.value === 'create');
		const update = operation.options.find((option) => option.value === 'update');
		const node = new Domus().getNodeType();
		const createFields = node.description.properties.find(
			(property) => property.name === 'advisorFields',
		).options;
		const updateFields = node.description.properties.find(
			(property) => property.name === 'advisorUpdateFields',
		).options;

		assert.equal(operation.options.some((option) => option.value === 'get'), false);
		assert.equal(create.routing.request.method, 'POST');
		assert.equal(create.routing.request.url, '/administrative/brokers');
		assert.equal(create.routing.request.headers['Content-Type'], 'application/x-www-form-urlencoded');
		assert.deepEqual(create.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'broker' } },
		]);
		assert.equal(update.routing.request.method, 'PUT');
		assert.equal(update.routing.request.url, '=/administrative/brokers/{{$parameter.advisorCode}}');
		assert.deepEqual(update.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'broker' } },
		]);
		assert.equal(propertiesFor('advisor', 'name').required, true);
		assert.equal(propertiesFor('advisor', 'lastName').routing.send.property, 'last_name');
		assert.equal(propertiesFor('advisor', 'document').routing.send.property, 'document');
		assert.equal(propertiesFor('advisor', 'advisorCode').required, true);
		assert.deepEqual(
			Object.fromEntries(createFields.map((field) => [field.name, field.routing.send.property])),
			{
				address: 'address',
				alternativeEmail: 'alternative_email',
				department: 'department',
				description: 'description',
				email: 'email',
				mlsBiz: 'mls_biz',
				mobilePhone: 'mobile_phone',
				order: 'order',
				phone: 'phone',
				pictureUrl: 'picture_url',
				verificationDigit: 'verification_digit',
			},
		);
		assert.equal(updateFields.find((field) => field.name === 'status').routing.send.property, 'status');
		assert.deepEqual(
			updateFields.find((field) => field.name === 'status').options.map((option) => option.value),
			['1', '2'],
		);
	});
});

describe('Branch Search', () => {
	it('lists branches as a public resource without pagination', () => {
		const search = operationFor('branch').options.find((option) => option.value === 'search');
		const returnAll = propertiesFor('branch', 'returnAll');
		const limit = propertiesFor('branch', 'limit');

		assert.deepEqual(
			operationFor('branch').options.map((option) => option.value),
			['search'],
		);
		assert.equal(search.routing.request.method, 'GET');
		assert.equal(search.routing.request.url, '/administrative/branches');
		assert.deepEqual(search.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.equal(returnAll.routing, undefined);
		assert.equal(limit.routing.output.maxResults, '={{$value}}');
		assert.equal(limit.routing.request, undefined);
	});
});

describe('remaining catalog selectors', () => {
	it('loads departments, destinations, and separation statuses from the Guzzle paths', async () => {
		const states = createListSearchContext({
			data: [{ code: 11, name: 'Bogotá', country_name: 'Colombia' }],
		});
		assert.deepEqual(await searchStates.call(states.context, 'bog'), {
			results: [{ name: 'Bogotá — Colombia', value: '11' }],
		});
		assert.equal(states.requests[0].options.method, 'GET');
		assert.equal(states.requests[0].options.url, '/general/states');
		assert.equal(states.requests[0].options.baseURL, 'https://api.domus.la/3.0');
		assert.equal(states.requests[0].options.headers.Inmobiliaria, undefined);
		assert.equal(states.requests[0].credentialName, 'domusApi');

		const destinations = createListSearchContext({
			data: [{ code: 1, name: 'Vivienda' }],
		});
		assert.deepEqual(await searchDestinations.call(destinations.context), {
			results: [{ name: 'Vivienda', value: '1' }],
		});
		assert.equal(destinations.requests[0].options.url, '/general/destinations');

		const detach = createListSearchContext({
			data: [{ code: 1, name: 'Separado' }],
		});
		assert.deepEqual(await searchDetachStatuses.call(detach.context), {
			results: [{ name: 'Separado', value: '1' }],
		});
		assert.equal(detach.requests[0].options.url, '/general/detach/status');
		assert.equal(detach.requests[0].options.url.includes('deatch'), false);
	});

	it('scopes populated centers by city and extra amenities by property type', async () => {
		const centers = createListSearchContext({
			data: [{ code: 3420, name: 'BOGOTÁ, DISTRITO CAPITAL' }],
			parameters: { city: { mode: 'id', value: '11001' } },
		});
		await searchPopulatedCenters.call(centers.context);
		assert.equal(centers.requests[0].options.url, '/general/populated-centers');
		assert.deepEqual(centers.requests[0].options.qs, { city: '11001' });

		const extras = createListSearchContext({
			data: [{ code: 33, name: 'Ubicación comercial' }],
			parameters: {
				additionalFields: { propertyType: { mode: 'id', value: '5' } },
			},
		});
		await searchExtraAmenities.call(extras.context);
		assert.equal(extras.requests[0].options.url, '/general/amenities-extra');
		assert.deepEqual(extras.requests[0].options.qs, { type: '5' });
	});

	it('scopes the full city catalog with the selected department', async () => {
		const cities = createListSearchContext({
			data: [{ code: 11001, name: 'Bogotá' }],
			parameters: {
				additionalFields: { department: { mode: 'list', value: '11' } },
			},
		});

		await searchCatalogCities.call(cities.context);
		assert.equal(cities.requests[0].options.url, '/general/cities');
		assert.deepEqual(cities.requests[0].options.qs, { state: '11' });
		assert.equal(cities.requests[0].options.baseURL, DOMUS_PRODUCTION_BASE_URL);
		assert.doesNotMatch(cities.requests[0].options.baseURL, /apind\.domus\.la/);
		assert.notEqual(cities.requests[0].options.baseURL, 'https://api.domus.la');
	});
});
