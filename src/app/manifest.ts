import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrunaShop2 - Sistema de Administración',
    short_name: 'BrunaShop2',
    description: 'Sistema de punto de venta y catálogo online para BrunaShop2.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ff2d55',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
