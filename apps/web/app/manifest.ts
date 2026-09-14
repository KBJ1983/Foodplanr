import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'foodplanr',
    short_name: 'foodplanr',
    description: 'Madplan og indkøb på tværs af kæder.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7d3cd6',
    lang: 'da',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
