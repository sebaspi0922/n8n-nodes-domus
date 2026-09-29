const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { requestDomusContactsWrite } = require('../helpers/domus-contacts-write-http');
const { requestDomusCrm } = require('../helpers/domus-crm-http');
const { requestDomusCrmWrite } = require('../helpers/domus-crm-write-http');
const {
	DOMUS_CONTACTS_BASE_URL,
	assertDomusContactsHost,
	assertDomusCrmHost,
	getDomusCrmTestConfig,
	readEnv,
} = require('../helpers/env');

const formatDateTime = (date) => {
	const pad = (value) => String(value).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const listRows = (payload) => (Array.isArray(payload?.data) ? payload.data : []);

const firstCodedRow = (rows) => rows.find((row) => row && row.code !== undefined && row.code !== null);

describe('Domus CRM write host guard', () => {
	it('allows only https://apind.domus.la', () => {
		assert.doesNotThrow(() => assertDomusCrmHost('https://apind.domus.la'));
		assert.throws(() => assertDomusCrmHost('https://newapi.domus.la'), /exactly https:\/\/apind\.domus\.la/);
		assert.throws(
			() => assertDomusCrmHost('https://api.domus.la/3.0'),
			/exactly https:\/\/apind\.domus\.la/,
		);
	});
});

const config = getDomusCrmTestConfig();

if (config.writeEnabled) {
	assertDomusCrmHost(config.baseURL);
}

const skipWithoutWrite = !config.hasToken
	? 'Set DOMUS_CRM_TEST_TOKEN to run Domus CRM write tests against https://apind.domus.la'
	: !config.writeEnabled
		? 'Set DOMUS_CRM_TEST_WRITE=1 on a manual run to execute CRM meeting writes'
		: false;

describe('Domus CRM meeting writes (manual opt-in)', { skip: skipWithoutWrite }, () => {
	it('creates, updates, and confirms a meeting when explicitly enabled', async () => {
		assertDomusCrmHost(config.baseURL);

		const types = await requestDomusCrm('/meetings/types');
		const dateType = firstCodedRow(listRows(types.data));
		assert.ok(dateType, 'Meeting create needs a type from GET /meetings/types');

		const statuses = await requestDomusCrm('/meetings/status');
		const statusRows = listRows(statuses.data);
		let status;
		let result;
		for (const candidate of statusRows) {
			if (!candidate || candidate.code === undefined || candidate.code === null) continue;
			const results = await requestDomusCrm('/meetings/results', {
				query: { status: candidate.code },
			});
			const match = firstCodedRow(listRows(results.data));
			if (match) {
				status = candidate;
				result = match;
				break;
			}
		}
		assert.ok(status && result, 'Meeting update needs a status that returns at least one result');

		const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
		start.setHours(10, 0, 0, 0);
		const finish = new Date(start.getTime() + 30 * 60 * 1000);
		const notes = `n8n-e2e-${Date.now()}`;
		const params = {
			start_date: formatDateTime(start),
			finish_date: formatDateTime(finish),
			notes,
			date_type: String(dateType.code),
			place: 'n8n-e2e',
		};
		const contactId = readEnv('DOMUS_CRM_TEST_CONTACT_ID');
		if (contactId) params.contact = contactId;

		assert.match(params.notes, /^n8n-e2e-/);
		assert.match(params.start_date, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
		assert.match(params.finish_date, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

		const body = new URLSearchParams(params).toString();
		assert.match(body, /(?:^|&)notes=n8n-e2e-/);
		assert.match(body, /(?:^|&)place=n8n-e2e(?:&|$)/);
		assert.doesNotMatch(body, /(?:^|&)codpro=/);
		if (contactId) assert.match(body, /(?:^|&)contact=/);
		else assert.doesNotMatch(body, /(?:^|&)contact=/);

		const create = await requestDomusCrmWrite('/meetings', {
			method: 'POST',
			body,
		});
		assert.equal(create.ok, true, `POST /meetings returned HTTP ${create.status}`);
		assert.equal(Array.isArray(create.data?.data), false);
		const meetingId = create.data?.id;
		assert.ok(meetingId !== undefined && meetingId !== null);

		const update = await requestDomusCrmWrite(`/meetings/${meetingId}`, {
			method: 'PUT',
			body: new URLSearchParams({
				status: String(status.code),
				result: String(result.code),
			}).toString(),
		});
		assert.equal(update.ok, true, `PUT /meetings/{meeting_id} returned HTTP ${update.status}`);

		const confirm = await requestDomusCrmWrite(`/meetings/verify/${meetingId}`, {
			method: 'PUT',
			body: new URLSearchParams({ verify: '1' }).toString(),
		});
		assert.equal(confirm.ok, true, `PUT /meetings/verify/{meeting_id} returned HTTP ${confirm.status}`);
		assert.equal(typeof confirm.data?.message, 'string');
		assert.equal(Array.isArray(confirm.data?.data), false);
	});

	it('creates an opportunity when explicitly enabled', async (t) => {
		assertDomusCrmHost(config.baseURL);

		const statuses = await requestDomusCrm('/opportunities/status');
		assert.equal(
			statuses.status,
			200,
			`GET /opportunities/status returned HTTP ${statuses.status}`,
		);
		const serviceId = listRows(statuses.data)[0]?.service_id;
		if (serviceId === undefined || serviceId === null || serviceId === '') {
			t.skip('Opportunity create needs service_id on the first GET /opportunities/status row');
			return;
		}

		const comment = `n8n-e2e-${Date.now()}`;
		const params = {
			date: formatDateTime(new Date()),
			comment,
			service: String(serviceId),
		};
		const contactId = readEnv('DOMUS_CRM_TEST_CONTACT_ID');
		if (contactId) params.contact = contactId;

		assert.match(params.comment, /^n8n-e2e-/);
		assert.match(params.date, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

		const body = new URLSearchParams(params).toString();
		assert.match(body, /(?:^|&)comment=n8n-e2e-/);
		assert.match(body, /(?:^|&)service=/);
		assert.doesNotMatch(body, /(?:^|&)property=/);
		if (contactId) assert.match(body, /(?:^|&)contact=/);
		else assert.doesNotMatch(body, /(?:^|&)contact=/);

		const create = await requestDomusCrmWrite('/opportunities', {
			method: 'POST',
			body,
		});
		assert.equal(create.ok, true, `POST /opportunities returned HTTP ${create.status}`);
		assert.equal(Array.isArray(create.data?.data), false);
		const opportunityId = create.data?.opportunity_id;
		assert.ok(opportunityId !== undefined && opportunityId !== null);
	});

	it('creates and updates a contact when a source id is configured', async (t) => {
		const sourceId = readEnv('DOMUS_CRM_TEST_SOURCE_ID');
		if (!sourceId) {
			t.skip('Set DOMUS_CRM_TEST_SOURCE_ID to create a contact on https://api.domus.la');
			return;
		}

		assertDomusContactsHost(DOMUS_CONTACTS_BASE_URL);
		const name = `n8n-e2e-${Date.now()}`;
		const email = `${name}@example.com`;
		const params = { name, email, source: sourceId };
		assert.match(params.name, /^n8n-e2e-/);
		assert.equal(params.phone, undefined);

		const body = new URLSearchParams(params).toString();
		assert.match(body, /(?:^|&)name=n8n-e2e-/);
		assert.match(body, /(?:^|&)email=/);
		assert.match(body, /(?:^|&)source=/);
		assert.doesNotMatch(body, /(?:^|&)phone=/);

		const create = await requestDomusContactsWrite('/contacts', {
			method: 'POST',
			body,
		});
		assert.equal(create.ok, true, `POST /contacts returned HTTP ${create.status}`);
		assert.equal(Array.isArray(create.data?.data), false);
		const code = create.data?.code;
		assert.ok(code !== undefined && code !== null);

		const update = await requestDomusContactsWrite(`/contacts/${code}`, {
			method: 'PUT',
			body: new URLSearchParams({
				description: `n8n-e2e-${Date.now()}`,
			}).toString(),
		});
		assert.equal(update.ok, true, `PUT /contacts/{code} returned HTTP ${update.status}`);
		assert.equal(Array.isArray(update.data?.data), false);
		assert.ok(update.data?.code !== undefined && update.data?.code !== null);
	});
});
