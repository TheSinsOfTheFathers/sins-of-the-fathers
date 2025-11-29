import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'character',
  title: 'Karakter',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Identity & Stats'},
    {name: 'media', title: 'Visuals'},
    {name: 'biography', title: 'Biography & Lore'},
    {name: 'network', title: 'Connections (Graph)'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alias',
      title: 'Alias / Codename',
      type: 'string',
      description: 'Örn: "The Exile", "The Wolf", "The Bastard". Ana başlığın altında görünür.',
      group: 'identity',
    }),
    defineField({
      name: 'title',
      title: 'Role / Title',
      type: 'string',
      description: 'Örn: "Head of House", "Enforcer", "Intelligence Officer".',
      group: 'identity',
    }),
    defineField({
      name: 'status',
      title: 'Vital Status',
      type: 'string',
      description: 'Karakterin güncel durumu (Arayüzde renkli rozet olarak görünür).',
      options: {
        list: [
          {title: 'Active', value: 'Active'},
          {title: 'Deceased', value: 'Deceased'},
          {title: 'MIA (Missing)', value: 'MIA'},
          {title: 'Incarcerated', value: 'Incarcerated'},
          {title: 'Unknown', value: 'Unknown'},
        ],
        layout: 'radio'
      },
      initialValue: 'Active',
      group: 'identity',
    }),
    defineField({
      name: 'faction',
      title: 'Allegiance (Faction)',
      type: 'reference',
      to: [{type: 'faction'}],
      description: 'Karakter hangi hizi/gruba bağlı?',
      group: 'identity',
    }),
    defineField({
      name: 'origin',
      title: 'Place of Origin',
      type: 'string',
      description: 'Örn: "Glasgow, Scotland" veya "Los Angeles, USA"',
      group: 'identity',
    }),
    defineField({
        name: 'is_main',
        title: 'Main Character?',
        type: 'boolean',
        initialValue: false,
        description: 'İşaretlenirse karakter listesinde "Hero Card" veya "Mugshot" olarak öne çıkar.',
        group: 'identity',
    }),

    defineField({
      name: 'image',
      title: 'Main Profile Image',
      type: 'image',
      options: { hotspot: true },
      group: 'media',
    }),

    defineField({
      name: 'quote',
      title: 'Signature Quote',
      type: 'text',
      rows: 3,
      description: 'Karakteri tanımlayan kısa bir söz.',
      group: 'biography',
    }),
    defineField({
      name: 'description',
      title: 'Short Teaser',
      type: 'text',
      rows: 3,
      description: 'Listelerde görünecek kısa tanıtım.',
      group: 'biography',
    }),
    defineField({
      name: 'story', 
      title: 'Full Biography (Portable Text)',
      type: 'array',
      of: [{type: 'block'}],
      group: 'biography',
    }),

    defineField({
      name: 'relationships',
      title: 'Network Connections',
      type: 'array',
      group: 'network',
      description: 'Dostlar, düşmanlar, ortaklar. D3 Grafiğinde gri çizgi olur.',
      of: [{
        type: 'object',
        fields: [
          {
            name: 'character',
            type: 'reference',
            to: [{type: 'character'}]
          },
          {
            name: 'status', 
            title: 'Relation Type', 
            type: 'string',
            description: 'Örn: Rival, Ally, Informant' 
          }
        ],
        preview: {
            select: {
                title: 'character.name',
                subtitle: 'status',
                media: 'character.image'
            }
        }
      }]
    }),
    defineField({
        name: 'family',
        title: 'Bloodline (Family Tree)',
        type: 'array',
        group: 'network',
        description: 'Kan bağları. D3 Grafiğinde ALTIN çizgi olur.',
        of: [{
            type: 'object',
            fields: [
                {
                    name: 'character',
                    title: 'Relative',
                    type: 'reference',
                    to: [{type: 'character'}]
                },
                {
                    name: 'relation',
                    title: 'Kinship',
                    type: 'string',
                    options: {
                      list: ['Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Uncle', 'Spouse']
                    }
                }
            ],
            preview: {
                select: {
                    title: 'character.name',
                    subtitle: 'relation',
                    media: 'character.image'
                }
            }
        }]
    }),
    defineField({
      name: 'familyTree',
      title: 'Legacy Family Tree Data (Mermaid)',
      type: 'text',
      rows: 5,
      hidden: true, 
      group: 'network',
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'alias',
      media: 'image',
    },
  },
})