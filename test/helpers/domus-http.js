const { assertOfficialWriteHost, assertTestingHost, getDomusTestConfig, redactSecret } = require('./env');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const jsonHeaders = {
	Accept: 'application/json',
};

const requestDomus = async (path, { method = 'GET', headers = {}, query, body } = {}) => {
	const config = getDomusTestConfig();
	const methodName = String(method || 'GET').toUpperCase();
	if (MUTATING_METHODS.has(methodName)) {
		assertOfficialWriteHost(config.baseURL);
	} else {
		assertTestingHost(config.baseURL);
	}

	if (!config.hasToken) {
		throw new Error('DOMUS_TEST_TOKEN is not set');
	}

	const url = new URL(path, `${config.baseURL.replace(/\/$/, '')}/`);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined && value !== '') {
				url.searchParams.set(key, String(value));
			}
		}
	}

	let response;
	try {
		response = await fetch(url, {
			method,
			headers: {
				...jsonHeaders,
				Authorization: config.token,
				...headers,
			},
			body,
		});
	} catch (error) {
		error.message = redactSecret(error.message, config.token);
		throw error;
	}

	const text = redactSecret(await response.text(), config.token);
	let data;
	try {
		data = text ? JSON.parse(text) : null;
	} catch {
		data = text;
	}

	return {
		ok: response.ok,
		status: response.status,
		data,
	};
};

module.exports = {
	requestDomus,
};
