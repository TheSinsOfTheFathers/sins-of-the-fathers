import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'lore',
  title: 'Lore',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Başlık',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Özet',
      type: 'text',
      rows: 3,
      description: 'SEO ve önizlemeler için kısa bir lore makalesi özeti.',
    }),
    defineField({
      name: 'content',
      title: 'İçerik',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Lore makalesinin ana içeriği.',
    }),
    defineField({
      name: 'order',
      title: 'Sıralama Numarası',
      type: 'number',
      description: 'Lore makalelerinin sıralanması için bir numara. Daha düşük numaralar önce görünür.',
      validation: (Rule) => Rule.integer(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'summary',
    },
  },
})
