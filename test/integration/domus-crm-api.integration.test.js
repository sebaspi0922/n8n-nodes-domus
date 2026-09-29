const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { requestDomusContacts } = require('../helpers/domus-contacts-http');
const { requestDomusCrm } = require('../helpers/domus-crm-http');
const {
	DOMUS_CONTACTS_BASE_URL,
	DOMUS_CRM_BASE_URL,
	assertDomusContactsHost,
	assertDomusCrmHost,
	getDomusCrmTestConfig,
} = require('../helpers/env');

const singleDay = () => {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${month}-${day}`;
};

const listRows = (payload) => (Array.isArray(payload?.data) ? payload.data : undefined);

describe('Domus contact host guard', () => {
	it('allows only https://api.domus.la', () => {
		assert.equal(DOMUS_CONTACTS_BASE_URL, 'https://api.domus.la');
		assert.doesNotThrow(() => assertDomusContactsHost('https://api.domus.la'));
		assert.throws(
			() => assertDomusContactsHost('https://api.domus.la/3.0'),
			/exactly https:\/\/api\.domus\.la/,
		);
		assert.throws(
			() => assertDomusContactsHost('https://newapi.domus.la'),
			/exactly https:\/\/api\.domus\.la/,
		);
		assert.throws(
			() => assertDomusContactsHost('https://apind.domus.la'),
			/exactly https:\/\/api\.domus\.la/,
		);
	});
});

describe('Domus CRM host guard', () => {
	it('allows only https://apind.domus.la', () => {
		assert.equal(DOMUS_CRM_BASE_URL, 'https://apind.domus.la');
		assert.doesNotThrow(() => assertDomusCrmHost('https://apind.domus.la'));
		assert.throws(() => assertDomusCrmHost('https://newapi.domus.la'), /exactly https:\/\/apind\.domus\.la/);
		assert.throws(
			() => assertDomusCrmHost('https://api.domus.la/3.0'),
			/exactly https:\/\/apind\.domus\.la/,
		);
	});
});

const config = getDomusCrmTestConfig();

const skipWithoutToken = !config.hasToken
	? 'Set DOMUS_CRM_TEST_TOKEN to run Domus CRM contract tests against https://apind.domus.la'
	: false;

describe('Domus CRM API contract', { skip: skipWithoutToken }, () => {
	it('returns meeting types used by the type selector', async () => {
		const response = await requestDomusCrm('/meetings/types');

		assert.equal(response.status, 200, `GET /meetings/types returned HTTP ${response.status}`);
		const rows = listRows(response.data);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		assert.ok(rows[0].code !== undefined);
		assert.equal(typeof rows[0].name, 'string');
	});

	it('returns meeting statuses', async () => {
		const response = await requestDomusCrm('/meetings/status');

		assert.equal(response.status, 200, `GET /meetings/status returned HTTP ${response.status}`);
		const rows = listRows(response.data);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		assert.ok(rows[0].code !== undefined);
		assert.equal(typeof rows[0].name, 'string');
	});

	it('returns meeting results', async () => {
		const response = await requestDomusCrm('/meetings/results');

		assert.equal(response.status, 200, `GET /meetings/results returned HTTP ${response.status}`);
		const rows = listRows(response.data);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		assert.ok(rows[0].code !== undefined);
		assert.equal(typeof rows[0].name, 'string');
	});

	it('returns a one-day meeting list and fetches a discovered meeting', async () => {
		const day = singleDay();
		const response = await requestDomusCrm('/meetings', {
			query: { start_date: day, end_date: day },
		});

		assert.equal(response.status, 200, `GET /meetings returned HTTP ${response.status}`);
		const rows = listRows(response.data);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		const meeting = rows.find((row) => row && row.meeting_id !== undefined && row.meeting_id !== null);
		assert.ok(meeting, 'A listed meeting must include meeting_id');

		const detail = await requestDomusCrm(`/meetings/${meeting.meeting_id}`);
		assert.equal(detail.status, 200, `GET /meetings/{meeting_id} returned HTTP ${detail.status}`);

		const detailRows = listRows(detail.data);
		const detailMeeting = Array.isArray(detailRows) ? detailRows[0] : detail.data?.data;
		assert.ok(detailMeeting);
		assert.ok(detailMeeting.meeting_id !== undefined);
		assert.equal(String(detailMeeting.meeting_id), String(meeting.meeting_id));
	});

	it('returns opportunity statuses used by the status selector', async () => {
		const response = await requestDomusCrm('/opportunities/status');

		assert.equal(response.status, 200, `GET /opportunities/status returned HTTP ${response.status}`);
		const rows = listRows(response.data);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		assert.ok(rows[0].code !== undefined);
		assert.equal(typeof rows[0].name, 'string');
	});

	it('returns an opportunity list and fetches a discovered opportunity', async () => {
		const response = await requestDomusCrm('/opportunities');

		assert.equal(response.status, 200, `GET /opportunities returned HTTP ${response.status}`);
		const rows = listRows(response.data);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		const opportunity = rows.find(
			(row) => row && row.opportunity_id !== undefined && row.opportunity_id !== null,
		);
		assert.ok(opportunity, 'A listed opportunity must include opportunity_id');

		const detail = await requestDomusCrm(`/opportunities/${opportunity.opportunity_id}`);
		assert.equal(
			detail.status,
			200,
			`GET /opportunities/{opportunity_id} returned HTTP ${detail.status}`,
		);

		const detailRows = listRows(detail.data);
		const detailOpportunity = Array.isArray(detailRows) ? detailRows[0] : undefined;
		assert.ok(detailOpportunity);
		assert.ok(detailOpportunity.opportunity_id !== undefined);
		assert.equal(String(detailOpportunity.opportunity_id), String(opportunity.opportunity_id));
		if (detailOpportunity.followings !== undefined) {
			assert.ok(Array.isArray(detailOpportunity.followings));
		}
	});

	it('returns a profile list and asserts code when a row exists', async () => {
		const response = await requestDomusCrm('/profiles');

		assert.equal(response.status, 200, `GET /profiles returned HTTP ${response.status}`);
		const rows = listRows(response.data);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		assert.ok(rows[0].code !== undefined && rows[0].code !== null);
	});
});

const skipContactsWithoutToken = !config.hasToken
	? 'Set DOMUS_CRM_TEST_TOKEN to run Domus contact contract tests against https://api.domus.la'
	: false;

describe('Domus contact API contract', { skip: skipContactsWithoutToken }, () => {
	it('returns a contact list and fetches a discovered contact', async () => {
		const response = await requestDomusContacts('/contacts');

		assert.equal(response.status, 200, `GET /contacts returned HTTP ${response.status}`);
		const rows = listRows(response.data);
		assert.ok(Array.isArray(rows));
		if (rows.length === 0) return;

		const contact = rows.find((row) => row && row.code !== undefined && row.code !== null);
		assert.ok(contact, 'A listed contact must include code');

		const detail = await requestDomusContacts(`/contacts/${contact.code}`);
		assert.equal(detail.status, 200, `GET /contacts/{code} returned HTTP ${detail.status}`);

		const detailRows = listRows(detail.data);
		const detailContact = Array.isArray(detailRows) ? detailRows[0] : undefined;
		assert.ok(detailContact);
		assert.ok(detailContact.code !== undefined);
		assert.equal(String(detailContact.code), String(contact.code));
	});
});
