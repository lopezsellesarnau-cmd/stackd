import { test, expect } from '@playwright/test';

test('home page smoke test', async ({ page }) => {
  const errors: string[] = [];

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/');

  // Hero h1 contains expected text
  const h1 = page.locator('h1');
  await expect(h1).toContainText('Webs, automatizaciones y software');

  // No console errors
  expect(errors).toHaveLength(0);
});
