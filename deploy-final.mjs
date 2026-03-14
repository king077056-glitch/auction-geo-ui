#!/usr/bin/env node
/**
 * Vercel 프로덕션 배포 - User-Agent/한글 완전 차단
 * process.env, os, http/https 패치 후 '이로보트'가 서버로 절대 못 나가게
 */

// ① 최상단: process.env 강제 영문화
process.env.USERNAME = 'UnicornUser';
process.env.USER = 'UnicornUser';
process.env.USERDOMAIN = 'UnicornDomain';
process.env.COMPUTERNAME = 'UnicornPC';
process.env.HOSTNAME = 'UnicornPC';
process.env.LOGNAME = 'UnicornUser';
process.env.USERAGENT = 'Vercel-CLI/Unicorn';
process.env.USER_AGENT = 'Vercel-CLI/Unicorn';
process.env.HTTP_USER_AGENT = 'Vercel-CLI/Unicorn';

import http from 'http';
import https from 'https';
import os from 'os';

// ② os Monkey Patch
os.hostname = () => 'UnicornPC';
os.userInfo = () => ({ username: 'UnicornUser' });

// ③ 한글/이로보트 감지 → 무조건 영어로 치환
const hasKorean = (s) => typeof s === 'string' && /[가-힣ㄱ-ㅎㅏ-ㅣ]|이로보트/.test(s);
const sanitizeValue = (v) => (hasKorean(v) ? 'UnicornUser' : v);

// ④ headers 정제: User-Agent는 무조건 덮어쓰기, 나머지는 한글 replace
function sanitizeHeaders(headers) {
  if (!headers) return headers;
  const isArray = Array.isArray(headers);
  const result = isArray ? [] : {};
  const processEntry = (key, val) => {
    const k = typeof key === 'string' ? key.toLowerCase() : String(key).toLowerCase();
    const v = val != null ? String(val) : '';
    const final = k === 'user-agent' ? 'UnicornAgent' : sanitizeValue(v);
    if (isArray) result.push([key, final]);
    else result[k] = final;
  };
  if (isArray) {
    for (const [k, v] of headers) processEntry(k, v);
    if (!headers.some(([k]) => String(k).toLowerCase() === 'user-agent')) {
      result.push(['User-Agent', 'UnicornAgent']);
    }
  } else {
    for (const [k, v] of Object.entries(headers)) processEntry(k, v);
    if (!Object.keys(headers).some((k) => k.toLowerCase() === 'user-agent')) {
      result['user-agent'] = 'UnicornAgent';
    }
  }
  return result;
}

// ⑤ http.request / https.request Monkey Patch
const wrapRequest = (orig) => function (a, b, c) {
  const opts = (typeof a === 'object' && a && !(a instanceof URL)) ? a : (typeof b === 'object' && b) ? b : {};
  if (opts && opts.headers) opts.headers = sanitizeHeaders(opts.headers);
  return orig.apply(this, arguments);
};

http.request = wrapRequest(http.request);
https.request = wrapRequest(https.request);

// ⑥ process.argv 설정 후 Vercel 로드
process.argv = [process.argv[0], 'vercel', 'deploy', ...process.argv.slice(2)];

await import('vercel/dist/vc.js');
