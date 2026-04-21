import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss', // отключаем lightningcss, используем postcss для Tailwind
  },
})