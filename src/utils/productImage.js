export function getProductImageUrl(imageUrl, width) {
  if (!imageUrl?.startsWith('https://images.unsplash.com/')) return imageUrl;

  try {
    const url = new URL(imageUrl);
    const pixelRatio = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    url.searchParams.set('w', String(Math.ceil(Math.min(Number(width) * pixelRatio, 2400))));
    url.searchParams.delete('h');
    url.searchParams.set('fit', 'max');
    url.searchParams.set('auto', 'format');
    url.searchParams.set('q', '95');
    return url.toString();
  } catch {
    return imageUrl;
  }
}
