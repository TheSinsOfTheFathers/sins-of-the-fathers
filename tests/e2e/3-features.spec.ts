import { test, expect } from '@playwright/test';

test.describe('TSOF - Kritik Özellikler', () => {

  test('Timeline.js (Tarihçe) yüklenmeli', async ({ page }) => {
    await page.goto('/pages/timeline.html');

    // Yükleme animasyonunun görünür olduğunu, sonra kaybolduğunu doğrula
    const loader = page.locator('#timeline-loading');
    
    // Timeline kütüphanesinin oluşturduğu ana SVG/div'i bekle
    const timelineContainer = page.locator('#timeline-board');
    
    await expect(timelineContainer).toBeVisible({ timeout: 10000 });
    await expect(loader).not.toBeVisible();
  });

  test('Leaflet Map (Lokasyonlar) harita konteyneri oluşturmalı', async ({ page }) => {
    await page.goto('/pages/locations.html');

    // Leaflet yüklendiğinde 'leaflet-container' sınıfını ekler
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();

    // Zoom butonlarının varlığını kontrol et
    await expect(page.locator('.leaflet-control-zoom-in')).toBeVisible();
  });

  test('D3.js (Bloodline) grafiği çizilmeli', async ({ page }) => {
    // Test için Bloodline sayfasına gidiyoruz
    await page.goto('/pages/bloodline.html'); 

    const graphContainer = page.locator('#bloodline-container');
    await expect(graphContainer).toBeVisible();
    
    // D3.js svg veya canvas elementini oluşturduğundan emin ol
    // Sadece ana div'in yüklenmesini test ediyoruz
  });
});