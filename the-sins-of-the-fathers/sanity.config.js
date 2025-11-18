import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';

// Bu satır, şemalarının bulunduğu klasöre işaret eder.
// Eğer şemaların 'studio/schemas' içindeyse, bu yol doğrudur.
import { schemaTypes } from './schemaTypes/index.ts';

export default defineConfig({
  name: 'default',
  title: 'The Sins of the Fathers', // <-- Burayı projenin adıyla değiştirebilirsin

  projectId: '8cfeoaz2', // <-- BU KRİTİK BİLGİYİ EKLE
  dataset: 'production',         // <-- Genellikle 'production' olur, kontrol et

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});