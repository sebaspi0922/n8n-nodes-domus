import { expect, test } from '@playwright/test';
import { addDomusNode, ensureOwner, expectDomusNodeOpen, openBlankWorkflow } from './helpers/n8n';

test.beforeEach(async ({ page }) => {
	await ensureOwner(page);
});

test('shows required create fields and additional-field options', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Create a property');
	await expectDomusNodeOpen(page);

	await expect(page.getByText('City', { exact: true })).toBeVisible();
	await expect(page.getByText('Address', { exact: true })).toBeVisible();
	await expect(page.getByText('Business Type', { exact: true })).toBeVisible();
	await expect(page.getByText('Property Type', { exact: true })).toBeVisible();
	await expect(page.getByText(/cannot be deleted/i).first()).toBeVisible();

	// Multi-option collections render a select, not the single-option Add Field button.
	await page.getByTestId('collection-parameter-add').getByRole('combobox').click();
	await expect(page.getByRole('option', { name: /^Status$/i })).toBeVisible();
	await expect(page.getByRole('option', { name: /^Description$/i })).toBeVisible();
});

test('shows Property Code and update fields without a Status control', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Update a property');
	await expectDomusNodeOpen(page);

	await expect(page.getByText('Property Code', { exact: true })).toBeVisible();
	await expect(page.getByText(/cannot be changed here/i).first()).toBeVisible();

	// Multi-option collections render a select, not the single-option Add Field button.
	await page.getByTestId('collection-parameter-add').getByRole('combobox').click();
	await expect(page.getByRole('option', { name: /^Description$/i })).toBeVisible();
	await expect(page.getByRole('option', { name: /^Status$/i })).toHaveCount(0);
});
