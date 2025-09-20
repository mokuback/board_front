import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // server: {
  //   https: {
  //     key: path.resolve(__dirname, './certs/key.pem'),
  //     cert: path.resolve(__dirname, './certs/cert.pem')
  //   },
  //   port: 3000
  // }
})
