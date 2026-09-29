const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { describe, it } = require('node:test');

const { DOMUS_CONTACTS_BASE_URL, DOMUS_CRM_BASE_URL } = require('../dist/nodes/DomusCrm/constants.js');
const { DomusCrmApi } = require('../dist/credentials/DomusCrmApi.credentials.js');
const { Domus } = require('../dist/nodes/Domus/Domus.node.js');
const { DomusCrm } = require('../dist/nodes/DomusCrm/DomusCrm.node.js');
const {
	searchMeetingResults,
	searchMeetingStatuses,
	searchMeetingTypes,
	searchOpportunityStatuses,
	searchProfiles,
} = require('../dist/nodes/DomusCrm/methods/listSearch.js');
const {
	CONTACT_EMAIL_OR_PHONE_MESSAGE,
	hasContactEmailOrPhone,
	requireContactEmailOrPhone,
} = require('../dist/nodes/DomusCrm/resources/contact/create.js');
const {
	MEETING_PLACE_OR_PROPERTY_CODE_MESSAGE,
	hasMeetingPlaceOrPropertyCode,
	requireMeetingPlaceOrPropertyCode,
} = require('../dist/nodes/DomusCrm/resources/meeting/create.js');
const { requestDomusContacts } = require('./helpers/domus-contacts-http');
const { requestDomusContactsWrite } = require('./helpers/domus-contacts-write-http');
const { requestDomusCrm } = require('./helpers/domus-crm-http');
const { requestDomusCrmWrite } = require('./helpers/domus-crm-write-http');
const {
	DOMUS_CONTACTS_BASE_URL: helperContactsBaseURL,
	DOMUS_CRM_BASE_URL: helperBaseURL,
	assertDomusContactsHost,
	assertDomusCrmHost,
	getDomusCrmTestConfig,
} = require('./helpers/env');

const getProperty = (properties, name) => properties.find((property) => property.name === name);

const readSourceTree = (directory) => {
	const chunks = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			chunks.push(readSourceTree(path));
			continue;
		}
		if (entry.name.endsWith('.ts')) chunks.push(readFileSync(path, 'utf8'));
	}
	return chunks.join('\n');
};

const withEnv = async (values, run) => {
	const previous = new Map();
	for (const key of Object.keys(values)) {
		previous.set(key, process.env[key]);
		if (values[key] === undefined) delete process.env[key];
		else process.env[key] = values[key];
	}

	try {
		return await run();
	} finally {
		for (const [key, value] of previous) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	}
};

const createListSearchContext = ({ data, parameters = {} }) => {
	const requests = [];
	const context = {
		getCredentials: async () => {
			throw new Error('CRM selectors must not read credential fields');
		},
		getCurrentNodeParameter: (name) => parameters[name],
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

describe('Domus CRM API credentials', () => {
	it('stores only a password token and has no environment selector', () => {
		const credentials = new DomusCrmApi();
		const names = credentials.properties.map((property) => property.name);
		const token = getProperty(credentials.properties, 'token');

		assert.equal(credentials.name, 'domusCrmApi');
		assert.equal(credentials.displayName, 'Domus CRM API');
		assert.deepEqual(names, ['token']);
		assert.equal(token.required, true);
		assert.equal(token.typeOptions.password, true);
		assert.equal(getProperty(credentials.properties, 'environment'), undefined);
	});

	it('sends the raw token only in the Authorization header', () => {
		const credentials = new DomusCrmApi();

		assert.deepEqual(credentials.authenticate.properties, {
			headers: { Authorization: '={{$credentials.token}}' },
		});
		assert.doesNotMatch(credentials.authenticate.properties.headers.Authorization, /Bearer/i);
	});

	it('tests credentials with GET https://apind.domus.la/meetings/types', () => {
		const credentials = new DomusCrmApi();

		assert.equal(credentials.test.request.method, 'GET');
		assert.equal(credentials.test.request.baseURL, 'https://apind.domus.la');
		assert.equal(credentials.test.request.url, '/meetings/types');
		assert.equal(
			`${credentials.test.request.baseURL}${credentials.test.request.url}`,
			'https://apind.domus.la/meetings/types',
		);
	});

	it('does not read the property API credential or its token', () => {
		const source = [
			readSourceTree(join(__dirname, '../nodes/DomusCrm')),
			readFileSync(join(__dirname, '../credentials/DomusCrmApi.credentials.ts'), 'utf8'),
			readFileSync(join(__dirname, './helpers/domus-crm-http.js'), 'utf8'),
		].join('\n');

		assert.doesNotMatch(source, /DOMUS_TEST_TOKEN/);
		assert.doesNotMatch(source, /domusApi/);
		assert.doesNotMatch(source, /newapi\.domus\.la/);
		assert.doesNotMatch(source, /api\.domus\.la\/3\.0/);
	});
});

describe('Domus CRM meeting node', () => {
	it('keeps the property node on its five resources at version 1', () => {
		const node = new Domus();
		const resource = getProperty(node.description.properties, 'resource');

		assert.equal(node.description.name, 'domus');
		assert.equal(node.description.version, 1);
		assert.deepEqual(
			resource.options.map((option) => option.value),
			['acquisition', 'advisor', 'owner', 'project', 'property'],
		);
	});

	it('declares a fixed CRM base URL and the CRM credential', () => {
		const node = new DomusCrm();

		assert.equal(node.description.displayName, 'Domus CRM');
		assert.equal(node.description.name, 'domusCrm');
		assert.equal(node.description.version, 1);
		assert.equal(node.description.usableAsTool, true);
		assert.equal(node.execute, undefined);
		assert.equal(DOMUS_CRM_BASE_URL, 'https://apind.domus.la');
		assert.equal(node.description.requestDefaults.baseURL, 'https://apind.domus.la');
		assert.deepEqual(node.description.requestDefaults.headers, { Accept: 'application/json' });
		assert.deepEqual(node.description.credentials, [{ name: 'domusCrmApi', required: true }]);
	});

	it('routes Meeting Search to GET /meetings and splits data into items', () => {
		const node = new DomusCrm();
		const resource = getProperty(node.description.properties, 'resource');
		const operation = getProperty(node.description.properties, 'operation');
		const search = operation.options.find((option) => option.value === 'search');
		const properties = node.description.properties;
		const startDate = getProperty(properties, 'startDate');
		const endDate = getProperty(properties, 'endDate');
		const profile = getProperty(properties, 'profile');
		const meetingType = getProperty(properties, 'meetingType');

		assert.deepEqual(resource.options, [
			{ name: 'Meeting', value: 'meeting' },
			{ name: 'Opportunity', value: 'opportunity' },
			{ name: 'Profile', value: 'profile' },
			{ name: 'Contact', value: 'contact' },
		]);
		assert.equal(search.routing.request.method, 'GET');
		assert.equal(search.routing.request.url, '/meetings');
		assert.deepEqual(search.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.equal(search.routing.operations, undefined);
		assert.equal(getProperty(properties, 'returnAll'), undefined);
		assert.equal(startDate.required, true);
		assert.equal(startDate.routing.send.type, 'query');
		assert.equal(startDate.routing.send.property, 'start_date');
		assert.equal(endDate.required, true);
		assert.equal(endDate.routing.send.property, 'end_date');
		assert.equal(profile.required, undefined);
		assert.equal(profile.type, 'resourceLocator');
		assert.equal(profile.routing.send.type, 'query');
		assert.equal(profile.routing.send.property, 'profile');
		assert.equal(profile.modes[0].typeOptions.searchListMethod, 'searchProfiles');
		assert.equal(meetingType.type, 'resourceLocator');
		assert.equal(meetingType.routing.send.property, 'type');
		assert.equal(meetingType.modes[0].typeOptions.searchListMethod, 'searchMeetingTypes');
	});

	it('routes Meeting Get to GET /meetings/{meeting_id}', () => {
		const node = new DomusCrm();
		const operation = getProperty(node.description.properties, 'operation');
		const get = operation.options.find((option) => option.value === 'get');
		const meetingId = getProperty(node.description.properties, 'meetingId');

		assert.equal(get.routing.request.method, 'GET');
		assert.equal(get.routing.request.url, '=/meetings/{{$parameter.meetingId}}');
		assert.deepEqual(get.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.equal(meetingId.required, true);
		assert.equal(meetingId.routing, undefined);
		assert.deepEqual(meetingId.displayOptions.show.operation, ['get', 'update', 'confirm']);
		assert.doesNotMatch(JSON.stringify(node.description.properties), /meeting_code/);
	});

	it('shows Search and Get fields on separate operations', () => {
		const node = new DomusCrm();
		const properties = node.description.properties;
		const searchNames = ['startDate', 'endDate', 'profile', 'meetingType'];

		for (const name of searchNames) {
			const property = getProperty(properties, name);
			assert.deepEqual(property.displayOptions.show.operation, ['search']);
			assert.deepEqual(property.displayOptions.show.resource, ['meeting']);
		}

		const meetingId = getProperty(properties, 'meetingId');
		assert.deepEqual(meetingId.displayOptions.show.operation, ['get', 'update', 'confirm']);
		assert.deepEqual(meetingId.displayOptions.show.resource, ['meeting']);

		for (const name of ['branch', 'name', 'altCode']) {
			assert.equal(
				properties.some(
					(property) =>
						property.name === name && property.displayOptions?.show?.resource?.includes('meeting'),
				),
				false,
				name,
			);
		}
	});

	it('loads type, status, and result selectors from the CRM API', async () => {
		const methods = [
			[searchMeetingTypes, '/meetings/types'],
			[searchMeetingStatuses, '/meetings/status'],
			[searchMeetingResults, '/meetings/results'],
		];

		for (const [method, endpoint] of methods) {
			const { context, requests } = createListSearchContext({
				data: [{ code: 2, name: 'Cancelada' }],
			});
			const result = await method.call(context, 'cancel');

			assert.deepEqual(result, { results: [{ name: 'Cancelada', value: '2' }] });
			assert.equal(requests[0].credentialName, 'domusCrmApi');
			assert.equal(requests[0].options.baseURL, 'https://apind.domus.la');
			assert.equal(requests[0].options.url, endpoint);
			assert.equal(requests[0].options.method, 'GET');
			assert.equal(requests[0].options.qs, undefined);
			assert.equal(requests[0].options.headers.Authorization, undefined);
			assert.equal(requests[0].options.headers.Inmobiliaria, undefined);
		}
	});

	it('filters meeting results by status when a status id is present', async () => {
		const { context, requests } = createListSearchContext({
			data: [
				{ code: 37, name: 'PENDIENTE', status: 1 },
				{ code: 9, name: 'REALIZADA', status: 2 },
			],
			parameters: { status: { mode: 'list', value: '1' } },
		});

		const result = await searchMeetingResults.call(context);

		assert.deepEqual(result, { results: [{ name: 'PENDIENTE', value: '37' }] });
		assert.equal(requests[0].options.url, '/meetings/results');
		assert.deepEqual(requests[0].options.qs, { status: '1' });
	});

	it('routes Create, Update, and Confirm as form bodies on separate operations', () => {
		const node = new DomusCrm();
		const properties = node.description.properties;
		const operation = getProperty(properties, 'operation');
		const shownFor = (name) =>
			properties.filter(
				(property) =>
					property.displayOptions?.show?.resource?.includes('meeting') &&
					property.displayOptions?.show?.operation?.includes(name),
			);
		const named = (list, name) => list.find((property) => property.name === name);
		const assertBody = (property, apiName) => {
			assert.equal(property.routing.send.type, 'body');
			assert.equal(property.routing.send.property, apiName);
			assert.notEqual(property.routing.send.type, 'query');
		};

		assert.deepEqual(
			operation.options.map((option) => option.value),
			['search', 'get', 'create', 'update', 'confirm'],
		);

		const create = operation.options.find((option) => option.value === 'create');
		const update = operation.options.find((option) => option.value === 'update');
		const confirm = operation.options.find((option) => option.value === 'confirm');
		const createFields = shownFor('create');
		const updateFields = shownFor('update');
		const confirmFields = shownFor('confirm');

		assert.equal(create.routing.request.method, 'POST');
		assert.equal(create.routing.request.url, '/meetings');
		assert.equal(create.routing.request.headers['Content-Type'], 'application/x-www-form-urlencoded');
		assert.equal(create.routing.output, undefined);
		assert.equal(create.routing.send.preSend[0], requireMeetingPlaceOrPropertyCode);

		const createStartDate = named(createFields, 'startDate');
		const finishDate = named(createFields, 'finishDate');
		const notes = named(createFields, 'notes');
		const dateType = named(createFields, 'dateType');
		const place = named(createFields, 'place');
		const propertyCode = named(createFields, 'propertyCode');
		const contact = named(createFields, 'contact');
		const broker = named(createFields, 'broker');

		assert.equal(createStartDate.required, true);
		assert.equal(createStartDate.placeholder, 'yyyy-mm-dd hh:mm:ss');
		assertBody(createStartDate, 'start_date');
		assert.equal(finishDate.required, true);
		assert.equal(finishDate.placeholder, 'yyyy-mm-dd hh:mm:ss');
		assertBody(finishDate, 'finish_date');
		assert.equal(notes.required, true);
		assertBody(notes, 'notes');
		assert.equal(dateType.required, true);
		assert.equal(dateType.type, 'resourceLocator');
		assert.equal(dateType.modes[0].typeOptions.searchListMethod, 'searchMeetingTypes');
		assertBody(dateType, 'date_type');
		assert.notEqual(place.required, true);
		assert.match(place.description, /Property Code/);
		assertBody(place, 'place');
		assert.notEqual(propertyCode.required, true);
		assert.match(propertyCode.description, /Place/);
		assertBody(propertyCode, 'codpro');
		assert.equal(contact.required, undefined);
		assert.equal(contact.type, 'number');
		assert.equal(contact.routing.send.value, '={{ $value ? $value : undefined }}');
		assertBody(contact, 'contact');
		assert.equal(broker.type, 'number');
		assert.equal(broker.routing.send.value, '={{ $value ? $value : undefined }}');
		assertBody(broker, 'broker');

		assert.equal(hasMeetingPlaceOrPropertyCode('', ''), false);
		assert.equal(hasMeetingPlaceOrPropertyCode('   ', '  '), false);
		assert.equal(hasMeetingPlaceOrPropertyCode('Domus', ''), true);
		assert.equal(hasMeetingPlaceOrPropertyCode('', '123'), true);
		assert.equal(MEETING_PLACE_OR_PROPERTY_CODE_MESSAGE.includes('Place'), true);

		assert.equal(update.routing.request.method, 'PUT');
		assert.equal(update.routing.request.url, '=/meetings/{{$parameter.meetingId}}');
		assert.equal(update.routing.request.headers['Content-Type'], 'application/x-www-form-urlencoded');
		assert.equal(update.routing.output, undefined);

		const status = named(updateFields, 'status');
		const result = named(updateFields, 'result');
		const latitude = named(updateFields, 'latitude');
		const longitude = named(updateFields, 'longitude');
		const comment = named(updateFields, 'comment');
		const opportunityStatus = named(updateFields, 'opportunityStatus');

		assert.equal(status.required, true);
		assert.equal(status.modes[0].typeOptions.searchListMethod, 'searchMeetingStatuses');
		assertBody(status, 'status');
		assert.equal(result.required, true);
		assert.equal(result.modes[0].typeOptions.searchListMethod, 'searchMeetingResults');
		assert.deepEqual(result.typeOptions.loadOptionsDependsOn, ['status.value']);
		assertBody(result, 'result');
		assert.notEqual(latitude.required, true);
		assertBody(latitude, 'latitude');
		assertBody(longitude, 'longitude');
		assert.notEqual(comment.required, true);
		assertBody(comment, 'comment');
		assert.equal(opportunityStatus.type, 'number');
		assert.notEqual(opportunityStatus.required, true);
		assertBody(opportunityStatus, 'opportunity_status');
		assert.equal(named(updateFields, 'meetingId').routing, undefined);

		assert.equal(confirm.routing.request.method, 'PUT');
		assert.equal(confirm.routing.request.url, '=/meetings/verify/{{$parameter.meetingId}}');
		assert.equal(
			confirm.routing.request.headers['Content-Type'],
			'application/x-www-form-urlencoded',
		);
		assert.equal(confirm.routing.output, undefined);

		const verify = named(confirmFields, 'verify');
		assert.equal(verify.required, true);
		assertBody(verify, 'verify');
		assert.deepEqual(
			verify.options.map((option) => option.value),
			[1, 0],
		);

		const exclusive = ['search', 'create', 'update', 'confirm', 'get'];
		for (const property of properties) {
			if (!property.displayOptions?.show?.resource?.includes('meeting')) continue;
			const operations = property.displayOptions?.show?.operation;
			if (!operations) continue;
			if (property.name === 'meetingId') {
				assert.deepEqual(operations, ['get', 'update', 'confirm']);
				continue;
			}
			assert.equal(operations.length, 1, property.name);
			assert.ok(exclusive.includes(operations[0]), property.name);
		}

		const createNames = new Set(createFields.map((property) => property.name));
		const searchNames = new Set(shownFor('search').map((property) => property.name));
		for (const name of ['finishDate', 'notes', 'dateType', 'place', 'propertyCode', 'contact', 'broker']) {
			assert.equal(searchNames.has(name), false, name);
		}
		for (const name of ['endDate', 'profile', 'meetingType', 'verify', 'status', 'result']) {
			assert.equal(createNames.has(name), false, name);
		}
		assert.equal(confirmFields.some((property) => property.name === 'status'), false);
		assert.equal(confirmFields.some((property) => property.name === 'notes'), false);
		assert.equal(updateFields.some((property) => property.name === 'verify'), false);
		assert.equal(updateFields.some((property) => property.name === 'notes'), false);
	});

	it('rejects a create body that has neither place nor codpro', async () => {
		const context = { getNode: () => ({ name: 'Domus CRM' }) };
		await assert.rejects(
			requireMeetingPlaceOrPropertyCode.call(context, { body: { place: '', codpro: '' } }),
			(error) => {
				assert.match(error.message, /Place is required when Property Code is empty/);
				return true;
			},
		);

		const withPlace = { body: { place: 'Domus' } };
		assert.equal(await requireMeetingPlaceOrPropertyCode.call(context, withPlace), withPlace);

		const withCode = { body: { codpro: '123' } };
		assert.equal(await requireMeetingPlaceOrPropertyCode.call(context, withCode), withCode);
	});
});

describe('Domus CRM opportunity node', () => {
	const fieldsFor = (properties, operation) =>
		properties.filter(
			(property) =>
				property.displayOptions?.show?.resource?.includes('opportunity') &&
				property.displayOptions?.show?.operation?.includes(operation),
		);

	const opportunityOperation = (node) =>
		node.description.properties.find(
			(property) =>
				property.name === 'operation' &&
				property.displayOptions?.show?.resource?.includes('opportunity'),
		);

	it('routes Opportunity Search, Get, and Create without Meeting fields or pagination', () => {
		const node = new DomusCrm();
		const properties = node.description.properties;
		const operation = opportunityOperation(node);
		const search = operation.options.find((option) => option.value === 'search');
		const get = operation.options.find((option) => option.value === 'get');
		const create = operation.options.find((option) => option.value === 'create');
		const searchFields = fieldsFor(properties, 'search');
		const getFields = fieldsFor(properties, 'get');
		const createFields = fieldsFor(properties, 'create');
		const named = (list, name) => list.find((property) => property.name === name);

		assert.deepEqual(
			operation.options.map((option) => option.value),
			['search', 'get', 'create'],
		);
		assert.equal(
			properties.some((property) => property.displayOptions?.show?.resource?.includes('following')),
			false,
		);

		assert.equal(search.routing.request.method, 'GET');
		assert.equal(search.routing.request.url, '/opportunities');
		assert.deepEqual(search.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.equal(search.routing.operations, undefined);
		assert.equal(getProperty(properties, 'returnAll'), undefined);
		assert.doesNotMatch(JSON.stringify(search.routing), /page|Perpage/);

		const contact = named(searchFields, 'contact');
		const activityStatus = named(searchFields, 'activityStatus');
		const statusId = named(searchFields, 'statusId');
		const service = named(searchFields, 'service');
		const lastFollowUpdateFrom = named(searchFields, 'lastFollowUpdateFrom');
		const lastFollowUpdateTo = named(searchFields, 'lastFollowUpdateTo');

		assert.equal(contact.required, undefined);
		assert.equal(contact.type, 'number');
		assert.equal(contact.modes, undefined);
		assert.equal(contact.routing.send.type, 'query');
		assert.equal(contact.routing.send.property, 'contact');
		assert.equal(activityStatus.type, 'options');
		assert.notEqual(activityStatus.type, 'resourceLocator');
		assert.equal(activityStatus.modes, undefined);
		assert.equal(activityStatus.default, 0);
		assert.deepEqual(
			activityStatus.options.map((option) => option.value),
			[0, 1, 2],
		);
		assert.equal(activityStatus.routing.send.type, 'query');
		assert.equal(activityStatus.routing.send.property, 'status');
		assert.equal(activityStatus.routing.send.value, '={{ $value ? $value : undefined }}');
		assert.equal(statusId.type, 'resourceLocator');
		assert.equal(statusId.modes[0].typeOptions.searchListMethod, 'searchOpportunityStatuses');
		assert.equal(statusId.typeOptions, undefined);
		assert.equal(statusId.routing.send.type, 'query');
		assert.equal(statusId.routing.send.property, 'status_id');
		assert.equal(service.type, 'number');
		assert.equal(service.modes, undefined);
		assert.equal(service.routing.send.type, 'query');
		assert.equal(service.routing.send.property, 'service');
		assert.equal(lastFollowUpdateFrom.placeholder, 'YYYY-MM-DD');
		assert.equal(lastFollowUpdateFrom.routing.send.property, 'last_follow_update_from');
		assert.equal(lastFollowUpdateTo.placeholder, 'YYYY-MM-DD');
		assert.equal(lastFollowUpdateTo.routing.send.property, 'last_follow_update_to');

		assert.equal(get.routing.request.method, 'GET');
		assert.equal(get.routing.request.url, '=/opportunities/{{$parameter.opportunityId}}');
		assert.deepEqual(get.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.deepEqual(
			getFields.map((property) => property.name),
			['opportunityId'],
		);
		assert.equal(named(getFields, 'opportunityId').required, true);
		assert.equal(named(getFields, 'opportunityId').routing, undefined);
		assert.doesNotMatch(JSON.stringify(properties), /opportunity_code/);

		assert.equal(create.routing.request.method, 'POST');
		assert.equal(create.routing.request.url, '/opportunities');
		assert.equal(create.routing.request.headers['Content-Type'], 'application/x-www-form-urlencoded');
		assert.equal(create.routing.output, undefined);

		const date = named(createFields, 'date');
		const comment = named(createFields, 'comment');
		const createService = named(createFields, 'service');
		const createContact = named(createFields, 'contact');
		const propertyCode = named(createFields, 'property');
		const value = named(createFields, 'value');
		const assertBody = (property, apiName) => {
			assert.equal(property.routing.send.type, 'body');
			assert.equal(property.routing.send.property, apiName);
			assert.notEqual(property.routing.send.type, 'query');
		};

		assert.equal(date.required, true);
		assert.equal(date.placeholder, 'yyyy-mm-dd hh:mm:ss');
		assertBody(date, 'date');
		assert.equal(comment.required, true);
		assertBody(comment, 'comment');
		assert.equal(createService.required, true);
		assert.equal(createService.type, 'number');
		assert.equal(createService.modes, undefined);
		assertBody(createService, 'service');
		assert.equal(createContact.required, undefined);
		assert.equal(createContact.type, 'number');
		assert.equal(createContact.modes, undefined);
		assertBody(createContact, 'contact');
		assert.equal(propertyCode.type, 'string');
		assert.notEqual(propertyCode.required, true);
		assertBody(propertyCode, 'property');
		assert.equal(value.type, 'number');
		assert.notEqual(value.required, true);
		assertBody(value, 'value');

		for (const property of [...searchFields, ...getFields, ...createFields]) {
			assert.deepEqual(property.displayOptions.show.resource, ['opportunity']);
			assert.equal(property.displayOptions.show.operation.length, 1);
		}

		const searchNames = new Set(searchFields.map((property) => property.name));
		const getNames = new Set(getFields.map((property) => property.name));
		const createNames = new Set(createFields.map((property) => property.name));
		for (const name of ['activityStatus', 'statusId', 'lastFollowUpdateFrom', 'lastFollowUpdateTo']) {
			assert.equal(getNames.has(name), false, name);
			assert.equal(createNames.has(name), false, name);
		}
		for (const name of ['date', 'comment', 'property', 'value', 'opportunityId']) {
			assert.equal(searchNames.has(name), false, name);
		}
		for (const name of [
			'meetingId',
			'meetingType',
			'notes',
			'dateType',
			'verify',
			'profile',
			'broker',
			'place',
			'branch',
			'name',
			'altCode',
		]) {
			assert.equal(searchNames.has(name), false, name);
			assert.equal(getNames.has(name), false, name);
			assert.equal(createNames.has(name), false, name);
		}
		assert.equal(
			[...searchFields, ...getFields, ...createFields].some(
				(property) => property.modes?.[0]?.typeOptions?.searchListMethod === 'searchProfiles',
			),
			false,
		);

		assert.deepEqual(named(searchFields, 'service').displayOptions.show.operation, ['search']);
		assert.deepEqual(createService.displayOptions.show.operation, ['create']);
		assert.notEqual(named(searchFields, 'service'), createService);
		assert.deepEqual(named(searchFields, 'contact').displayOptions.show.operation, ['search']);
		assert.deepEqual(createContact.displayOptions.show.operation, ['create']);
	});

	it('loads opportunity statuses from GET /opportunities/status without a query', async () => {
		const { context, requests } = createListSearchContext({
			data: [{ code: 3858, name: 'Contacto Inicial', service_id: 1, status: 1 }],
			parameters: { status: { mode: 'list', value: '1' }, service: 3, activityStatus: 1 },
		});

		const result = await searchOpportunityStatuses.call(context, 'contacto');

		assert.deepEqual(result, { results: [{ name: 'Contacto Inicial', value: '3858' }] });
		assert.equal(requests[0].credentialName, 'domusCrmApi');
		assert.equal(requests[0].options.baseURL, 'https://apind.domus.la');
		assert.equal(requests[0].options.url, '/opportunities/status');
		assert.equal(requests[0].options.method, 'GET');
		assert.equal(requests[0].options.qs, undefined);
		assert.equal(requests[0].options.headers.Authorization, undefined);
	});
});

describe('Domus CRM profile node', () => {
	const fieldsFor = (properties, operation) =>
		properties.filter(
			(property) =>
				property.displayOptions?.show?.resource?.includes('profile') &&
				property.displayOptions?.show?.operation?.includes(operation),
		);

	const operationFor = (node, resource) =>
		node.description.properties.find(
			(property) =>
				property.name === 'operation' && property.displayOptions?.show?.resource?.includes(resource),
		);

	it('routes Profile Search to GET /profiles and keeps Meeting and Opportunity operations', () => {
		const domus = new Domus();
		const node = new DomusCrm();
		const properties = node.description.properties;
		const domusResource = getProperty(domus.description.properties, 'resource');
		const meeting = operationFor(node, 'meeting');
		const opportunity = operationFor(node, 'opportunity');
		const operation = operationFor(node, 'profile');
		const search = operation.options.find((option) => option.value === 'search');
		const searchFields = fieldsFor(properties, 'search');
		const named = (name) => searchFields.find((property) => property.name === name);
		const branch = named('branch');
		const name = named('name');
		const altCode = named('altCode');

		assert.deepEqual(
			domusResource.options.map((option) => option.value),
			['acquisition', 'advisor', 'owner', 'project', 'property'],
		);
		assert.deepEqual(
			meeting.options.map((option) => option.value),
			['search', 'get', 'create', 'update', 'confirm'],
		);
		assert.deepEqual(
			opportunity.options.map((option) => option.value),
			['search', 'get', 'create'],
		);
		assert.deepEqual(
			operation.options.map((option) => option.value),
			['search'],
		);
		assert.equal(search.routing.request.method, 'GET');
		assert.equal(search.routing.request.url, '/profiles');
		assert.deepEqual(search.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.equal(search.routing.operations, undefined);
		assert.equal(getProperty(properties, 'returnAll'), undefined);
		assert.doesNotMatch(JSON.stringify(search.routing), /page|Perpage|user_code/);
		assert.doesNotMatch(JSON.stringify(operation.options), /\/profiles\//);

		assert.deepEqual(
			searchFields.map((property) => property.name),
			['branch', 'name', 'altCode'],
		);
		assert.equal(branch.type, 'number');
		assert.equal(branch.modes, undefined);
		assert.notEqual(branch.type, 'resourceLocator');
		assert.equal(branch.required, undefined);
		assert.equal(branch.routing.send.type, 'query');
		assert.equal(branch.routing.send.property, 'branch');
		assert.equal(branch.routing.send.value, '={{ $value ? $value : undefined }}');
		assert.equal(name.type, 'string');
		assert.equal(name.modes, undefined);
		assert.equal(name.routing.send.type, 'query');
		assert.equal(name.routing.send.property, 'name');
		assert.equal(altCode.type, 'number');
		assert.equal(altCode.modes, undefined);
		assert.notEqual(altCode.type, 'resourceLocator');
		assert.equal(altCode.routing.send.type, 'query');
		assert.equal(altCode.routing.send.property, 'alt_code');
		assert.notEqual(altCode.routing.send.property, 'code');

		for (const property of searchFields) {
			assert.deepEqual(property.displayOptions.show.resource, ['profile']);
			assert.deepEqual(property.displayOptions.show.operation, ['search']);
			assert.equal(property.displayOptions.show.resource.includes('meeting'), false);
			assert.equal(property.displayOptions.show.resource.includes('opportunity'), false);
		}

		const meetingProfile = properties.find(
			(property) =>
				property.name === 'profile' && property.displayOptions?.show?.resource?.includes('meeting'),
		);
		assert.equal(meetingProfile.type, 'resourceLocator');
		assert.equal(meetingProfile.routing.send.type, 'query');
		assert.equal(meetingProfile.routing.send.property, 'profile');
		assert.equal(meetingProfile.modes[0].typeOptions.searchListMethod, 'searchProfiles');
		assert.notEqual(meetingProfile.routing.send.property, 'user_code');
		assert.notEqual(meetingProfile.routing.send.property, 'alt_code');
	});

	it('loads profiles from GET /profiles with no query and labels them by name', async () => {
		const { context, requests } = createListSearchContext({
			data: [
				{
					code: 1,
					alt_code: 1234,
					user_code: 15,
					name: 'Advisor',
					first_name: 'Prueba',
					last_name: 'Agente CRM',
				},
				{ user_code: 8, alt_code: 90, first_name: 'No', last_name: 'Code' },
				{ code: 2, user_code: 9, first_name: '   ', last_name: '' },
			],
			parameters: { branch: 1, name: 'lopez', altCode: 90 },
		});

		const result = await searchProfiles.call(context, 'agente');

		assert.deepEqual(result, { results: [{ name: 'Prueba Agente CRM', value: '1' }] });
		assert.notEqual(result.results[0].value, '1234');
		assert.notEqual(result.results[0].value, '15');
		assert.equal(requests.length, 1);
		assert.equal(requests[0].credentialName, 'domusCrmApi');
		assert.equal(requests[0].options.method, 'GET');
		assert.equal(requests[0].options.baseURL, 'https://apind.domus.la');
		assert.equal(requests[0].options.url, '/profiles');
		assert.equal(requests[0].options.qs, undefined);
		assert.equal(requests[0].options.body, undefined);
		assert.equal(requests[0].options.headers.Authorization, undefined);

		const byMlsCode = await searchProfiles.call(context, '1234');
		assert.deepEqual(byMlsCode, { results: [] });
		assert.equal(requests[1].options.qs, undefined);
	});
});

describe('Domus CRM contact node', () => {
	const fieldsFor = (properties, operation) =>
		properties.filter(
			(property) =>
				property.displayOptions?.show?.resource?.includes('contact') &&
				property.displayOptions?.show?.operation?.includes(operation),
		);

	const operationFor = (node, resource) =>
		node.description.properties.find(
			(property) =>
				property.name === 'operation' && property.displayOptions?.show?.resource?.includes(resource),
		);

	it('routes Contact Search, Get, Create, and Update on https://api.domus.la', () => {
		const domus = new Domus();
		const node = new DomusCrm();
		const properties = node.description.properties;
		const domusResource = getProperty(domus.description.properties, 'resource');
		const meeting = operationFor(node, 'meeting');
		const opportunity = operationFor(node, 'opportunity');
		const profile = operationFor(node, 'profile');
		const operation = operationFor(node, 'contact');
		const search = operation.options.find((option) => option.value === 'search');
		const get = operation.options.find((option) => option.value === 'get');
		const create = operation.options.find((option) => option.value === 'create');
		const update = operation.options.find((option) => option.value === 'update');
		const searchFields = fieldsFor(properties, 'search');
		const getFields = fieldsFor(properties, 'get');
		const createFields = fieldsFor(properties, 'create');
		const updateFields = fieldsFor(properties, 'update');
		const named = (list, name) => list.find((property) => property.name === name);
		const assertBody = (property, apiName) => {
			assert.equal(property.routing.send.type, 'body');
			assert.equal(property.routing.send.property, apiName);
			assert.notEqual(property.routing.send.type, 'query');
		};

		assert.deepEqual(
			domusResource.options.map((option) => option.value),
			['acquisition', 'advisor', 'owner', 'project', 'property'],
		);
		assert.equal(domus.description.version, 1);
		assert.equal(node.description.version, 1);
		assert.equal(DOMUS_CRM_BASE_URL, 'https://apind.domus.la');
		assert.equal(node.description.requestDefaults.baseURL, 'https://apind.domus.la');
		assert.equal(DOMUS_CONTACTS_BASE_URL, 'https://api.domus.la');
		assert.deepEqual(
			meeting.options.map((option) => option.value),
			['search', 'get', 'create', 'update', 'confirm'],
		);
		assert.deepEqual(
			opportunity.options.map((option) => option.value),
			['search', 'get', 'create'],
		);
		assert.deepEqual(
			profile.options.map((option) => option.value),
			['search'],
		);
		assert.deepEqual(
			operation.options.map((option) => option.value),
			['search', 'get', 'create', 'update'],
		);
		assert.equal(operation.options.find((option) => option.value === 'delete'), undefined);
		assert.equal(getProperty(properties, 'returnAll'), undefined);

		assert.equal(search.routing.request.method, 'GET');
		assert.equal(search.routing.request.baseURL, 'https://api.domus.la');
		assert.equal(search.routing.request.url, '/contacts');
		assert.deepEqual(search.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.equal(search.routing.operations, undefined);
		assert.doesNotMatch(JSON.stringify(search.routing), /page|Perpage|agent_code|agent_alt_code|phone_type/);
		assert.deepEqual(
			searchFields.map((property) => property.name),
			['name', 'phone'],
		);
		const searchName = named(searchFields, 'name');
		const searchPhone = named(searchFields, 'phone');
		assert.equal(searchName.type, 'string');
		assert.equal(searchName.modes, undefined);
		assert.equal(searchName.required, undefined);
		assert.equal(searchName.routing.send.type, 'query');
		assert.equal(searchName.routing.send.property, 'name');
		assert.equal(searchPhone.type, 'string');
		assert.equal(searchPhone.modes, undefined);
		assert.equal(searchPhone.routing.send.type, 'query');
		assert.equal(searchPhone.routing.send.property, 'phone');

		assert.equal(get.routing.request.method, 'GET');
		assert.equal(get.routing.request.baseURL, 'https://api.domus.la');
		assert.equal(get.routing.request.url, '=/contacts/{{$parameter.code}}');
		assert.deepEqual(get.routing.output.postReceive, [
			{ type: 'rootProperty', properties: { property: 'data' } },
		]);
		assert.deepEqual(
			getFields.map((property) => property.name),
			['code'],
		);
		assert.equal(named(getFields, 'code').required, true);
		assert.equal(named(getFields, 'code').routing, undefined);
		assert.doesNotMatch(JSON.stringify(get.routing), /agent_code|agent_alt_code/);

		assert.equal(create.routing.request.method, 'POST');
		assert.equal(create.routing.request.baseURL, 'https://api.domus.la');
		assert.equal(create.routing.request.url, '/contacts');
		assert.equal(create.routing.request.headers['Content-Type'], 'application/x-www-form-urlencoded');
		assert.equal(create.routing.output, undefined);
		assert.equal(create.routing.send.preSend[0].name, 'requireContactEmailOrPhone');
		const createName = named(createFields, 'name');
		const source = named(createFields, 'source');
		const email = named(createFields, 'email');
		const phone = named(createFields, 'phone');
		const city = named(createFields, 'city');
		const broker = named(createFields, 'broker');
		assert.equal(createName.required, true);
		assertBody(createName, 'name');
		assert.equal(source.required, true);
		assert.equal(source.type, 'number');
		assert.equal(source.modes, undefined);
		assert.notEqual(source.type, 'resourceLocator');
		assertBody(source, 'source');
		assert.notEqual(email.required, true);
		assertBody(email, 'email');
		assert.notEqual(phone.required, true);
		assert.equal(phone.type, 'string');
		assertBody(phone, 'phone');
		assert.equal(city.type, 'number');
		assert.equal(city.modes, undefined);
		assert.notEqual(city.type, 'resourceLocator');
		assert.notEqual(city.required, true);
		assertBody(city, 'city');
		assert.equal(city.routing.send.value, '={{ $value ? $value : undefined }}');
		assert.equal(broker.type, 'number');
		assert.equal(broker.modes, undefined);
		assert.notEqual(broker.type, 'resourceLocator');
		assertBody(broker, 'broker');
		assertBody(named(createFields, 'lastName'), 'last_name');
		assert.equal(named(createFields, 'birthDate').placeholder, 'YYYY-MM-DD');
		assertBody(named(createFields, 'birthDate'), 'birthdate');
		assertBody(named(createFields, 'neighborhood'), 'neighborhood');
		assertBody(named(createFields, 'description'), 'description');
		assert.equal(
			createFields.some((property) => property.type === 'resourceLocator'),
			false,
		);
		assert.doesNotMatch(JSON.stringify(create.routing), /phone_type|agent_code|searchProfiles/);
		assert.equal(
			createFields.some((property) => String(property.name).includes('phoneType')),
			false,
		);

		assert.equal(update.routing.request.method, 'PUT');
		assert.equal(update.routing.request.baseURL, 'https://api.domus.la');
		assert.equal(update.routing.request.url, '=/contacts/{{$parameter.code}}');
		assert.equal(update.routing.request.headers['Content-Type'], 'application/x-www-form-urlencoded');
		assert.equal(update.routing.output, undefined);
		assert.equal(update.routing.send, undefined);
		assert.deepEqual(
			updateFields.map((property) => property.name),
			['code', 'name', 'email', 'description'],
		);
		assert.deepEqual(
			updateFields.filter((property) => property.routing?.send).map((property) => property.routing.send.property),
			['name', 'email', 'description'],
		);
		for (const property of updateFields.filter((candidate) => candidate.routing?.send)) {
			assert.equal(property.routing.send.type, 'body');
			assert.notEqual(property.required, true);
		}
		for (const name of ['phone', 'source', 'lastName', 'broker', 'city', 'birthDate', 'neighborhood']) {
			assert.equal(updateFields.some((property) => property.name === name), false, name);
		}

		const contactFields = [...searchFields, ...getFields, ...createFields, ...updateFields];
		for (const property of contactFields) {
			assert.deepEqual(property.displayOptions.show.resource, ['contact']);
			assert.equal(property.displayOptions.show.resource.includes('meeting'), false);
			assert.equal(property.displayOptions.show.resource.includes('opportunity'), false);
			assert.equal(property.displayOptions.show.resource.includes('profile'), false);
		}
		for (const resource of ['meeting', 'opportunity', 'profile']) {
			const foreign = properties.filter(
				(property) =>
					property.name !== 'operation' &&
					property.displayOptions?.show?.resource?.includes(resource),
			);
			for (const property of foreign) {
				assert.equal(property.displayOptions.show.resource.includes('contact'), false, property.name);
			}
		}
	});

	it('requires email when phone is empty, and phone when email is empty', async () => {
		assert.equal(hasContactEmailOrPhone('', ''), false);
		assert.equal(hasContactEmailOrPhone('   ', '  '), false);
		assert.equal(hasContactEmailOrPhone('ada@example.com', ''), true);
		assert.equal(hasContactEmailOrPhone('', '123,456'), true);
		assert.equal(CONTACT_EMAIL_OR_PHONE_MESSAGE.includes('Email'), true);

		const context = { getNode: () => ({ name: 'Domus CRM' }) };
		await assert.rejects(
			requireContactEmailOrPhone.call(context, { body: { email: '', phone: '' } }),
			(error) => {
				assert.match(error.message, /Email is required when Phone is empty/);
				return true;
			},
		);

		const withEmail = { body: { name: 'Ada', source: 1, email: 'ada@example.com' } };
		assert.equal(await requireContactEmailOrPhone.call(context, withEmail), withEmail);

		const withPhone = { body: { name: 'Ada', source: 1, phone: '123,456' } };
		assert.equal(await requireContactEmailOrPhone.call(context, withPhone), withPhone);
	});
});

describe('Domus CRM live-test guard', () => {
	it('rejects property and API 3.0 hosts', () => {
		assert.equal(helperBaseURL, 'https://apind.domus.la');
		assert.doesNotThrow(() => assertDomusCrmHost('https://apind.domus.la'));
		assert.throws(() => assertDomusCrmHost('https://newapi.domus.la'), /apind\.domus\.la/);
		assert.throws(() => assertDomusCrmHost('https://api.domus.la/3.0'), /apind\.domus\.la/);
		assert.throws(() => assertDomusCrmHost('https://api.domus.la'), /apind\.domus\.la/);
	});

	it('does not treat the property token as a CRM token', async () => {
		await withEnv(
			{
				DOMUS_CRM_TEST_TOKEN: '',
				DOMUS_TEST_TOKEN: 'property-token',
				DOMUS_CRM_TEST_BASE_URL: undefined,
			},
			async () => {
				const config = getDomusCrmTestConfig();
				assert.equal(config.hasToken, false);
				assert.equal(config.token, '');
				assert.equal(config.baseURL, 'https://apind.domus.la');

				await assert.rejects(requestDomusCrm('/meetings/types'), (error) => {
					assert.match(error.message, /DOMUS_CRM_TEST_TOKEN is not set/);
					assert.doesNotMatch(error.message, /property-token/);
					return true;
				});
			},
		);
	});

	it('rejects a CRM token copied from the property token', async () => {
		await withEnv(
			{
				DOMUS_CRM_TEST_TOKEN: 'shared-token',
				DOMUS_TEST_TOKEN: 'shared-token',
			},
			async () => {
				assert.throws(() => getDomusCrmTestConfig(), /must be different/);
			},
		);
	});

	it('refuses write methods before any request', async () => {
		await withEnv(
			{
				DOMUS_CRM_TEST_TOKEN: 'crm-test-token',
				DOMUS_CRM_TEST_WRITE: '1',
				DOMUS_TEST_TOKEN: undefined,
			},
			async () => {
				await assert.rejects(requestDomusCrm('/meetings', { method: 'POST' }), (error) => {
					assert.match(error.message, /read-only/);
					assert.doesNotMatch(error.message, /crm-test-token/);
					return true;
				});
			},
		);
	});

	it('does not treat the property write flag as permission to write meetings', async () => {
		await withEnv(
			{
				DOMUS_CRM_TEST_WRITE: undefined,
				DOMUS_TEST_WRITE: '1',
				DOMUS_CRM_TEST_TOKEN: 'crm-test-token',
				DOMUS_TEST_TOKEN: undefined,
			},
			async () => {
				assert.equal(getDomusCrmTestConfig().writeEnabled, false);
				await assert.rejects(
					requestDomusCrmWrite('/meetings', { method: 'POST', body: 'notes=n8n-e2e' }),
					(error) => {
						assert.match(error.message, /DOMUS_CRM_TEST_WRITE/);
						assert.doesNotMatch(error.message, /crm-test-token/);
						return true;
					},
				);
			},
		);
	});

	it('rejects CRM writes against property and API 3.0 hosts before any request', async () => {
		await withEnv(
			{
				DOMUS_CRM_TEST_WRITE: '1',
				DOMUS_CRM_TEST_TOKEN: 'crm-test-token',
				DOMUS_TEST_TOKEN: undefined,
				DOMUS_CRM_TEST_BASE_URL: undefined,
			},
			async () => {
				await assert.rejects(
					requestDomusCrmWrite('https://newapi.domus.la/meetings', {
						method: 'POST',
						body: 'notes=n8n-e2e',
					}),
					(error) => {
						assert.match(error.message, /apind\.domus\.la/);
						assert.doesNotMatch(error.message, /crm-test-token/);
						return true;
					},
				);
				await assert.rejects(
					requestDomusCrmWrite('https://api.domus.la/3.0/meetings', {
						method: 'PUT',
						body: 'verify=1',
					}),
					/apind\.domus\.la/,
				);
				await assert.rejects(
					requestDomusCrmWrite('/meetings/1', { method: 'DELETE' }),
					/only allow POST and PUT/,
				);
				await assert.rejects(
					requestDomusCrmWrite('/meetings?notes=n8n-e2e', { method: 'POST', body: 'notes=n8n-e2e' }),
					/form body, not the URL/,
				);
			},
		);
	});

	it('allows contact reads only against https://api.domus.la', async () => {
		assert.equal(helperContactsBaseURL, 'https://api.domus.la');
		assert.equal(DOMUS_CONTACTS_BASE_URL, helperContactsBaseURL);
		assert.doesNotThrow(() => assertDomusContactsHost('https://api.domus.la'));
		assert.throws(() => assertDomusContactsHost('https://api.domus.la/3.0'), /exactly https:\/\/api\.domus\.la/);
		assert.throws(() => assertDomusContactsHost('https://newapi.domus.la'), /exactly https:\/\/api\.domus\.la/);
		assert.throws(() => assertDomusContactsHost('https://apind.domus.la'), /exactly https:\/\/api\.domus\.la/);

		await withEnv(
			{
				DOMUS_CRM_TEST_TOKEN: '',
				DOMUS_TEST_TOKEN: 'property-token',
				DOMUS_CRM_TEST_BASE_URL: undefined,
			},
			async () => {
				await assert.rejects(requestDomusContacts('/contacts'), (error) => {
					assert.match(error.message, /DOMUS_CRM_TEST_TOKEN is not set/);
					assert.doesNotMatch(error.message, /property-token/);
					return true;
				});
				await assert.rejects(requestDomusContacts('/contacts', { method: 'POST' }), /read-only/);
				await assert.rejects(
					requestDomusContacts('https://api.domus.la/3.0/contacts'),
					/exactly https:\/\/api\.domus\.la/,
				);
				await assert.rejects(requestDomusContacts('/3.0/contacts'), /exactly https:\/\/api\.domus\.la/);
				await assert.rejects(
					requestDomusContacts('https://newapi.domus.la/contacts'),
					/exactly https:\/\/api\.domus\.la/,
				);
				await assert.rejects(
					requestDomusContacts('https://apind.domus.la/contacts'),
					/exactly https:\/\/api\.domus\.la/,
				);
			},
		);
	});

	it('does not treat the property write flag as permission to write contacts', async () => {
		await withEnv(
			{
				DOMUS_CRM_TEST_WRITE: undefined,
				DOMUS_TEST_WRITE: '1',
				DOMUS_CRM_TEST_TOKEN: 'crm-test-token',
				DOMUS_TEST_TOKEN: undefined,
				DOMUS_CRM_TEST_BASE_URL: undefined,
			},
			async () => {
				await assert.rejects(
					requestDomusContactsWrite('/contacts', {
						method: 'POST',
						body: 'name=n8n-e2e&email=n8n-e2e@example.com&source=1',
					}),
					(error) => {
						assert.match(error.message, /DOMUS_CRM_TEST_WRITE/);
						assert.doesNotMatch(error.message, /crm-test-token/);
						return true;
					},
				);
			},
		);
	});

	it('allows contact writes only against https://api.domus.la', async () => {
		await withEnv(
			{
				DOMUS_CRM_TEST_WRITE: '1',
				DOMUS_CRM_TEST_TOKEN: 'crm-test-token',
				DOMUS_TEST_TOKEN: undefined,
				DOMUS_CRM_TEST_BASE_URL: undefined,
			},
			async () => {
				await assert.rejects(
					requestDomusContactsWrite('https://apind.domus.la/contacts', {
						method: 'POST',
						body: 'name=n8n-e2e',
					}),
					(error) => {
						assert.match(error.message, /exactly https:\/\/api\.domus\.la/);
						assert.doesNotMatch(error.message, /crm-test-token/);
						return true;
					},
				);
				await assert.rejects(
					requestDomusContactsWrite('https://newapi.domus.la/contacts', {
						method: 'POST',
						body: 'name=n8n-e2e',
					}),
					/exactly https:\/\/api\.domus\.la/,
				);
				await assert.rejects(
					requestDomusContactsWrite('https://api.domus.la/3.0/contacts', {
						method: 'PUT',
						body: 'name=n8n-e2e',
					}),
					/exactly https:\/\/api\.domus\.la/,
				);
				await assert.rejects(
					requestDomusContactsWrite('/contacts/1', { method: 'DELETE' }),
					/only allow POST and PUT/,
				);
				await assert.rejects(
					requestDomusContactsWrite('/contacts?name=n8n-e2e', {
						method: 'POST',
						body: 'name=n8n-e2e',
					}),
					/form body, not the URL/,
				);
			},
		);
	});
});
