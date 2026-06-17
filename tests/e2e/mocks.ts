import { Page } from '@playwright/test';

export async function mockSanity(page: Page) {
  await page.route('**/data/query/**', async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('query') || '';
    
    let result: any = [];
    
    if (query.includes('_type == "timelineEra"')) {
      result = [
        {
          title_en: "Era 1",
          events: [
            {
              title_en: "Event 1",
              text_en: "Event 1 Description",
              date: "2026-01-01",
              slug: "event-1",
              external_image_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80"
            }
          ]
        }
      ];
    } else if (query.includes('_type == "location"')) {
      result = [
        {
          name: "Location 1",
          slug: "location-1",
          location: { lat: 40.0, lng: -30.0 },
          faction: { slug: { current: "ravenwood-empire" } },
          summary: "Location 1 Description"
        }
      ];
    } else if (query.includes('_type == "faction"')) {
      result = [
        {
          title: "Faction 1",
          slug: "faction-1",
          color: "#c5a059"
        }
      ];
    } else if (query.includes('_type == "character"')) {
      result = [
        {
          name: "Character 1",
          slug: "character-1",
          faction: { title: "Faction 1", slug: { current: "ravenwood-empire" } }
        }
      ];
    } else if (query.includes('_type == "lore"')) {
      result = [
        {
          title: "Lore 1",
          slug: "lore-1",
          date: "2026-01-01"
        }
      ];
    }
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result })
    });
  });
}
