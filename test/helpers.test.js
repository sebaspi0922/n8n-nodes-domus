const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { assertOfficialWriteHost, assertTestingHost, redactSecret } = require('./helpers/env');

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
