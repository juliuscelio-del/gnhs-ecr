import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // required: Electron loads the app via file://
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
