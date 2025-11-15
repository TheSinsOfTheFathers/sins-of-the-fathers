// schemas/location.ts

import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'location',
  title: 'Lokasyon',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Lokasyon Adı',
      type: 'string',
      description: 'Mekanın tam adı (Örn: "Villa Alchemica").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Adresi (Slug)',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Ana Görsel',
      type: 'image',
      description: 'Lokasyon listeleme sayfasında görünecek olan ana görsel.',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Özet',
      type: 'text',
      description: 'Lokasyon kartında görünecek olan kısa tanıtım metni.',
      validation: (Rule) => Rule.max(250),
    }),
    defineField({
      name: 'description',
      title: 'Detaylı Açıklama',
      type: 'array',
      description: 'Lokasyonun detay sayfasında yer alacak olan tam tarihçesi ve açıklaması.',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'coordinates',
      title: 'Koordinatlar',
      type: 'geopoint',
      description: 'İnteraktif harita için bu lokasyonun yerini işaretleyin.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'mainImage',
    },
  },
});