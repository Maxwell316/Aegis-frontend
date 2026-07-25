import { expect, test } from '@playwright/test';

test.describe('security headers', () => {
  test('sends anti-framing and content-type hardening headers', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.headers()['x-frame-options']).toBe('DENY');
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    expect(response?.headers()['strict-transport-security']).toContain('max-age=63072000');
  });

  test('does not load third-party scripts without consent', async ({ page }) => {
    await page.goto('/');

    const externalScripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[src]'))
        .map((script) => new URL((script as HTMLScriptElement).src, window.location.href))
        .filter((src) => src.origin !== window.location.origin)
        .map((src) => src.href),
    );

    expect(externalScripts).toEqual([]);
  });
});
