import images from "../generated/public-images.json";

// Keep content IDs and saved figure paths stable while public files are versioned.
export function publicImage(src: string): string {
 return (images as Record<string,string>)[src] ?? src;
}
