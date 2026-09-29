const {
	DOMUS_CONTACTS_BASE_URL,
	assertDomusContactsHost,
	assertDomusContactsRequestUrl,
	getDomusCrmTestConfig,
	redactSecret,
} = require('./env');

const jsonHeaders = {
	Accept: 'application/json',
};

const requestDomusContacts = async (path, { method = 'GET', query } = {}) => {
	const methodName = String(method || 'GET').toUpperCase();
	if (methodName !== 'GET') {
		throw new Error('Domus contact read tests are read-only');
	}

	assertDomusContactsHost(DOMUS_CONTACTS_BASE_URL);

	const url = new URL(path, `${DOMUS_CONTACTS_BASE_URL}/`);
	assertDomusContactsRequestUrl(url);

	const config = getDomusCrmTestConfig();
	if (!config.hasToken) {
		throw new Error('DOMUS_CRM_TEST_TOKEN is not set');
	}

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
	requestDomusContacts,
};
