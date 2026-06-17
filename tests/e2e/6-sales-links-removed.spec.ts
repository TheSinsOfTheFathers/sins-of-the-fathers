import { test, expect } from '@playwright/test';
import { mockSanity } from './mocks';

test.describe('TSOF - Satış Linkleri Kaldırılmalı', () => {

  test.beforeEach(async ({ page }) => {
    await mockSanity(page);
  });

  test('Anasayfada satın alma veya dükkan linki olmamalı', async ({ page }) => {
    await page.goto('/');

    // Hero veya menüde MERCH / acquisition linkleri olmamalı
    const merchLinks = page.locator('a[href*="shop.thesinsofthefathers.com"]');
    await expect(merchLinks).toHaveCount(0);

    const shopierLinks = page.locator('a[href*="shopier.com"]');
    await expect(shopierLinks).toHaveCount(0);

    const gumroadLinks = page.locator('a[href*="gumroad.com"]');
    await expect(gumroadLinks).toHaveCount(0);

    const acquisitionSection = page.locator('#acquisition');
    await expect(acquisitionSection).toHaveCount(0);
  });

  test('Diğer sayfalarda da navigasyon menüsünde MERCH linki olmamalı', async ({ page }) => {
    const pagesToCheck = [
      '/pages/bloodline.html',
      '/pages/characters.html',
      '/pages/timeline.html',
      '/pages/factions.html',
      '/pages/locations.html'
    ];

    for (const path of pagesToCheck) {
      await page.goto(path);
      const merchLinks = page.locator('a[href*="shop.thesinsofthefathers.com"]');
      await expect(merchLinks).toHaveCount(0);
    }
  });
});
