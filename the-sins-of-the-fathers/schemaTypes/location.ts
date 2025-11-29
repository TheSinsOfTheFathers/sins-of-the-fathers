import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'location',
  title: 'Location (Saha/Konum)',
  type: 'document',
  groups: [
    {name: 'tactical', title: 'Tactical Data'},
    {name: 'intel', title: 'Intel & Description'},
    {name: 'media', title: 'Surveillance Images'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Location Name',
      type: 'string',
      group: 'tactical',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (ID)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      group: 'tactical',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
        name: 'faction',
        title: 'Controlling Faction',
        type: 'reference',
        description: 'Bu bölgeyi kim yönetiyor? Haritada marker rengini belirler.',
        to: [{type: 'faction'}],
        group: 'tactical',
    }),
    defineField({
        name: 'location', 
        title: 'GeoCoordinates',
        type: 'geopoint',
        description: 'Harita üzerindeki kesin nokta (Enlem/Boylam).',
        group: 'tactical',
    }),
    
    defineField({
        name: 'status',
        title: 'Operational Status',
        type: 'string',
        options: {
            list: [
                {title: 'Active', value: 'Active'},
                {title: 'Compromised', value: 'Compromised'},
                {title: 'Abandoned', value: 'Abandoned'},
                {title: 'Lockdown', value: 'Lockdown'}
            ],
            layout: 'radio'
        },
        initialValue: 'Active',
        group: 'tactical',
    }),
    defineField({
        name: 'securityLevel',
        title: 'Threat Level',
        type: 'string',
        description: 'Bu bölgeye giriş ne kadar tehlikeli? (Renk kodunu belirler)',
        options: {
            list: [
                {title: 'Low (Safe)', value: 'Low'},
                {title: 'Moderate (Caution)', value: 'Moderate'},
                {title: 'Elevated (Armed)', value: 'Elevated'},
                {title: 'High (Hostile)', value: 'High'},
                {title: 'Critical (Kill on Sight)', value: 'Critical'},
            ],
        },
        initialValue: 'Moderate',
        group: 'tactical',
    }),

    defineField({
      name: 'summary',
      title: 'Brief Intelligence',
      type: 'text',
      rows: 3,
      description: 'Haritada marker üzerine gelince (popup) çıkan kısa özet.',
      group: 'intel',
    }),
    defineField({
      name: 'description',
      title: 'Full Surveillance Report',
      type: 'array',
      of: [{type: 'block'}],
      group: 'intel',
    }),

    defineField({
      name: 'mainImage',
      title: 'Surveillance Feed Image',
      type: 'image',
      options: { hotspot: true },
      group: 'media',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'faction.title',
      media: 'mainImage',
    },
  },
})