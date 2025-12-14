import { test, expect } from '@playwright/test';

test.describe('TSOF - Navigasyon ve i18n', () => {

  test('Menü linkleri doğru sayfalara yönlendirmeli', async ({ page }) => {
    await page.goto('/');

    // Bloodline (Karakterler) sayfasına git
    await page.getByRole('link', { name: /bloodline/i }).first().click();
    await expect(page).toHaveURL(/.*characters.html/);
    await expect(page.locator('h1')).toContainText(/Bloodline/i);

    // Geri dön ve History (Timeline) sayfasına git
    await page.goBack();
    await page.getByRole('link', { name: /history/i }).first().click();
    await expect(page).toHaveURL(/.*timeline.html/);
  });

  test('Türkçe dil seçeneği çalışmalı', async ({ page }) => {
    await page.goto('/');

    const trButton = page.locator('button[data-lang="tr"]').first();
    await trButton.click({ force: true }); 

    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');

    const storedLang = await page.evaluate(() => localStorage.getItem('i18nextLng'));
    expect(storedLang).toBe('tr');
  });
});