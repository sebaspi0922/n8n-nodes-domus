const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const DOMUS_PRODUCTION_HOST = 'api.domus.la';
const DOMUS_OFFICIAL_WRITE_BASE_URL = 'https://newapi.domus.la';

const loadLocalEnv = (fileName = '.env') => {
	const envPath = resolve(process.cwd(), fileName);
	if (!existsSync(envPath)) return;

	for (const rawLine of readFileSync(envPath, 'utf8').split('\n')) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		const separator = line.indexOf('=');
		if (separator === -1) continue;

		const key = line.slice(0, separator).trim();
		let value = line.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		if (key && process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
};

loadLocalEnv();

const readEnv = (name) => {
	const value = process.env[name];
	return typeof value === 'string' ? value.trim() : '';
};

const redactSecret = (value, secret) => {
	if (!secret) return String(value);
	return String(value).split(secret).join('[redacted]');
};

const getDomusTestConfig = () => {
	const token = readEnv('DOMUS_TEST_TOKEN');
	const baseURL = readEnv('DOMUS_TEST_BASE_URL') || 'https://newapi.domus.la';
	const writeEnabled = readEnv('DOMUS_TEST_WRITE') === '1';
	const propertyCode = readEnv('DOMUS_TEST_PROPERTY_CODE');

	return {
		token,
		baseURL,
		writeEnabled,
		propertyCode,
		hasToken: token.length > 0,
	};
};

const normalizeDomusBaseURL = (baseURL) => {
	const url = new URL(baseURL);
	if (url.username || url.password || url.search || url.hash) {
		throw new Error('DOMUS_TEST_BASE_URL must not include credentials, query, or hash');
	}
	if (url.pathname && url.pathname !== '/') {
		throw new Error('DOMUS_TEST_BASE_URL must not include a path');
	}
	return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
};

const assertTestingHost = (baseURL) => {
	let hostname = '';
	try {
		hostname = new URL(baseURL).hostname;
	} catch {
		throw new Error(`Invalid DOMUS_TEST_BASE_URL: ${baseURL}`);
	}

	if (hostname === DOMUS_PRODUCTION_HOST) {
		throw new Error('Refusing to run live tests against Domus production');
	}
};

const assertOfficialWriteHost = (baseURL) => {
	let normalized = '';
	try {
		normalized = normalizeDomusBaseURL(baseURL);
	} catch {
		throw new Error(
			`Refusing write tests: host must be exactly ${DOMUS_OFFICIAL_WRITE_BASE_URL}`,
		);
	}

	if (normalized !== DOMUS_OFFICIAL_WRITE_BASE_URL) {
		throw new Error(
			`Refusing write tests: host must be exactly ${DOMUS_OFFICIAL_WRITE_BASE_URL}`,
		);
	}
};

const getN8nTestConfig = () => {
	const baseURL = readEnv('N8N_BASE_URL') || 'http://127.0.0.1:5680';
	return {
		baseURL,
		email: readEnv('N8N_E2E_EMAIL') || 'e2e@n8n-nodes-domus.local',
		password: readEnv('N8N_E2E_PASSWORD') || 'DomusE2ePass1!',
		firstName: readEnv('N8N_E2E_FIRST_NAME') || 'E2E',
		lastName: readEnv('N8N_E2E_LAST_NAME') || 'Domus',
	};
};

module.exports = {
	DOMUS_OFFICIAL_WRITE_BASE_URL,
	assertOfficialWriteHost,
	assertTestingHost,
	getDomusTestConfig,
	getN8nTestConfig,
	readEnv,
	redactSecret,
};
