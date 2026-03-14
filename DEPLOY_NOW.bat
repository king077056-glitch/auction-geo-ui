@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [경매지오] Vercel 프로덕션 배포 중...
call node deploy-final.mjs --prod
echo.
echo 배포 완료! 위의 Production URL을 친구들에게 공유하세요.
pause
