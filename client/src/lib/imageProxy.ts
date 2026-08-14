/**
 * Konva draws images onto a canvas with crossOrigin="anonymous", which requires the source to
 * send CORS headers — TMDB's image CDN doesn't. Route remote images through our own server so
 * the browser sees a same-origin request instead. Local assets (served from /assets, /uploads)
 * are already same-origin and pass through unchanged.
 */
export function proxiedImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
