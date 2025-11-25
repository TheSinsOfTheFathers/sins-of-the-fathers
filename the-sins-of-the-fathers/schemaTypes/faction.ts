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
    {name: 'diplomacy', title: 'Diplomatic Relations'}, 
  ],
  fields: [
    defineField({
      name: 'title',
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

    defineField({
      name: 'color',
      title: 'Theme Color (Hex Code)',
      type: 'color', 
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
      name: 'icon',
      title: 'Tactical Icon',
      type: 'image',
      group: 'visuals',
    }),

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
      name: 'description',
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

    defineField({
      name: 'relations',
      title: 'Diplomatic Relations',
      type: 'array',
      group: 'diplomacy',
      description: 'Diğer fraksiyonlarla olan durumunu tanımlayın.',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'target',
            title: 'Target Faction',
            type: 'reference',
            to: [{type: 'faction'}]
          },
          {
            name: 'status',
            title: 'Relation Status',
            type: 'string',
            options: {
              list: [
                {title: 'Hostile (Düşman)', value: 'hostile'},
                {title: 'Ally (Müttefik)', value: 'ally'},
                {title: 'Neutral (Nötr)', value: 'neutral'},
                {title: 'Vassal (Himaye Altında)', value: 'vassal'},
                {title: 'Suzerain (Efendi/Koruyucu)', value: 'suzerain'},
                {title: 'Rival (Ticari Rakip)', value: 'rival'}
              ]
            }
          },
          {
            name: 'description',
            title: 'Note / Intel',
            type: 'string',
            description: 'İlişkinin nedenini açıklayan kısa not. (Örn: "Trade embargo since 1999")'
          }
        ],
        preview: {
          select: {
            title: 'target.title',
            subtitle: 'status'
          }
        }
      }]
    }),

    defineField({
      name: 'leader',
      title: 'Faction Leader',
      type: 'reference',
      group: 'network',
      to: [{ type: 'character' }],
    }),
    
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