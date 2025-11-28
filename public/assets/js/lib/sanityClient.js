import { createClient } from 'https://esm.sh/@sanity/client@6.22.0';
import imageUrlBuilder from 'https://esm.sh/@sanity/image-url@1.1.0';

export const client = createClient({
  projectId: '8cfeoaz2', 
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-11-28',
});

let builderInstance;

try {
    const builderSource = imageUrlBuilder;

    if (typeof builderSource === 'function') {
        builderInstance = builderSource(client);
    } else if (builderSource && typeof builderSource.default === 'function') {
        builderInstance = builderSource.default(client);
    } else {
        console.error("Sanity Image Builder Yüklenemedi:", builderSource);
    }
} catch (error) {
    console.error("Builder Başlatma Hatası:", error);
}

export const urlFor = (source) => {
  if (!builderInstance || !source) return undefined;
  return builderInstance.image(source);
};