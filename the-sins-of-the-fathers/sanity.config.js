import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';
import { colorInput } from '@sanity/color-input'

import { schemaTypes } from './schemaTypes/index.ts';

export default defineConfig({
  name: 'default',
  title: 'The Sins of the Fathers', 

  projectId: '8cfeoaz2', 
  dataset: 'production',       

  plugins: [deskTool(), visionTool(), colorInput()],

  schema: {
    types: schemaTypes,
  },
});