import { expect, test } from '@playwright/test';
import { addDomusNode, ensureOwner, expectDomusNodeOpen, openBlankWorkflow } from './helpers/n8n';

test.beforeEach(async ({ page }) => {
	await ensureOwner(page);
});

test('shows Search Map filters without executing the search', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Search properties on a map');
	await expectDomusNodeOpen(page);

	await expect(page.getByText('Return All')).toBeVisible();
	await expect(page.getByText('Entire Agency')).toBeVisible();

	const addFilter = page
		.getByRole('combobox', { name: /add filter/i })
		.or(page.getByRole('button', { name: /add filter/i }));
	await addFilter.first().click();
	await expect(page.getByRole('option', { name: 'Polygon', exact: true })).toBeVisible();
	await expect(page.getByRole('option', { name: 'Destination', exact: true })).toBeVisible();
});

test('shows Separate fields and does not execute the reservation', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Separate a property');
	await expectDomusNodeOpen(page);

	await expect(page.getByText('Property Code', { exact: true })).toBeVisible();
	await expect(page.getByText('Status', { exact: true })).toBeVisible();
	await expect(page.getByText(/does not delete/i).first()).toBeVisible();
});

test('shows Unlink fields and does not execute the delete', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Unlink an owner from a property');
	await expectDomusNodeOpen(page);

	await expect(page.getByText('Owner Code', { exact: true })).toBeVisible();
	await expect(page.getByText('Property Code', { exact: true })).toBeVisible();
	await expect(page.getByText(/owner record stays/i).first()).toBeVisible();
});

test('shows Advisor Create and Update fields without executing writes', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Create an advisor');
	await expectDomusNodeOpen(page);
	await expect(page.getByText('First Name', { exact: true })).toBeVisible();
	await expect(page.getByText('Last Name', { exact: true })).toBeVisible();
	await expect(page.getByText('Document', { exact: true })).toBeVisible();

	await openBlankWorkflow(page);
	await addDomusNode(page, 'Update an advisor');
	await expectDomusNodeOpen(page);
	await expect(page.getByText('Advisor Code', { exact: true })).toBeVisible();
	await expect(page.getByText(/no documented get-by-id/i).first()).toBeVisible();
});

test('shows Branch Search as its own resource', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Search branches');
	await expectDomusNodeOpen(page);
	await expect(page.getByText('Return All')).toBeVisible();
	await expect(page.getByTestId('ndv').getByRole('combobox', { name: 'Select' }).first()).toHaveValue('Branch');
});

test('shows the new property catalogs on Create without sending extra-amenities JSON', async ({
	page,
}) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Create a property');
	await expectDomusNodeOpen(page);

	await page.getByTestId('collection-parameter-add').getByRole('combobox').click();
	await expect(page.getByRole('option', { name: 'Department', exact: true })).toBeVisible();
	await expect(page.getByRole('option', { name: 'Populated Center', exact: true })).toBeVisible();
	await expect(page.getByRole('option', { name: 'Destination', exact: true })).toBeVisible();
	await expect(page.getByRole('option', { name: 'Extra Amenities', exact: true })).toBeVisible();
});
