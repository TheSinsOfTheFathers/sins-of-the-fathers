import createClient from 'https://esm.sh/@sanity/client@3.3.0';
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url@1.2.0';

export const client = createClient({
  projectId: '8cfeoaz2', 
  dataset: 'production',
  useCdn: true, 
  apiVersion: '2025-11-09',
})

const builder = imageUrlBuilder(client);
export const urlFor = (source) => builder.image(source);