import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.ts',
      formats: ['es']
    },
    rollupOptions: {
      external: ['node-telegram-bot-api', 'ethers', 'dotenv', 'express', 'cors', 'ws', 'axios']
    }
  },
  server: {
    port: 3000
  }
})
