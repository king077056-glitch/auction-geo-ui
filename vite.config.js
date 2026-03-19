import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 로컬 네이티브 크래시 방지용 임시 안전장치:
    // Vercel 빌드(Linux)에서는 정상일 수 있으나, 대표님 PC에서는 빌드가 transform 이후 비정상 종료한다.
    // 먼저 minify/cssMinify를 끄고 빌드 통과 여부를 확인한다.
    minify: false,
    cssMinify: false,
    rollupOptions: {
      input: './index.html'
    }
  }
})
