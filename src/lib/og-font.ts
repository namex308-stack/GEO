/**
 * Loads a Google Font's TTF glyph data for the exact text used in an OG/Twitter
 * image, so `next/og` (Satori) can render Arabic script. Subsetting by `text`
 * keeps the request small and avoids bundling a full font file.
 */
export async function loadGoogleFont(
  font: string,
  text: string,
  weight = 700
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);

  if (match) {
    const res = await fetch(match[1]);
    if (res.status === 200) {
      return await res.arrayBuffer();
    }
  }

  throw new Error(`Failed to load font data for ${font}`);
}
