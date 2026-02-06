import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

export const client = createClient({
  projectId: '8cfeoaz2', 
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-11-28',
});

const builder = createImageUrlBuilder(client);

export const urlFor = (source) => {
  return builder.image(source);
};