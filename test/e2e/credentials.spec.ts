import { expect, test } from '@playwright/test';
import { hasDomusToken } from './helpers/env';
import { addDomusNode, createDomusCredentialViaApi, ensureOwner, openBlankWorkflow } from './helpers/n8n';

test.beforeEach(async ({ page }) => {
	await ensureOwner(page);
});

test('shows the Domus API credential form with token and environment', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Search properties');

	await expect(page.getByTestId('setup-credential-button')).toBeVisible();
	await page.getByTestId('setup-credential-button').click();

	const modal = page.getByTestId('editCredential-modal');
	await expect(modal).toBeVisible();
	await expect(modal.getByText('Token *')).toBeVisible();
	await expect(modal.getByText('Environment', { exact: true })).toBeVisible();
	await expect(modal.getByRole('textbox').first()).toBeVisible();

	await modal.getByRole('combobox').first().click();
	await expect(page.getByRole('option', { name: 'Testing', exact: true })).toBeVisible();
	await expect(page.getByRole('option', { name: 'Production', exact: true })).toBeVisible();
});

test('can save a Testing credential created outside the screenshotable form', async ({ page }) => {
	test.skip(!hasDomusToken, 'Set DOMUS_TEST_TOKEN to exercise a live credential');

	const credentialId = await createDomusCredentialViaApi(page.request);
	expect(credentialId).toBeTruthy();

	await openBlankWorkflow(page);
	await addDomusNode(page, 'Search properties');
	await expect(page.getByTestId('setup-credential-button').or(page.getByText(/domus api/i).first())).toBeVisible();
});
