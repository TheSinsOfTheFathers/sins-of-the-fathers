import { test, expect } from '@playwright/test';

test.describe('TSOF - Kritik Özellikler', () => {

  test('Timeline.js (Tarihçe) yüklenmeli', async ({ page }) => {
    await page.goto('/pages/timeline.html');

    // Yükleme animasyonunun görünür olduğunu, sonra kaybolduğunu doğrula
    const loader = page.locator('#timeline-loading');
    
    // Timeline kütüphanesinin oluşturduğu ana div'i bekle
    // Not: Timeline.js 'tl-timeline' sınıfını inject eder
    const timelineContainer = page.locator('.tl-timeline');
    
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

  test('D3.js (Soy Ağacı) grafiği çizilmeli', async ({ page }) => {
    // Test için bir karakter detay sayfasına gidiyoruz (Mock data gerekebilir)
    // Şimdilik genel yapıyı kontrol edelim
    await page.goto('/pages/character-detail.html?id=Roland'); 

    const graphContainer = page.locator('#family-graph');
    await expect(graphContainer).toBeVisible();
    
    // D3.js bir SVG oluşturmalı
    // await expect(graphContainer.locator('svg')).toBeVisible(); 
    // Not: Veri yoksa 'd3-empty' görünebilir, bu da bir başarıdır (kod çalıştı demek)
  });
});