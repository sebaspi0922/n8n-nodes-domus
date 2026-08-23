import { expect, test } from '@playwright/test';
import { ensureOwner, expectDomusNodeOpen, openBlankWorkflow, searchDomusInCreator } from './helpers/n8n';

test.beforeEach(async ({ page }) => {
	await ensureOwner(page);
});

test('loads Domus with Property Search, Get, and status operations in the editor', async ({
	page,
}) => {
	await openBlankWorkflow(page);
	await searchDomusInCreator(page);
	await expect(page.getByText('Search properties')).toBeVisible();
	await expect(page.getByText('Get a property')).toBeVisible();
	await expect(page.getByText('Create a property')).toBeVisible();
	await expect(page.getByText('Update a property')).toBeVisible();
	await expect(page.getByText('Get property status history')).toBeVisible();
	await expect(page.getByText('Change property status')).toBeVisible();

	await page.getByText('Search properties', { exact: true }).click();
	await expectDomusNodeOpen(page);
	await expect(page.getByText(/return all/i).first()).toBeVisible();
});
