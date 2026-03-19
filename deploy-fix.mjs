import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Monkey patch os.hostname to avoid non-ASCII characters in HTTP headers
os.hostname = () => 'Robot-PC';

console.log('🚀 [Cursor Pro 500%] Vercel CLI Patch Applied!');
console.log('🛠️ Bypassing non-ASCII hostname issue...');

// Path to Vercel CLI entry point
const vercelPath = path.join(__dirname, 'node_modules', 'vercel', 'dist', 'vc.js');

// 실행 안정화( deploy 모드 강제 + await import ):
const cliArgs = process.argv.slice(2);
const hasDeployWord = cliArgs.includes('deploy') || cliArgs.includes('--prod') || cliArgs.includes('--production');
process.argv = [process.argv[0], 'vercel', ...(hasDeployWord ? cliArgs : ['deploy', ...cliArgs])];

try {
  await import(pathToFileURL(vercelPath).href);
} catch (err) {
  console.error('❌ Failed to load Vercel CLI:', err);
  process.exitCode = 1;
}
