import { test, expect } from '@playwright/test';

test.describe('TSOF - Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/'); // playwright.config.js içindeki baseURL'i kullanır
  });

  test('Anasayfa başlığı ve meta verileri doğru yüklenmeli', async ({ page }) => {
    await expect(page).toHaveTitle(/The Sins of the Fathers/);
    
    // Noise overlay (Atmosfer) kontrolü
    const noise = page.locator('.noise-overlay');
    await expect(noise).toBeVisible();
  });

  test('Kritik UI elementleri görünür olmalı', async ({ page }) => {
    // Logo / Marka
    const brand = page.locator('.nav-brand').filter({ hasText: 'TSOF' });
    await expect(brand).toBeVisible();

    // Ana başlık
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();
  });

  test('Console hatası olmamalı', async ({ page }) => {
    const errors: string[] = []; 
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errors.push(text);
        console.log('🔴 Console Error Yakalandı:', text);
      }
    });
    
    await page.waitForLoadState('domcontentloaded');
    
    expect(errors, `Sayfada şu hatalar oluştu: ${JSON.stringify(errors)}`).toHaveLength(0);
  });
});