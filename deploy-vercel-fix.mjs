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

// 실행 안정화:
// - 호출 방식에 따라 process.argv에 "deploy"가 빠질 수 있음
// - 즉시 종료로 인해 CLI 로직이 덜 실행될 수 있음
// 따라서 "vercel deploy"로 process.argv를 강제하고 await import로 보장한다.
const cliArgs = process.argv.slice(2);
const hasDeployWord = cliArgs.includes('deploy') || cliArgs.includes('--prod') || cliArgs.includes('--production');
process.argv = [process.argv[0], 'vercel', ...(hasDeployWord ? cliArgs : ['deploy', ...cliArgs])];

try {
  await import(pathToFileURL(vercelPath).href);
} catch (err) {
  console.error('❌ Failed to run Vercel:', err);
  process.exitCode = 1;
}
