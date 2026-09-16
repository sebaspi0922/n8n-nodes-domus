import { expect, test } from '@playwright/test';
import { ensureOwner, expectDomusNodeOpen, openBlankWorkflow, searchDomusInCreator } from './helpers/n8n';

test.beforeEach(async ({ page }) => {
	await ensureOwner(page);
});

test('loads Domus with all Property operations in the editor', async ({ page }) => {
	await openBlankWorkflow(page);
	await searchDomusInCreator(page);
	await expect(page.getByText('Search properties')).toBeVisible();
	await expect(page.getByText('Get a property')).toBeVisible();
	await expect(page.getByText('Create a property')).toBeVisible();
	await expect(page.getByText('Update a property')).toBeVisible();
	await expect(page.getByText('Get property status history')).toBeVisible();
	await expect(page.getByText('Get property portal publications')).toBeVisible();
	await expect(page.getByText('Retry a property portal publication')).toBeVisible();
	await expect(page.getByText('Change property status')).toBeVisible();

	await page.getByText('Search properties', { exact: true }).click();
	await expectDomusNodeOpen(page);
	await expect(page.getByText(/return all/i).first()).toBeVisible();
});

test('loads the Domus owner operations in the editor', async ({ page }) => {
	await openBlankWorkflow(page);
	await searchDomusInCreator(page);
	await expect(page.getByText('Search owners')).toBeVisible();
	await expect(page.getByText('Get an owner')).toBeVisible();
	await expect(page.getByText('Create an owner')).toBeVisible();
	await expect(page.getByText('Update an owner')).toBeVisible();

	await page.getByText('Create an owner', { exact: true }).click();
	await expectDomusNodeOpen(page);
	await expect(page.getByText(/last name/i).first()).toBeVisible();
});

test('loads the Domus advisor, project, and acquisition operations in the editor', async ({
	page,
}) => {
	await openBlankWorkflow(page);
	await searchDomusInCreator(page);
	await expect(page.getByText('Search advisors')).toBeVisible();
	await expect(page.getByText('Search projects')).toBeVisible();
	await expect(page.getByText('Get a project')).toBeVisible();
	await expect(page.getByText('Search acquisitions')).toBeVisible();
	await expect(page.getByText('Get an acquisition')).toBeVisible();

	await page.getByText('Search advisors', { exact: true }).click();
	await expectDomusNodeOpen(page);
});
