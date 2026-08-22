import { expect, test } from '@playwright/test';
import { hasDomusToken } from './helpers/env';
import {
	addDomusNode,
	createDomusCredentialViaApi,
	discoverPropertyCode,
	ensureOwner,
	executeOpenNode,
	expectDomusNodeOpen,
	openBlankWorkflow,
} from './helpers/n8n';

test.beforeEach(async ({ page }) => {
	await ensureOwner(page);
});

test('shows the Property Get code fields', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Get a property');
	await expectDomusNodeOpen(page);

	await expect(page.getByText('Property Code', { exact: true })).toBeVisible();
	await expect(page.getByText('Internal Property ID', { exact: true })).toBeVisible();
});

test('executes Property Get for a discovered testing property', async ({ page }) => {
	test.skip(!hasDomusToken, 'Set DOMUS_TEST_TOKEN to execute Get against Domus');

	const propertyCode = await discoverPropertyCode(page.request);
	test.skip(!propertyCode, 'Testing host returned no properties to get');

	await createDomusCredentialViaApi(page.request);
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Get a property');
	await expectDomusNodeOpen(page);

	const codeInput = page
		.getByTestId('parameter-input-propertyCode')
		.locator('input')
		.or(page.getByRole('textbox', { name: /property code/i }));
	await codeInput.first().fill(String(propertyCode));
	await executeOpenNode(page);

	await expect(page.getByText(/item/i).first()).toBeVisible({ timeout: 30_000 });
});
