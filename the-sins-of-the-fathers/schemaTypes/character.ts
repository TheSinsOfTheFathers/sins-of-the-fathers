import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'character',
  title: 'Karakter',
  type: 'document',
  fields: [
    defineField({
      name: 'Ad',
      title: 'Name',
      type: 'string',
      description: 'Karakterin tam adı.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Karakterin unvanı veya takma adı (varsa).',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Karakterin ana görseli.',
    }),
    defineField({
      name: 'is_main',
      title: 'Main Character?',
      type: 'boolean',
      initialValue: false,
      description: 'Ana karakter olup olmadığını belirtir.',
    }),
    defineField({
      name: 'description',
      title: 'Short Description / Teaser',
      type: 'text',
      description: 'Karakter listesi ve meta etiketleri için kullanılacak kısa, tanıtıcı metin.',
    }),
    defineField({
      name: 'story',
      title: 'Story / Biography',
      type: 'array',
      description: "Karakterin tam hikayesi veya biyografisi.",
      of: [{type: 'block'}],
    }),
    defineField({
        name: 'relationships',
        title: 'Relationships',
        type: 'array',
        of: [{
            type: 'object',
            fields: [
                {name: 'name', type: 'string', title: 'Character Name'},
                {name: 'status', type: 'string', title: 'Relationship Status'}
            ]
        }]
    }),
    defineField({
        name: 'family',
        title: 'Family Tree Links',
        type: 'array',
        description: 'Aile ağacı için bağlantıları buradan kurun.',
        of: [{
            type: 'object',
            fields: [
                {
                    name: 'character',
                    title: 'Related Character',
                    type: 'reference',
                    to: [{type: 'character'}]
                },
                {
                    name: 'relation',
                    title: 'Relation Type',
                    type: 'string',
                    options: {
                      list: ['spouse', 'parent', 'child', 'sibling']
                    }
                }
            ]
        }]
    }),
    defineField({
      name: 'familyTree',
      title: 'Aile Ağacı (Mermaid Kodu)',
      type: 'text',
      description: 'Karakterin aile ağacını Mermaid.js grafik sözdizimi kullanarak buraya girin. Örneğin: "graph TD; A-->B;". Detaylar için mermaid-js.github.io adresini ziyaret edebilirsiniz.',
      rows: 10,
    })
  ],
})