const { assertDomusCrmHost, getDomusCrmTestConfig, redactSecret } = require('./env');

const jsonHeaders = {
	Accept: 'application/json',
};

const requestDomusCrm = async (path, { method = 'GET', query } = {}) => {
	const methodName = String(method || 'GET').toUpperCase();
	if (methodName !== 'GET') {
		throw new Error('Domus CRM tests are read-only');
	}

	const config = getDomusCrmTestConfig();
	assertDomusCrmHost(config.baseURL);

	if (!config.hasToken) {
		throw new Error('DOMUS_CRM_TEST_TOKEN is not set');
	}

	const url = new URL(path, `${config.baseURL}/`);
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
			method: methodName,
			headers: {
				...jsonHeaders,
				Authorization: config.token,
			},
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
	requestDomusCrm,
};
