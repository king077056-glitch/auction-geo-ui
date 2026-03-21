# 카카오톡 공유 - Vercel 도메인 등록 가이드

## 📌 왜 등록이 필요한가요?

카카오톡 공유 버튼이 작동하려면 **공유 요청이 발생하는 웹사이트 도메인**이 카카오 개발자 콘솔에 등록되어 있어야 합니다.  
등록되지 않은 도메인에서는 "invalid domain" 또는 유사한 에러가 발생합니다.

---

## 🔧 단계별 등록 방법

### 1단계: 카카오 개발자 콘솔 접속

1. 브라우저에서 **[developers.kakao.com](https://developers.kakao.com)** 접속
2. 카카오 계정으로 **로그인**

---

### 2단계: 애플리케이션 선택 (또는 생성)

1. 상단 **내 애플리케이션** 클릭
2. 이미 앱이 있다면 해당 앱 선택
3. 없다면 **애플리케이션 추가하기** → 앱 이름 입력 후 저장

---

### 3단계: 플랫폼 설정

1. 왼쪽 메뉴에서 **앱 설정** → **플랫폼** 클릭
2. **Web 플랫폼 등록** 버튼 클릭 (이미 등록되어 있다면 **수정** 클릭)

---

### 4단계: 사이트 도메인 등록

**사이트 도메인** 입력란에 아래 주소를 **정확히** 입력하세요:

```
https://auction-geo-ui.vercel.app
```

- `https://` 포함
- 끝에 `/` 없이
- Vercel에서 커스텀 도메인을 사용한다면 해당 도메인도 추가 등록

**추가 예시** (선택 사항):

- 로컬 테스트용: `http://localhost:5173`
- Vercel 프리뷰용: `https://*.vercel.app` (와일드카드 지원 여부는 콘솔 확인)

---

### 5단계: JavaScript 키 확인

1. **앱 설정** → **앱 키** 메뉴로 이동
2. **JavaScript 키**를 복사
3. 이 키를 Vercel 환경변수에 설정합니다 (아래 참조)

---

### 6단계: Vercel 환경변수 설정

1. [vercel.com](https://vercel.com) → 해당 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 새 변수 추가:
   - **Name**: `VITE_KAKAO_JS_KEY`
   - **Value**: (5단계에서 복사한 JavaScript 키)
   - **Environment**: Production, Preview, Development 모두 체크
4. **Save** 클릭
5. **중요**: 환경변수 변경 후 **재배포( Redeploy )** 해야 적용됩니다.

---

## ✅ 완료 체크리스트

- [ ] 카카오 개발자 콘솔에 `https://auction-geo-ui.vercel.app` 등록
- [ ] Vercel에 `VITE_KAKAO_JS_KEY` 환경변수 추가
- [ ] Vercel 프로젝트 재배포
- [ ] 브라우저에서 카카오톡 공유 버튼 테스트

---

## 🚨 여전히 에러가 날 때

| 증상 | 해결 방법 |
|------|----------|
| "JavaScript 키가 설정되지 않았습니다" | Vercel 환경변수 `VITE_KAKAO_JS_KEY` 확인 후 재배포 |
| "invalid domain" / "도메인" 관련 메시지 | 카카오 콘솔 플랫폼 > Web > 사이트 도메인에 정확한 URL 등록 |
| "SDK 로드되지 않음" | 페이지 새로고침, 브라우저 캐시 삭제 후 재시도 |
| 공유 창이 안 뜸 | 브라우저 개발자 도구(F12) → Console 탭에서 에러 메시지 확인 |

---

*본 가이드는 유니콘 경매 플랫폼(auction-geo-ui.vercel.app) 기준으로 작성되었습니다.*
