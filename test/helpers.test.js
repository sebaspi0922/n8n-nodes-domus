const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const {
	assertDomusContactsHost,
	assertDomusCrmHost,
	assertOfficialWriteHost,
	assertTestingHost,
	redactSecret,
} = require('./helpers/env');

describe('live-test safety helpers', () => {
	it('refuses the Domus production host', () => {
		assert.throws(
			() => assertTestingHost('https://api.domus.la/3.0'),
			/production/,
		);
	});

	it('accepts the official testing host', () => {
		assert.doesNotThrow(() => assertTestingHost('https://newapi.domus.la'));
	});

	it('redacts tokens from error text', () => {
		assert.equal(redactSecret('Authorization: secret-token', 'secret-token'), 'Authorization: [redacted]');
	});

	it('allows write tests only against the exact official testing URL', () => {
		assert.doesNotThrow(() => assertOfficialWriteHost('https://newapi.domus.la'));
		assert.doesNotThrow(() => assertOfficialWriteHost('https://newapi.domus.la/'));
	});

	it('allows Domus contact tests only against https://api.domus.la', () => {
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

	it('allows Domus CRM tests only against https://apind.domus.la', () => {
		assert.doesNotThrow(() => assertDomusCrmHost('https://apind.domus.la'));
		assert.throws(
			() => assertDomusCrmHost('https://newapi.domus.la'),
			/exactly https:\/\/apind\.domus\.la/,
		);
		assert.throws(
			() => assertDomusCrmHost('https://api.domus.la/3.0'),
			/exactly https:\/\/apind\.domus\.la/,
		);
	});

	it('fails write tests immediately for any other host, including production', () => {
		for (const baseURL of [
			'https://api.domus.la/3.0',
			'https://api.domus.la',
			'http://newapi.domus.la',
			'https://newapi.domus.la/3.0',
			'https://example.com',
		]) {
			assert.throws(
				() => assertOfficialWriteHost(baseURL),
				/exactly https:\/\/newapi\.domus\.la/,
			);
		}
	});
});
