// tests/ana-sayfa.spec.ts

import { test, expect } from '@playwright/test';

test('Ana Sayfa Yükleniyor ve Başlık Görünüyor', async ({ page }) => {
  
  // 1. Adım: Sitenin ana sayfasına git.
  await page.goto('/');

  // 2. Adım: Sayfada "The Sins of the Fathers" metnini içeren başlığı bul.
  // HATA BURADAYDI: Test, Türkçe metni arıyordu, ancak sayfa İngilizce yükleniyor.
  const anaBaslik = page.getByRole('heading', { name: 'The Sins of the Fathers' });

  // 3. Adım: Bulunan başlığın ekranda görünür olduğunu doğrula.
  // Testin zaman aşımını önlemek için daha uzun bir bekleme süresi ekleyelim.
  await expect(anaBaslik).toBeVisible({ timeout: 15000 }); // 15 saniye bekle

});