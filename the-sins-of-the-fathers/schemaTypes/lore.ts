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
      description: 'Belgenin veya kaydın ana başlığı. Listelerde bu isim görünür.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'File ID (Slug)',
      type: 'slug',
      options: { source: 'title_en', maxLength: 96 },
      group: 'meta',
      description: 'URL kısmında görünecek kimlik. "Generate" butonuna basarak oluşturun.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
        name: 'loreType',
        title: 'Record Type',
        type: 'string',
        description: '⚠️ DİKKAT: Buradaki seçiminize göre aşağıda "Ses Dosyası" veya "Fotoğraf" alanları açılıp kapanacaktır.',
        options: {
            list: [
                { title: 'Text Document (Yazılı Belge)', value: 'document' },
                { title: 'Audio Log / Intercept (Ses Kaydı)', value: 'audio' },
                { title: 'Visual Evidence (Kanıt Fotoğrafı)', value: 'image' },
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
        description: 'İşaretlenirse belge "GİZLİ" olarak etiketlenir ve içeriği bulanıklaştırılır.',
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
        description: 'Belgeyi yazan veya ses kaydındaki konuşmacı (Örn: Detective Miller).',
        group: 'meta',
    }),
    defineField({
        name: 'source',
        title: 'Source Origin',
        type: 'string',
        description: 'Kaynağın bulunduğu yer (Örn: "Recovered Hard Drive", "Police Intercept").',
        group: 'meta',
    }),
    defineField({
      name: 'summary_en',
      title: 'Abstract / Summary',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Listeleme ekranındaki kartlarda görünecek kısa özet. Burayı her tür için doldurmanız önerilir.',
    }),
    
    // --- İÇERİK ALANI (DOCUMENT TİPİ İÇİN) ---
    defineField({
      name: 'content_en',
      title: 'Full Document Content',
      type: 'array',
      group: 'content',
      description: "📝 NOT: Sadece 'Text Document' seçili ise buraya metin girmek zorunludur. Audio veya Image için boş bırakabilirsiniz.",
      of: [
        {
            type: 'block',
            marks: {
                decorators: [
                    { title: 'Strong', value: 'strong' },
                    { title: 'Emphasis', value: 'em' },
                    { title: 'Redacted', value: 'redact', icon: () => '⬛' } 
                ]
            }
        }
      ],
      validation: (Rule) => Rule.custom((value, context) => {
        if (context.document?.loreType === 'document' && (!value || value.length === 0)) {
            return 'Document type requires text content.';
        }
        return true;
      }),
    }),
    
    // --- SES DOSYASI (SADECE AUDIO TİPİNDE GÖRÜNÜR) ---
    defineField({
        name: 'audioFile',
        title: 'Audio Recording',
        type: 'file',
        options: { accept: 'audio/*' },
        group: 'content',
        description: "🎤 Sadece 'Audio Log' türü seçildiğinde görünür.",
        // Mantık: LoreType 'audio' DEĞİLSE gizle.
        hidden: ({document}) => document?.loreType !== 'audio',
        
        validation: (Rule) => Rule.custom((value, context) => {
            if (context.document?.loreType === 'audio' && !value) {
                return 'Audio Log requires an uploaded file!';
            }
            return true;
        })
    }),

    // --- GÖRSEL (SADECE IMAGE TİPİNDE GÖRÜNÜR) ---
    defineField({
      name: 'mainImage',
      title: 'Evidence Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
      description: "📸 Sadece 'Visual Evidence' türü seçildiğinde görünür.",
      // Mantık: LoreType 'image' DEĞİLSE gizle. (Yani Document veya Audio ise gizli kalır)
      hidden: ({document}) => document?.loreType !== 'image',
      
      validation: (Rule) => Rule.custom((value, context) => {
        if (context.document?.loreType === 'image' && !value) {
            return 'Visual Evidence requires an image!';
        }
        return true;
      })
    }),

    defineField({
        name: 'relatedCharacters',
        title: 'Tagged Characters',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'character'}]}],
        group: 'connections',
        description: 'Bu belge ile ilişkili karakterleri etiketleyin (Link oluşturur).'
    }),
    defineField({
        name: 'relatedFactions',
        title: 'Tagged Factions',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'faction'}]}],
        group: 'connections',
        description: 'Bu belge ile ilişkili grupları etiketleyin.'
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