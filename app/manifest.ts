import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Firn',
    short_name: 'firn',
    description: 'A simulated savings experience.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#08141D',
    theme_color: '#08141D',
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
