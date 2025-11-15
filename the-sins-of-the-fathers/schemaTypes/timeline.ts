import { defineField, defineType } from 'sanity';

const eventFields = [
  defineField({
    name: 'title',
    title: 'Olay Başlığı',
    type: 'string',
    description: 'Olayın Başlığını girin.',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'text',
    title: 'Olay Metni',
    type: 'text',
    description: 'Olayın detaylı açıklamasını girin.',
    rows: 3,
  }),
];

export default defineType({
  name: 'timelineEra',
  title: 'Zaman Çizelgesİ',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Sıra Numarası',
      type: 'number',
      description: 'Dönemlerin doğru sırada gösterilmesi için sıralama numarası (Örn: 1, 2, 3...).',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'title',
      title: 'Dönem Başlığı',
      type: 'string',
      description: 'Dönemin başlığını girin (Örn: "The Mercantile Era (1200 - 1925)").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'events',
      title: 'Olaylar',
      type: 'array',
      description: 'Bu döneme ait önemli olayları buraya ekleyin.',
      of: [{
        title: 'Olay',
        type: 'object',
        fields: eventFields,
        preview: {
          select: {
            title: 'title',
            subtitle: 'text',
          },
        },
      }],
    }),
  ],
  orderings: [{
    title: 'Sıraya Göre',
    name: 'orderAsc',
    by: [{ field: 'order', direction: 'asc' }],
  }],
  preview: {
    select: {
      title: 'title',
      subtitle: 'order',
    },
    prepare({ title, subtitle }) {
      return {
        title: title,
        subtitle: `Sıra: ${subtitle}`,
      };
    },
  },
});