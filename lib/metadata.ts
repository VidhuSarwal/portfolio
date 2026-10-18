import type { Metadata } from 'next';

export const SITE_NAME = 'Vidhu Sarwal';
export const X_HANDLE = '@vidhu_sarwal';

// A child segment's `openGraph` / `twitter` objects *replace* the root
// layout's wholesale, and if a page sets none it inherits the homepage's
// og:url, og:title and canonical. Every sub-route therefore builds its full
// share metadata here. Images come from the nearest opengraph-image.tsx.
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const shareTitle = `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url: path,
      title: shareTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      creator: X_HANDLE,
      title: shareTitle,
      description,
    },
  };
}
