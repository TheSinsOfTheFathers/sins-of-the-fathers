import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'lore',
  title: 'Lore Archive (Arşiv Belgesi)',
  type: 'document',
  groups: [
    {name: 'meta', title: 'File Metadata'},
    {name: 'content', title: 'Document Content'},
    {name: 'connections', title: 'Linked Entities'},
  ],
  fields: [
    defineField({
      name: 'title_en',
      title: 'Document Title',
      type: 'string',
      group: 'meta',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'File ID (Slug)',
      type: 'slug',
      options: { source: 'title_en', maxLength: 96 },
      group: 'meta',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
        name: 'loreType',
        title: 'Record Type',
        type: 'string',
        options: {
            list: [
                { title: 'Text Document', value: 'document' },
                { title: 'Audio Log / Intercept', value: 'audio' },
                { title: 'Visual Evidence', value: 'image' },
            ],
            layout: 'radio'
        },
        initialValue: 'document',
        group: 'meta',
    }),
    defineField({
        name: 'restricted',
        title: 'Classified / Member Only?',
        type: 'boolean',
        description: 'Aktifse belge bulanık (locked) görünür.',
        initialValue: false,
        group: 'meta',
    }),
    defineField({
        name: 'date',
        title: 'Record Date',
        type: 'date',
        group: 'meta',
    }),
    defineField({
        name: 'author',
        title: 'Author / Recorded By',
        type: 'string',
        group: 'meta',
    }),
    defineField({
        name: 'source',
        title: 'Source Origin',
        type: 'string',
        description: 'Örn: "Recovered Hard Drive", "Police Intercept".',
        group: 'meta',
    }),
    defineField({
      name: 'summary_en',
      title: 'Abstract / Summary',
      type: 'text',
      rows: 3,
      group: 'content',
    }),
    defineField({
      name: 'content_en',
      title: 'Full Document Content',
      type: 'array',
      group: 'content',
      of: [
        {
            type: 'block',
            marks: {
                decorators: [
                    { title: 'Strong', value: 'strong' },
                    { title: 'Emphasis', value: 'em' },
                    // Sansürlü metin özelliği
                    { title: 'Redacted (Sansürlü)', value: 'redact', icon: () => '⬛' } 
                ]
            }
        }
      ],
    }),
    defineField({
      name: 'mainImage',
      title: 'Evidence Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
    }),
    defineField({
        name: 'relatedCharacters',
        title: 'Tagged Characters',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'character'}]}],
        group: 'connections'
    }),
    defineField({
        name: 'relatedFactions',
        title: 'Tagged Factions',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'faction'}]}],
        group: 'connections'
    }),
    defineField({
        name: 'order',
        title: 'Sort Order',
        type: 'number',
        hidden: true
    })
  ],
  preview: {
    select: {
      title: 'title_en',
      subtitle: 'loreType',
      media: 'mainImage',
    },
  },
})