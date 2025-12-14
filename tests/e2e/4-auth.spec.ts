import { test, expect } from '@playwright/test';

test.describe('TSOF - Kimlik Doğrulama (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/login.html', { waitUntil: 'domcontentloaded' });
  });

  test('Login formu elementleri mevcut olmalı', async ({ page }) => {
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    
    await expect(page.locator('#auth-login-form button[type="submit"]')).toBeVisible();
  });

  test('Boş form gönderiminde HTML5 validasyonu çalışmalı', async ({ page }) => {
    const emailInput = page.locator('#login-email');
    const submitBtn = page.locator('#auth-login-form button[type="submit"]');

    await submitBtn.click();

    await expect(emailInput).toBeFocused();
  });

  test('Register formuna geçiş yapılabilmeli', async ({ page }) => {
    await page.click('#switch-to-register');

    await expect(page.locator('#auth-register-form')).toBeVisible();
    await expect(page.locator('#auth-login-form')).not.toBeVisible();
  });
});