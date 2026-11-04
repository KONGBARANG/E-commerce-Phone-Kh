export function getProductImageUrl(imageUrl, width) {
  if (!imageUrl?.startsWith('https://images.unsplash.com/')) return imageUrl;

  try {
    const url = new URL(imageUrl);
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '90');
    return url.toString();
  } catch {
    return imageUrl;
  }
}
