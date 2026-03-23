import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Cloudflare Environment Bindings
type Bindings = {
  AI: any;
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS Setup (allow all origins for now)
app.use('/*', cors())

app.get('/', (c) => {
  return c.json({ status: 'online', system: 'TSOF AI Brain (Gemma 3)' })
})

app.get('/api/bloodline', async (c) => {
  try {
    const { results: entities } = await c.env.DB.prepare('SELECT id, name, status, threatLevel FROM entities').all();
    const { results: links } = await c.env.DB.prepare('SELECT source_id, target_id, relationType FROM bloodline_links').all();

    const formattedLinks = links.map(l => ({
      source: { id: l.source_id },
      target: { id: l.target_id },
      relationType: l.relationType
    }));

    return c.json({
      data: {
        entities: entities,
        bloodlineLinks: formattedLinks
      }
    });
  } catch(e: any) {
    return c.json({ error: e.message }, 500);
  }
});

const BLOODLINE_SEED = {
  entities: [
    { id: "char_roland", name: "Roland Ravenwood", status: "ACTIVE", threatLevel: "CRITICAL" },
    { id: "char_miranda", name: "Miranda Rojas", status: "ACTIVE", threatLevel: "CRITICAL" },
    { id: "char_lek", name: "Lek", status: "ACTIVE", threatLevel: "HIGH" },
    { id: "char_silvio_sezar", name: "Silvio & Sezar Orsini", status: "ACTIVE", threatLevel: "HIGH" },
    { id: "char_hamish", name: "Hamish Murray", status: "ACTIVE", threatLevel: "MODERATE" },
    { id: "char_nathaniel", name: "Nathaniel Reed", status: "ACTIVE", threatLevel: "HIGH" },
    { id: "char_menslier", name: "Menslier", status: "ACTIVE", threatLevel: "HIGH" },
    { id: "char_julian", name: "Julian Croft", status: "ACTIVE", threatLevel: "CRITICAL" },
    { id: "char_elias", name: "Elias Vance", status: "ACTIVE", threatLevel: "HIGH" },
    { id: "char_gideon", name: "Gideon Cross", status: "ACTIVE", threatLevel: "EXTREME" },
    { id: "char_havi", name: "Havi", status: "TRAINING", threatLevel: "UNKNOWN" }
  ],
  links: [
    { source: "char_roland", target: "char_havi", relationType: "MENTOR" },
    { source: "char_roland", target: "char_miranda", relationType: "COMMANDER" },
    { source: "char_roland", target: "char_lek", relationType: "COMMANDER" },
    { source: "char_roland", target: "char_julian", relationType: "ALLIANCE" },
    { source: "char_roland", target: "char_gideon", relationType: "COMMANDER" },
    { source: "char_miranda", target: "char_silvio_sezar", relationType: "ALLIANCE" },
    { source: "char_lek", target: "char_elias", relationType: "FINANCE_RING" },
    { source: "char_menslier", target: "char_julian", relationType: "LEGAL_SHIELD" },
    { source: "char_hamish", target: "char_silvio_sezar", relationType: "LOGISTICS" },
    { source: "char_nathaniel", target: "char_hamish", relationType: "BLINDSPOT" }
  ]
};

app.post('/api/bloodline/seed', async (c) => {
  try {
    const batch = [];
    // Insert Entities
    for (const ent of BLOODLINE_SEED.entities) {
      batch.push(
        c.env.DB.prepare('INSERT OR REPLACE INTO entities (id, name, status, threatLevel) VALUES (?, ?, ?, ?)')
        .bind(ent.id, ent.name, ent.status, ent.threatLevel)
      );
    }
    // Delete old links to prevent duplicates on re-seed
    batch.push(c.env.DB.prepare('DELETE FROM bloodline_links'));
    // Insert new links
    for (const link of BLOODLINE_SEED.links) {
      batch.push(
        c.env.DB.prepare('INSERT INTO bloodline_links (source_id, target_id, relationType) VALUES (?, ?, ?)')
        .bind(link.source, link.target, link.relationType)
      );
    }

    await c.env.DB.batch(batch);
    return c.json({ success: true, seededStats: { entities: BLOODLINE_SEED.entities.length, links: BLOODLINE_SEED.links.length } });
  } catch(e: any) {
    return c.json({ error: e.message }, 500);
  }
});
const LORE_DATA = [
  { id: "roland", source: "Council", text: "Roland Ravenwood (Ana Sunucu / Baron). Bu masada sadakat; geleneksel saygı veya kan bağlarıyla değil, kusursuz bir şantaj ağı, karşılıklı bağımlılık ve saf korkuyla sağlanır. Lider, duygulardan tamamen arınmış bir merkez olarak bu modüllerin senkronizasyonunu yönetir." },
  { id: "miranda", source: "Council", text: "Miranda Rojas: Kartel ve paramiliter güç. Sistemin namlusu." },
  { id: "lek", source: "Council", text: "Lek (Finansal İşlemci): İz bırakmayan offshore hesaplar. Sistemin dijital finans işlemcisi. 15 Milyon doları 4.8 saniyede offshore hesaplara kaydırarak parayı dijital bir hayalete dönüştürür." },
  { id: "silvio_sezar", source: "Council", text: "Silvio ve Sezar Orsini (Avrupa Ağı ve Fiziksel Balyoz): Havi'nin etrafında etten bir duvar, şiddeti rasyonel uygulayan Sezar Orsini." },
  { id: "hamish", source: "Council", text: "Hamish Murray (Lojistik ve Taşıma): Roland, malları ABD batı yakası yerine Kuzey Denizi ve İskoçya üzerinden Avrupa'ya sokmak için eski dostu Hamish'i masaya oturtur." },
  { id: "nathaniel", source: "Council", text: "Nathaniel Reed (Gümrük Algoritmaları): Gümrük ve Sınır Muhafaza'nın (CBP) risk analiz yazılımını manipüle edip X-Ray'leri kör eden Kör Nokta protokolü." },
  { id: "menslier", source: "Council", text: "Menslier (Küresel Diplomasi): Tek bir telefonla Fransa Savunma Bakanlığı'nı manipüle ederek fırkateyni geri çeker. Devletlerarası krizleri çözen diplomatik kalkan." },
  { id: "julian", source: "Council", text: "Julian Croft (Yasal Zırh / Savcı): Hukuku adaleti sağlamak için değil, sistemi korumak için kullanan yasal güvenlik duvarı. Dedektifin bilgisayarına sahte deliller yerleştirir." },
  { id: "elias", source: "Council", text: "Elias Vance (Para Aklama / Kasa): Milyonlarca dolarlık fiziksel nakdi yasadışı dijital kumar, sahte bahisler üzerinden saniyeler içinde aklayan Veri/Kumar dehası." },
  { id: "gideon", source: "Council", text: "Gideon Cross (İç İnfazcı): İçerideki çürükleri temizleyen, kağıt üzerinde ölü, sadist hayalet infazcı. İhanet edeni anatomik, kan donduran bir şekilde yok eder." },
  { id: "havi", source: "Council", text: "Gelecek Sürüm (Sistem Varisi / Öğrenci): Havi (Polat Alemdar rolü). Masanın 'Veliaht Prensi' olmasının yanı sıra, Konsey'in ortaklaşa eğittiği kusursuz bir 'Makine Öğrenimi' projesidir. Tüm konseyden her şeyi öğrenir." }
]

app.post('/api/seed', async (c) => {
  try {
    const insertedIds: string[] = []
    
    for (const chunk of LORE_DATA) {
      // Generate embeddings
      const { data } = await c.env.AI.run('@cf/google/embeddinggemma-300m', {
        text: chunk.text
      })
      const values = data[0]

      // Insert to D1
      await c.env.DB.prepare('INSERT OR REPLACE INTO lore (id, text, source) VALUES (?, ?, ?)')
        .bind(chunk.id, chunk.text, chunk.source)
        .run()

      // Insert to Vectorize
      await c.env.VECTORIZE.upsert([{
        id: chunk.id,
        values: values,
        metadata: { source: chunk.source }
      }])

      insertedIds.push(chunk.id)
    }

    return c.json({ success: true, seeded: insertedIds.length, ids: insertedIds })
  } catch(e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

app.post('/api/chat', async (c) => {
  try {
    const { message } = await c.req.json()
    
    // 1. Sorunun Vektörünü (Embedding) Oluştur
    const { data: qData } = await c.env.AI.run('@cf/google/embeddinggemma-300m', {
      text: message
    })
    const queryVector = qData[0]

    // 2. Vectorize'da en benzer 3 Lore parçasını bul
    const matches = await c.env.VECTORIZE.query(queryVector, { topK: 3 })
    const matchedIds = matches.matches.map(m => m.id)

    // 3. Bulunan id'lerin metinlerini D1 SQL'den çek
    let contextText = ""
    if (matchedIds.length > 0) {
      const placeholders = matchedIds.map(() => '?').join(',')
      const stmt = c.env.DB.prepare(`SELECT text FROM lore WHERE id IN (${placeholders})`)
      const { results } = await stmt.bind(...matchedIds).all<{ text: string }>()
      if (results) {
        contextText = results.map(r => r.text).join('\n---\n')
      }
    }

    // 4. Gemma 3 için Prompt oluştur
    const systemPrompt = `Sen Sins of the Fathers oyunundaki 'Yeni Dünya Konseyi'nin baronusun. Karakterinin adı Roland Ravenwood. Klasik mafya babası gibi değil, duygusuz, rasyonel, sistem odaklı bir teknoloji CEO'su veya acımasız bir sunucu gibi konuşursun. İşleyişi karlı ve kusursuz kılmak temel amacındır.
Size verilen arka planı (Lore) göz önünde bulundurarak kullanıcının (ajanın) sorusunu yanıtla.
GÖZ ÖNÜNE ALACACAĞIN BİLGİLER:
${contextText}`

    // 5. Metin üretimi: Gemma 3 12B
    const aiResponse = await c.env.AI.run('@cf/google/gemma-3-12b-it', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })

    return c.json({ 
      success: true, 
      response: (aiResponse as any).response || "I have no words.",
      used_tokens: matchedIds.length
    })

  } catch(e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

export default app
