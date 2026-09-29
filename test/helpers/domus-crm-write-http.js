const { assertDomusCrmHost, getDomusCrmTestConfig, readEnv, redactSecret } = require('./env');

const ALLOWED_METHODS = new Set(['POST', 'PUT']);

const requestDomusCrmWrite = async (path, { method, body } = {}) => {
	const methodName = String(method || '').toUpperCase();
	if (!ALLOWED_METHODS.has(methodName)) {
		throw new Error('Domus CRM write tests only allow POST and PUT');
	}

	if (String(path).includes('?')) {
		throw new Error('Domus CRM write tests send fields in the form body, not the URL');
	}

	if (readEnv('DOMUS_CRM_TEST_WRITE') !== '1') {
		throw new Error('Set DOMUS_CRM_TEST_WRITE=1 to run Domus CRM write tests');
	}

	const config = getDomusCrmTestConfig();
	assertDomusCrmHost(config.baseURL);

	if (!config.hasToken) {
		throw new Error('DOMUS_CRM_TEST_TOKEN is not set');
	}

	const url = new URL(path, `${config.baseURL}/`);
	const origin = `${url.protocol}//${url.host}`;
	if (origin !== 'https://apind.domus.la' || url.username || url.password || url.search) {
		throw new Error('Refusing Domus CRM tests: host must be exactly https://apind.domus.la');
	}

	let response;
	try {
		response = await fetch(url, {
			method: methodName,
			headers: {
				Accept: 'application/json',
				Authorization: config.token,
				'Content-Type': 'application/x-www-form-urlencoded',
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
	requestDomusCrmWrite,
};
