import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'main/index.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['playwright', 'playwright-core', 'sqlite3'],
              output: {
                format: 'cjs',
                entryFileNames: 'main/[name].js',
              },
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'preload/index.ts'),
        vite: {
          build: {
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'preload/[name].js',
              }
            }
          }
        }
      }
    }),
  ],
})
