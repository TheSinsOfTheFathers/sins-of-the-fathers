import { test, expect } from '@playwright/test';

test.describe('TSOF - Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Anasayfa başlığı ve meta verileri doğru yüklenmeli', async ({ page }) => {
    await expect(page).toHaveTitle(/The Sins of the Fathers/);
    
    const noise = page.locator('.noise-overlay');
    await expect(noise).toBeAttached(); 
  });

  test('Kritik UI elementleri görünür olmalı', async ({ page }) => {
    const brand = page.locator('header a').filter({ hasText: 'TSOF' }).first();
    await expect(brand).toBeVisible();

    const heroTitle = page.locator('h1');
    await expect(heroTitle).toBeVisible();
  });

  test('Console hatası olmamalı', async ({ page }) => {
    const errors: string[] = []; 
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('favicon.ico')) return;

        errors.push(text);
        console.log('🔴 Console Error Yakalandı:', text);
      }
    });
    
    await page.waitForLoadState('domcontentloaded');
    
    expect(errors, `Sayfada şu hatalar oluştu: ${JSON.stringify(errors)}`).toHaveLength(0);
  });
});