import { createClient, SanityClient } from '@sanity/client';
import imageUrlBuilder, { ImageUrlBuilder } from '@sanity/image-url';

export type { SanityClient, ImageUrlBuilder };

export const client: SanityClient = createClient({
  projectId: '8cfeoaz2',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-11-28',
});

const builder: ImageUrlBuilder = imageUrlBuilder(client);

export const urlFor = (source: Parameters<ImageUrlBuilder['image']>[0]): ImageUrlBuilder => {
  return builder.image(source);
};
