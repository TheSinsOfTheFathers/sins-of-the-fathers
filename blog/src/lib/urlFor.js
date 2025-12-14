import { sanityClient } from "sanity:client"; // 👈 Değişen kısım
import imageUrlBuilder from "@sanity/image-url";

export const imageBuilder = imageUrlBuilder(sanityClient);

export function urlFor(source) {
  return imageBuilder.image(source);
}