const {
	DOMUS_CONTACTS_BASE_URL,
	assertDomusContactsHost,
	assertDomusContactsRequestUrl,
	getDomusCrmTestConfig,
	readEnv,
	redactSecret,
} = require('./env');

const ALLOWED_METHODS = new Set(['POST', 'PUT']);

const requestDomusContactsWrite = async (path, { method, body } = {}) => {
	const methodName = String(method || '').toUpperCase();
	if (!ALLOWED_METHODS.has(methodName)) {
		throw new Error('Domus contact write tests only allow POST and PUT');
	}

	if (String(path).includes('?')) {
		throw new Error('Domus contact write tests send fields in the form body, not the URL');
	}

	if (readEnv('DOMUS_CRM_TEST_WRITE') !== '1') {
		throw new Error('Set DOMUS_CRM_TEST_WRITE=1 to run Domus contact write tests');
	}

	assertDomusContactsHost(DOMUS_CONTACTS_BASE_URL);

	const url = new URL(path, `${DOMUS_CONTACTS_BASE_URL}/`);
	assertDomusContactsRequestUrl(url);
	if (url.search) {
		throw new Error('Domus contact write tests send fields in the form body, not the URL');
	}

	const config = getDomusCrmTestConfig();
	if (!config.hasToken) {
		throw new Error('DOMUS_CRM_TEST_TOKEN is not set');
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
	requestDomusContactsWrite,
};
