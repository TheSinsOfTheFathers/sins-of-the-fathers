// schemas/faction.ts

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'faction',
  title: 'Fraksiyon',
  type: 'document',
  fields: [
    // --- Temel Bilgiler ---
    defineField({
      name: 'name',
      title: 'Fraksiyon Adı',
      type: 'string',
      description: 'Fraksiyonun resmi adı (Örn: "Nuovo Regno").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Adresi (Slug)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      description: 'Bu fraksiyon için kullanılacak benzersiz URL adresi.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo / Arma',
      type: 'image',
      description: "Fraksiyonun resmi sembolü veya arması.",
      options: { hotspot: true },
    }),
    defineField({
      name: 'status',
      title: 'Durum',
      type: 'string',
      description: 'Fraksiyonun mevcut operasyonel durumu.',
      options: {
        list: [
          { title: 'Aktif', value: 'active' },
          { title: 'Dağılmış', value: 'defunct' },
          { title: 'Gizli', value: 'hidden' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
    }),

    // --- İçerik ve Hikaye ---
    defineField({
      name: 'summary',
      title: 'Özet / Tanıtım Metni',
      type: 'text',
      description: 'Fraksiyon listeleme sayfası ve meta etiketleri (SEO) için kullanılacak kısa özet.',
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
        name: 'motto',
        title: 'Motto / Slogan',
        type: 'string',
        description: 'Fraksiyonun mottosu veya sıkça kullandığı slogan.',
    }),
    defineField({
        name: 'philosophy',
        title: 'Felsefe',
        type: 'text',
        description: 'Fraksiyonun temel inancını veya dünya görüşünü özetleyen metin.',
    }),
    defineField({
        name: 'economy',
        title: 'Ekonomik Alan',
        type: 'string',
        description: 'Fraksiyonun ana ekonomik faaliyeti veya gelir kaynağı (Örn: Silah Kaçakçılığı, Teknoloji).',
    }),
    defineField({
      name: 'history', // 'description' yerine 'history' olarak adlandırmak daha anlamlı
      title: 'Tarihçe / Detaylı Açıklama',
      type: 'array',
      description: 'Fraksiyonun detay sayfası için tam tarihçesi ve ayrıntılı açıklaması.',
      of: [{ type: 'block' }], // Zengin metin editörü (Portable Text)
    }),

    // --- İlişkiler ve Hiyerarşi (Referans Tabanlı) ---
    defineField({
      name: 'leader',
      title: 'Lider',
      type: 'reference',
      description: 'Fraksiyonun birincil lideri. Bu alan bir karakter belgesine bağlanır.',
      to: [{ type: 'character' }],
    }),
    defineField({
      name: 'members',
      title: 'Önemli Üyeler',
      type: 'array',
      description: 'Fraksiyonun diğer önemli üyeleri.',
      of: [{
        type: 'reference',
        to: [{ type: 'character' }],
      }],
    }),
    defineField({
      name: 'territory',
      title: 'Ana Bölge / Karargah',
      type: 'reference',
      description: 'Ana operasyon üssü veya kontrol edilen bölge. Bu alan bir lokasyon belgesine bağlanır.',
      to: [{ type: 'location' }],
    }),

    // --- İnteraktif Harita Verisi ---
    defineField({
      name: 'territoryPolygon',
      title: 'Bölge Sınırları (Siyasi Harita için)',
      type: 'text',
      description: 'Fraksiyonun sınırlarını GeoJSON poligon formatında tanımlayın. Bu veriyi oluşturmak için geojson.io gibi bir araç kullanıp buraya yapıştırabilirsiniz.',
      rows: 10,
    }),
  ],
  
  preview: {
    select: {
      title: 'name',
      subtitle: 'status',
      media: 'logo',
    },
  },
});