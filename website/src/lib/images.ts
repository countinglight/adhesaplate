import type { ImageMetadata } from "astro";

// Data files name images by file name; this resolves a name to the imported
// asset so astro:assets can resize and re-encode it.
const modules = import.meta.glob<ImageMetadata>("../assets/img/**/*.{jpg,png}", {
  eager: true,
  import: "default",
});

export function image(fileName: string): ImageMetadata {
  const found = modules[`../assets/img/${fileName}`];
  if (!found) {
    throw new Error(`Image not found in src/assets/img: ${fileName}`);
  }
  return found;
}
