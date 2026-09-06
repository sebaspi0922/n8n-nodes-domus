import { expect, test } from '@playwright/test';
import { hasDomusToken } from './helpers/env';
import {
	addDomusNode,
	createDomusCredentialViaApi,
	ensureOwner,
	executeOpenNode,
	expectDomusNodeOpen,
	openBlankWorkflow,
} from './helpers/n8n';

test.beforeEach(async ({ page }) => {
	await ensureOwner(page);
});

test('exposes Property Search controls including the city locator', async ({ page }) => {
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Search properties');
	await expectDomusNodeOpen(page);

	await expect(page.getByText('Return All')).toBeVisible();
	await expect(page.getByText('Entire Agency')).toBeVisible();
	await expect(page.getByText('Filters')).toBeVisible();

	const addFilter = page
		.getByRole('combobox', { name: /add filter/i })
		.or(page.getByRole('button', { name: /add filter/i }));
	if (await addFilter.first().isVisible().catch(() => false)) {
		await addFilter.first().click();
		await expect(page.getByRole('option', { name: 'Status', exact: true })).toBeVisible();
		await expect(page.getByRole('option', { name: 'Amenities', exact: true })).toBeVisible();
		const cityOption = page.getByRole('option', { name: 'City', exact: true });
		await expect(cityOption).toBeVisible();
		await cityOption.click();
		await expect(page.getByText('City', { exact: true }).first()).toBeVisible();
	}
});

test('executes Property Search and shows output items when a token is available', async ({
	page,
}) => {
	test.skip(!hasDomusToken, 'Set DOMUS_TEST_TOKEN to execute Search against Domus');

	await createDomusCredentialViaApi(page.request);
	await openBlankWorkflow(page);
	await addDomusNode(page, 'Search properties');
	await expectDomusNodeOpen(page);
	await executeOpenNode(page);

	const output = page.getByTestId('ndv').getByTestId('ndv-output-panel');
	await expect(output.getByTestId('run-data-item-count')).toHaveText(/^[1-9][\d,]* items?$/, {
		timeout: 30_000,
	});
});
