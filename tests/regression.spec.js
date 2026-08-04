const { test, expect } = require('@playwright/test');

// Regression 1 — Boot with no ?show= must load full shared content.
//
// Bug: the sample-book boot branch skipped resolveShared(), so
// window.VIVO_SHARED.supporters fell back to the bundled placeholder
// ("Annual Fund") instead of the 8 real categories from _vivo-shared.json.
test('no-show boot renders all 8 supporter categories', async ({ page }) => {
  // Navigate directly to the supporters section so we don't have to scroll
  await page.goto('/Program%20Book.html#/supporters');

  // Wait for the supporters accordion container — it only appears once
  // VIVO_SHARED is populated and React has mounted.
  await expect(page.locator('.sup-bars')).toBeVisible();

  const titles = page.locator('.sup-bars .vivo-banner-title');
  await expect(titles).toHaveCount(8);

  const expected = [
    'Corporate, Foundation, and Government Partners',
    'Dress Circle Members',
    'Endowment Fund Supporters',
    'Amy & Joshua Boger Innovation Fund Supporters',
    '2026 SHINE! Gala Supporters',
    'Con Vivo Supporters',
    'Martha H. Jones Society for Lifetime Giving',
    'Aaron Richmond Legacy Society',
  ];
  for (const name of expected) {
    await expect(page.locator('.vivo-banner-title', { hasText: name })).toBeVisible();
  }
});

// Regression 2 — Edit-mode nav bar must clear the first-run tip banner.
//
// Bug: when the tip banner was visible, the sticky nav bar stayed at
// top:39px instead of top:73px, so the back arrow scrolled under the tip.
test('edit-mode nav sits above tip, drops to baseline after dismiss', async ({ page }) => {
  // Force edit mode on and tip unseen before React boots
  await page.addInitScript(() => {
    localStorage.setItem('vivo-pb-editmode', '1');
    localStorage.removeItem('vivo-pb-tip-seen');
  });

  await page.goto('/Program%20Book.html');

  // Confirm both the toolbar and the tip are rendered
  const topbar = page.locator('.topbar');
  await expect(topbar).toBeVisible();
  await expect(page.locator('.edit-tip')).toBeVisible();

  // Nav must be positioned above the tip banner
  const topWithTip = await topbar.evaluate(el => getComputedStyle(el).top);
  expect(topWithTip).toBe('73px');

  // Dismiss the tip
  await page.getByLabel('Dismiss tip').click();
  await expect(page.locator('.edit-tip')).toBeHidden();

  // Nav drops back to the standard edit-mode offset
  const topAfter = await topbar.evaluate(el => getComputedStyle(el).top);
  expect(topAfter).toBe('39px');
});
