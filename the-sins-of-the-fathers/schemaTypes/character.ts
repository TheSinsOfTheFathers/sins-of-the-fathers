// schemas/character.ts

import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'character',
  title: 'Character',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
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
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'is_main',
      title: 'Main Character?',
      type: 'boolean',
      initialValue: false,
    }),
    // YENİ: Kısa Açıklama Alanı
    defineField({
      name: 'description',
      title: 'Short Description / Teaser',
      type: 'text',
      description: 'Karakter listesi ve meta etiketleri için kullanılacak kısa, tanıtıcı metin.',
    }),
    // 'bio' alanını 'story' olarak yeniden adlandırdık
    defineField({
      name: 'story',
      title: 'Story / Biography',
      type: 'array',
      description: "Karakterin tam hikayesi veya biyografisi.",
      of: [{type: 'block'}],
    }),
    // YENİ: Diğer karakterlerle ilişkiler (Metin tabanlı)
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
    // YENİ: Aile Ağacı İlişkileri (Referans tabanlı - En Güçlü Yöntem)
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
                    to: [{type: 'character'}] // Başka bir "character" belgesine referans
                },
                {
                    name: 'relation',
                    title: 'Relation Type',
                    type: 'string',
                    // İlişki türleri için önceden tanımlı bir liste sunabiliriz
                    options: {
                        list: ['spouse', 'parent', 'child', 'sibling']
                    }
                }
            ]
        }]
    })
  ],
})