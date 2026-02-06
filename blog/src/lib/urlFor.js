import { sanityClient } from "sanity:client";
import { createImageUrlBuilder } from '@sanity/image-url'

export const imageBuilder = createImageUrlBuilder(sanityClient);

export function urlFor(source) {
  return imageBuilder.image(source);
}
