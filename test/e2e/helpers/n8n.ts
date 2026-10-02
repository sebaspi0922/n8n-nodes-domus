import { type APIRequestContext, type Page, expect } from '@playwright/test';
import { configuredPropertyCode, domusBaseURL, domusCrmToken, domusToken } from './env';

const jsonHeaders = {
	Accept: 'application/json',
	'Content-Type': 'application/json',
};

const unwrap = <T>(payload: unknown): T => {
	if (payload && typeof payload === 'object' && 'data' in payload) {
		return (payload as { data: T }).data;
	}
	return payload as T;
};

export async function ensureOwner(page: Page): Promise<void> {
	await page.goto('/workflow/new', { waitUntil: 'domcontentloaded' });
	await dismissOnboarding(page);

	if (await page.getByText(/add first step/i).isVisible().catch(() => false)) {
		return;
	}

	const signIn = page.getByRole('button', { name: /^sign in$/i });
	if (await signIn.isVisible().catch(() => false)) {
		throw new Error('n8n session is missing; delete test-results/e2e/.auth.json and rerun');
	}
}

export async function openBlankWorkflow(page: Page): Promise<void> {
	await page.goto('/workflow/new', { waitUntil: 'domcontentloaded' });
	await dismissOnboarding(page);

	const canvas = page
		.getByTestId('canvas')
		.or(page.getByTestId('canvas-wrapper'))
		.or(page.locator('.vue-flow, .vue-flow__pane, [data-test-id="rf-wrapper"]'))
		.or(page.getByText(/add first step/i));

	await expect(canvas.first()).toBeVisible({ timeout: 20_000 });
}

async function dismissOnboarding(page: Page): Promise<void> {
	const candidates = [
		page.getByRole('button', { name: /skip|cierra|close|got it|continue/i }),
		page.getByTestId('skip-personalization'),
		page.getByTestId('close-button'),
	];

	for (const locator of candidates) {
		if (await locator.first().isVisible().catch(() => false)) {
			await locator.first().click({ timeout: 2_000 }).catch(() => undefined);
		}
	}
}

export async function openNodeCreator(page: Page): Promise<void> {
	const firstStep = page.getByRole('group').filter({ hasText: /add first step/i });
	await expect(firstStep).toBeVisible();
	await firstStep.click();

	const search = page.getByPlaceholder(/search nodes/i);
	if (!(await search.isVisible().catch(() => false))) {
		await page.getByRole('button', { name: /open nodes panel/i }).click({ force: true });
	}

	await expect(page.getByTestId('node-creator-search-bar')).toBeVisible();
}

export async function searchDomusInCreator(page: Page): Promise<void> {
	await openNodeCreator(page);
	const search = page.getByTestId('node-creator-search-bar');
	await expect(search).toBeVisible();
	await search.fill('Domus');
	await expect(page.getByText(/interact with domus properties/i).first()).toBeVisible();

	const actionsVisible = await page
		.getByText(/search properties/i)
		.first()
		.isVisible()
		.catch(() => false);
	if (!actionsVisible) {
		await page.getByText('Domus', { exact: true }).first().click();
	}

	await expect(page.getByText(/search properties/i).first()).toBeVisible();
	await expect(page.getByText(/get a property/i).first()).toBeVisible();
	await expect(page.getByText(/get property status history/i).first()).toBeVisible();
	await expect(page.getByText(/change property status/i).first()).toBeVisible();
}

export async function addDomusNode(
	page: Page,
	action:
		| 'Search properties'
		| 'Search properties on a map'
		| 'Get a property'
		| 'Create a property'
		| 'Update a property'
		| 'Get property status history'
		| 'Change property status'
		| 'Separate a property'
		| 'Unlink an owner from a property'
		| 'Create an advisor'
		| 'Update an advisor'
		| 'Search branches' = 'Search properties',
): Promise<void> {
	await searchDomusInCreator(page);
	await page.getByText(action, { exact: true }).click();
}

export async function expectDomusNodeOpen(page: Page): Promise<void> {
	const panel = page
		.getByTestId('ndv')
		.or(page.getByTestId('node-details-view'))
		.or(page.getByText('Property', { exact: true }));
	await expect(panel.first()).toBeVisible();
	await expect(page.getByText('Property').first()).toBeVisible();
}

export async function createDomusCredentialViaApi(
	request: APIRequestContext,
	name = `Domus E2E ${Date.now()}`,
): Promise<string> {
	if (!domusToken) {
		throw new Error('DOMUS_TEST_TOKEN is required to create a live credential');
	}

	const response = await request.post('/rest/credentials', {
		headers: jsonHeaders,
		data: {
			name,
			type: 'domusApi',
			data: {
				token: domusToken,
				environment: domusBaseURL,
			},
		},
	});

	if (!response.ok()) {
		throw new Error(`Creating Domus credential failed with HTTP ${response.status()}`);
	}

	const payload = unwrap<{ id?: string }>(await response.json());
	if (!payload?.id) {
		throw new Error('n8n did not return a credential id');
	}

	return String(payload.id);
}

export async function searchDomusCrmInCreator(page: Page): Promise<void> {
	await openNodeCreator(page);
	const search = page.getByTestId('node-creator-search-bar');
	await expect(search).toBeVisible();
	await search.fill('Domus');

	const actionsVisible = await page
		.getByText('Search meetings', { exact: true })
		.first()
		.isVisible()
		.catch(() => false);
	if (!actionsVisible) {
		await page.getByText('Domus', { exact: true }).first().click();
	}

	await expect(page.getByText('Search meetings', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Get a meeting', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Create a meeting', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Update a meeting', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Confirm a meeting', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Search opportunities', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Get an opportunity', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Create an opportunity', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Search profiles', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Search contacts', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Get a contact', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Create a contact', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Update a contact', { exact: true }).first()).toBeVisible();
}

export async function addDomusCrmNode(
	page: Page,
	action:
		| 'Search meetings'
		| 'Get a meeting'
		| 'Create a meeting'
		| 'Update a meeting'
		| 'Confirm a meeting'
		| 'Search opportunities'
		| 'Get an opportunity'
		| 'Create an opportunity'
		| 'Search profiles'
		| 'Search contacts'
		| 'Get a contact'
		| 'Create a contact'
		| 'Update a contact' = 'Search meetings',
): Promise<void> {
	await searchDomusCrmInCreator(page);
	await page.getByText(action, { exact: true }).click();
}

export async function expectDomusCrmNodeOpen(page: Page): Promise<void> {
	const panel = page.getByTestId('ndv');
	await expect(panel).toBeVisible();
	await expect(panel.getByRole('combobox', { name: 'Select' }).first()).toHaveValue('Meeting');
	await expect(panel.getByText('Start Date', { exact: true })).toBeVisible();
}

export async function createDomusCrmCredentialViaApi(
	request: APIRequestContext,
	name = `Domus CRM E2E ${Date.now()}`,
): Promise<string> {
	if (!domusCrmToken) {
		throw new Error('DOMUS_CRM_TEST_TOKEN is required to create a live CRM credential');
	}
	if (domusToken && domusCrmToken === domusToken) {
		throw new Error('DOMUS_CRM_TEST_TOKEN must be different from DOMUS_TEST_TOKEN');
	}

	const response = await request.post('/rest/credentials', {
		headers: jsonHeaders,
		data: {
			name,
			type: 'domusCrmApi',
			data: {
				token: domusCrmToken,
			},
		},
	});

	if (!response.ok()) {
		throw new Error(`Creating Domus CRM credential failed with HTTP ${response.status()}`);
	}

	const payload = unwrap<{ id?: string }>(await response.json());
	if (!payload?.id) {
		throw new Error('n8n did not return a credential id');
	}

	return String(payload.id);
}

export async function discoverPropertyCode(request: APIRequestContext): Promise<string | undefined> {
	if (configuredPropertyCode) return configuredPropertyCode;
	if (!domusToken) return undefined;

	const response = await request.get(`${domusBaseURL.replace(/\/$/, '')}/properties`, {
		headers: {
			Accept: 'application/json',
			Authorization: domusToken,
			Inmobiliaria: '1',
			Perpage: '1',
		},
	});

	if (!response.ok()) return undefined;
	const payload = unwrap<{ data?: Array<{ codpro?: string | number }> }>(await response.json());
	const first = Array.isArray(payload?.data) ? payload.data[0] : undefined;
	return first?.codpro !== undefined ? String(first.codpro) : undefined;
}

export async function executeOpenNode(page: Page): Promise<void> {
	const ndv = page.getByTestId('ndv');
	await expect(ndv).toBeVisible();

	// The canvas Execute step button sits behind the open node panel and
	// cannot receive the click. Use the button in the panel header.
	const execute = ndv.getByTestId('node-execute-button');
	await expect(execute).toBeVisible();
	await expect(execute).toBeEnabled();
	await execute.click();
}
