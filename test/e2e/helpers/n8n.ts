import { type APIRequestContext, type Page, expect } from '@playwright/test';
import { configuredPropertyCode, domusBaseURL, domusToken } from './env';

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
	await expect(page.getByText(/interact with domus crm/i).first()).toBeVisible();

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
		| 'Get a property'
		| 'Get property status history'
		| 'Change property status' = 'Search properties',
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
	const execute = page
		.getByTestId('execute-workflow-button')
		.or(page.getByTestId('ndv-execute'))
		.or(page.getByRole('button', { name: /execute|test step|test workflow/i }));

	await expect(execute.first()).toBeVisible();
	await execute.first().click();
}
