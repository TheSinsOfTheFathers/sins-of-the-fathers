import { test, expect } from '@playwright/test';

test.describe('TSOF - SEO ve Performans', () => {

  test('Partytown yapılandırması aktif olmalı', async ({ page }) => {
    await page.goto('/');

    // Head içindeki GTM scriptini bul
    // text/partytown tipinde olmalı (Bu en kritik kontrol)
    const gtmScript = page.locator('head > script[type="text/partytown"]').first();
    
    // Script'in varlığını doğrula (HTML içinde)
    const scriptCount = await gtmScript.count();
    expect(scriptCount).toBeGreaterThan(0);
  });

  test('Meta Description dolu olmalı', async ({ page }) => {
    await page.goto('/');
    
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /.+/); // Boş olmadığını kontrol et
  });

  test('Canonical URL tanımlı olmalı (Varsa)', async ({ page }) => {
    // Eğer canonical link eklediysen bu testi açabilirsin
    // await page.goto('/');
    // const canonical = page.locator('link[rel="canonical"]');
    // await expect(canonical).toHaveAttribute('href', /https:\/\/thesinsofthefathers.com/);
  });
});