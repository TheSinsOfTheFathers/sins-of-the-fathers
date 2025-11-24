import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'faction',
  title: 'Faction (Hizip)',
  type: 'document',
  groups: [
    {name: 'core', title: 'Core Intelligence'},
    {name: 'visuals', title: 'Visual Identity'},
    {name: 'manifesto', title: 'Manifesto & Lore'},
    {name: 'network', title: 'Leadership & Assets'},
  ],
  fields: [
    // --- 1. TEMEL BİLGİLER & TİPOLOJİ ---
    defineField({
      name: 'title', // 'name' yerine 'title' standarttır
      title: 'Faction Name',
      type: 'string',
      group: 'core',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (ID)',
      type: 'slug',
      group: 'core',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Organization Type',
      type: 'string',
      description: 'Bu seçim, arayüzdeki renk temasını ve kart tasarımını belirler.',
      group: 'core',
      options: {
        list: [
          { title: 'Syndicate (Old World - Chaos)', value: 'syndicate' },
          { title: 'Corporation (New Order - Control)', value: 'corporation' },
          { title: 'Neutral / Government', value: 'neutral' },
        ],
        layout: 'radio'
      },
      initialValue: 'syndicate'
    }),
    defineField({
        name: 'hq',
        title: 'Headquarters Location',
        type: 'string',
        description: 'Örn: "The Docks, Glasgow" veya "Ballantine Tower, LA".',
        group: 'core'
    }),
    defineField({
      name: 'status',
      title: 'Operational Status',
      type: 'string',
      group: 'core',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Defunct', value: 'defunct' },
          { title: 'Underground', value: 'hidden' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
    }),

    // --- 2. GÖRSEL KİMLİK ---
    defineField({
      name: 'color',
      title: 'Theme Color (Hex Code)',
      type: 'color', // "sanity-plugin-color-input" kurulu ise "color", değilse "string" kullanın
      description: 'Fraksiyonun baskın rengi (Örn: Kan için #7f1d1d, Altın için #c5a059).',
      group: 'visuals',
    }),
    defineField({
      name: 'image',
      title: 'Main Banner / Emblem',
      type: 'image',
      description: "Fraksiyon detay sayfasının arka planında kullanılacak büyük görsel.",
      options: { hotspot: true },
      group: 'visuals',
    }),
    defineField({
      name: 'icon', // Harita ve UI için küçük ikon
      title: 'Tactical Icon',
      type: 'image',
      group: 'visuals',
    }),

    // --- 3. İÇERİK ---
    defineField({
      name: 'motto',
      title: 'Motto',
      type: 'string',
      group: 'manifesto',
    }),
    defineField({
      name: 'summary',
      title: 'Brief Summary',
      type: 'text',
      rows: 3,
      description: 'Kartlarda görünecek kısa tanıtım.',
      group: 'manifesto',
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'description', // "history" yerine genel açıklama
      title: 'Full Dossier / History',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'manifesto',
    }),
    defineField({
        name: 'philosophy',
        title: 'Philosophy',
        type: 'text',
        rows: 3,
        group: 'manifesto',
    }),
    defineField({
        name: 'economy',
        title: 'Revenue Stream',
        type: 'string',
        group: 'manifesto',
        description: 'Örn: Arms Trafficking, High-Frequency Trading, extortion.',
    }),

    // --- 4. HİYERARŞİ ---
    defineField({
      name: 'leader',
      title: 'Faction Leader',
      type: 'reference',
      group: 'network',
      to: [{ type: 'character' }],
    }),
    // Not: Üyeler "Character" şemasındaki "faction" alanından "Reverse Reference" ile çekileceği için
    // burada manuel bir 'members' array'ine teknik olarak gerek yok, ama editörde görmek isterseniz tutabilirsiniz.
    // Şimdilik kaldırıyorum çünkü GROQ ile çekiyoruz.
    
    defineField({
      name: 'territory',
      title: 'Linked Location',
      type: 'reference',
      group: 'network',
      to: [{ type: 'location' }],
    }),
  ],
  
  preview: {
    select: {
      title: 'title',
      subtitle: 'type',
      media: 'image',
    },
  },
});