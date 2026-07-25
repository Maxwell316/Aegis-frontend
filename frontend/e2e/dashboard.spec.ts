import { expect, test } from '@playwright/test';

test.describe('dashboard core flows', () => {
  test('loads the dashboard and exposes primary navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('X-Aegis', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toContainText('Dashboard');
    await expect(page.getByRole('link', { name: /bridge/i })).toBeVisible();
  });

  test('opens the mobile navigation and changes the active dashboard view', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: /open menu/i }).click();
    const menu = page.getByRole('dialog', { name: /mobile navigation menu/i });
    await expect(menu).toBeVisible();
    await menu.getByRole('button', { name: 'Referrals' }).click();
    await expect(menu.getByRole('button', { name: 'Referrals' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /close menu/i })).toBeVisible();
  });
});
