import os from 'os';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

// 1. Monkey patch OS 정보 (Vercel CLI가 User-Agent나 Header 만들 때 사용함)
os.hostname = () => 'Unicorn-PC';
os.userInfo = () => ({
  username: 'unicorn',
  uid: -1,
  gid: -1,
  shell: null,
  homedir: os.homedir()
});

console.log('🚀 [Cursor Pro] Vercel CLI Header Fix Applied!');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Vercel CLI 경로 찾기
const vercelPath = path.join(__dirname, 'node_modules', 'vercel', 'dist', 'vc.js');

// 실행
import(pathToFileURL(vercelPath).href).catch(err => {
  console.error('❌ Failed to run Vercel:', err);
});
