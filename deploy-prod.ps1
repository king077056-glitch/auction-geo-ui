# Vercel 프로덕션 배포 (한글 사용자명/호스트네임 이슈 우회)
# COMPUTERNAME, USERNAME, USERDOMAIN을 영문으로 임시 변경 후 vercel deploy --prod 실행
# 최초 1회: vercel login (브라우저에서 인증)
$prevComputer = $env:COMPUTERNAME
$prevUser = $env:USERNAME
$prevDomain = $env:USERDOMAIN
$env:COMPUTERNAME = 'UnicornPC'
$env:USERNAME = 'UnicornUser'
$env:USERDOMAIN = 'UnicornDomain'
try {
    npx vercel deploy --prod
} finally {
    $env:COMPUTERNAME = $prevComputer
    $env:USERNAME = $prevUser
    $env:USERDOMAIN = $prevDomain
}
