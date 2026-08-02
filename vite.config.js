import { copyFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages publica el sitio dentro de una subcarpeta con el nombre del
// repositorio. Se puede sobrescribir con VITE_BASE (por ejemplo "/" si algún
// día se despliega en un dominio propio).
const BASE = process.env.VITE_BASE ?? '/zibavenezuela/'

/**
 * GitHub Pages no sabe reescribir las rutas de una aplicación de una sola
 * página: al entrar directo a /mujer devolvería un 404. Sirviendo el mismo
 * HTML como 404.html, la aplicación arranca igual y el router resuelve la
 * ruta. El archivo .nojekyll evita que Pages ignore carpetas con guión bajo.
 */
function githubPages() {
  return {
    name: 'ziba-github-pages',
    apply: 'build',
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist/', import.meta.url))
      copyFileSync(`${dist}index.html`, `${dist}404.html`)
      writeFileSync(`${dist}.nojekyll`, '')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [react(), githubPages()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
