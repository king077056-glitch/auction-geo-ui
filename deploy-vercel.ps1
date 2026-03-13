# ============================================
# 경매지오 Vercel 배포 스크립트 (한글 PC명 우회)
# ============================================
# 원인: PC 이름에 한글(이로보트 등)이 포함되면 Vercel CLI가 HTTP 헤더로 전송할 때
#      "is not a legal HTTP header value" 에러 발생 (RFC 7230: 헤더는 ASCII만 허용)
# 해결: 배포 시점에 COMPUTERNAME/HOSTNAME을 ASCII로 일시 변경
# ============================================

$originalComputerName = $env:COMPUTERNAME
$originalHostname = $env:HOSTNAME

try {
  Write-Host "[경매지오] ASCII 호스트네임으로 전환 중..." -ForegroundColor Cyan
  $env:COMPUTERNAME = "VercelDeploy"
  $env:HOSTNAME = "vercel-deploy-pc"
  
  Write-Host "[경매지오] Vercel 배포 실행..." -ForegroundColor Green
  npx vercel @args
}
finally {
  # 원복 (다른 작업에 영향 방지)
  $env:COMPUTERNAME = $originalComputerName
  $env:HOSTNAME = $originalHostname
  Write-Host "[경매지오] 환경 변수 원복 완료" -ForegroundColor Gray
}
