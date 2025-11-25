import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'timelineEra', 
  title: 'Timeline Era (Zaman Dilimi)',
  type: 'document',
  fields: [
    defineField({
      name: 'title_en',
      title: 'Era Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Chronological Order',
      type: 'number',
      description: 'Dönemlerin sıralaması (1, 2, 3...).',
    }),
    defineField({
        name: 'events',
        title: 'Events in this Era',
        type: 'array',
        of: [{
            type: 'object',
            name: 'event',
            fields: [
                {name: 'date', title: 'Date', type: 'date', description: 'YYYY-MM-DD (veya sadece yıl seçin).'},
                {name: 'title_en', title: 'Event Headline', type: 'string'},
                {name: 'text_en', title: 'Description', type: 'text', rows: 3},
                {
                    name: 'image', 
                    title: 'Visual Record', 
                    type: 'image', 
                    fields: [
                        {name: 'caption', type: 'string', title: 'Caption'},
                        {name: 'credit', type: 'string', title: 'Credit'}
                    ]
                },
                {name: 'relatedLocation', type: 'reference', to: [{type: 'location'}], title: 'Location Ref'},
            ]
        }]
    })
  ],
  orderings: [
    {
      title: 'Chronological',
      name: 'chronological',
      by: [
        {field: 'order', direction: 'asc'}
      ]
    }
  ]
})