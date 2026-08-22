const { getN8nTestConfig } = require('./env');

const joinURL = (baseURL, path) => new URL(path, `${baseURL.replace(/\/$/, '')}/`);

const parseJson = async (response) => {
	const text = await response.text();
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
};

const createN8nClient = (baseURL = getN8nTestConfig().baseURL) => {
	const cookies = new Map();

	const cookieHeader = () =>
		[...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');

	const storeCookies = (response) => {
		const header = typeof response.headers.getSetCookie === 'function'
			? response.headers.getSetCookie()
			: [response.headers.get('set-cookie')].filter(Boolean);

		for (const entry of header) {
			const [pair] = String(entry).split(';');
			const separator = pair.indexOf('=');
			if (separator === -1) continue;
			cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
		}
	};

	const request = async (path, { method = 'GET', headers = {}, body } = {}) => {
		const response = await fetch(joinURL(baseURL, path), {
			method,
			headers: {
				Accept: 'application/json',
				...(body ? { 'Content-Type': 'application/json' } : {}),
				...(cookies.size ? { Cookie: cookieHeader() } : {}),
				...headers,
			},
			body: body ? JSON.stringify(body) : undefined,
		});
		storeCookies(response);
		return {
			ok: response.ok,
			status: response.status,
			data: await parseJson(response),
		};
	};

	return {
		baseURL,
		request,
		isHealthy: async () => {
			try {
				const response = await fetch(joinURL(baseURL, '/healthz'));
				return response.ok;
			} catch {
				return false;
			}
		},
	};
};

const ensureOwnerSession = async (client, owner = getN8nTestConfig()) => {
	const settings = await client.request('/rest/settings');
	const userManagement = settings.data?.data?.userManagement ?? settings.data?.userManagement;
	const needsSetup = Boolean(
		userManagement?.showSetupOnFirstLoad ?? userManagement?.showSetup ?? false,
	);

	if (needsSetup || settings.status === 200) {
		const setup = await client.request('/rest/owner/setup', {
			method: 'POST',
			body: {
				email: owner.email,
				firstName: owner.firstName,
				lastName: owner.lastName,
				password: owner.password,
			},
		});

		if (!setup.ok && setup.status !== 400 && setup.status !== 409) {
			// 400/409 usually mean the owner already exists.
			if (setup.status >= 500) {
				throw new Error(`n8n owner setup failed with HTTP ${setup.status}`);
			}
		}
	}

	const login = await client.request('/rest/login', {
		method: 'POST',
		body: {
			email: owner.email,
			emailOrLdapLoginId: owner.email,
			password: owner.password,
		},
	});

	if (!login.ok) {
		throw new Error(`n8n login failed with HTTP ${login.status}`);
	}

	return login.data;
};

module.exports = {
	createN8nClient,
	ensureOwnerSession,
};
