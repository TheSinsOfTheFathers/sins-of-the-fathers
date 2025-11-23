import { createClient } from 'https://esm.sh/@sanity/client'; 
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url';

export const client = createClient({
  projectId: '8cfeoaz2', 
  dataset: 'production',
  useCdn: true, 
  apiVersion: '2025-11-09',
});

const builder = imageUrlBuilder(client);

export const urlFor = (source) => {
  if (!source) return undefined; 
  return builder.image(source);
};