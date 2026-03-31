# InstagramClone - 개발 인수인계 문서

## 프로젝트 개요

**프로젝트명**: InstagramClone
**개발 기간**: 2026년 3월
**기술 스택**: Frontend (HTML5, CSS3, JavaScript ES6+)
**저장소 방식**: Browser LocalStorage (클라이언트 사이드 저장)
**타입**: 웹 애플리케이션 (SPA - Single Page Application)

---

## 1. 프로젝트 구조

```
clone/
├── index.html      # 메인 HTML 마크업
├── styles.css      # 스타일시트 (Instagram UI 구현)
├── script.js       # 비즈니스 로직 및 상태 관리
└── project.md      # 이 문서
```

### 파일 역할

| 파일 | 용도 | 주요 콘텐츠 |
|------|------|-----------|
| index.html | DOM 구조 | 인증 모달, 헤더, 사이드바, 콘텐츠 영역 |
| styles.css | 스타일링 | Instagram 디자인 시스템, 반응형 레이아웃 |
| script.js | 비즈니스 로직 | 상태관리, 이벤트 핸들러, API(DataManager) |

---

## 2. 주요 기능 및 구현 상태

### ✅ 완료된 기능

#### 2.1 인증 시스템 (Authentication)
- **회원가입**: 이메일, 비밀번호, 사용자명, 자기소개 입력
- **로그인**: 이메일/비밀번호 검증
- **세션 관리**: LocalStorage에 현재 사용자 정보 저장
- **로그아웃**: 세션 정보 제거

**구현 위치**: 
- HTML: `#authModal` 및 로그인/회원가입 폼
- JS: `handleLogin()`, `handleSignup()`, `handleLogout()` 함수
- 데이터: `localStorage['users']`

**사용자 데이터 구조**:
```javascript
{
  "[email]": {
    email: "user@example.com",
    password: "hashed_or_plain", // 현재 평문 저장 (보안 개선 필요)
    username: "username",
    bio: "사용자 소개",
    createdAt: "ISO8601"
  }
}
```

---

#### 2.2 게시물 관리 (Post Management)
- **게시물 업로드**: 사진 및 영상 파일 업로드 가능
- **다중 미디어**: 한 게시물에 여러 사진 업로드 가능
- **메타데이터**: 설명(caption), 위치(location) 추가 가능
- **게시물 피드**: 시간순 역순(최신순) 정렬

**구현 위치**:
- HTML: `#upload` 섹션 (이미지/영상 탭 분리)
- JS: `publishPost()`, `previewImages()`, `previewVideo()`
- 데이터: `localStorage['posts']`

**게시물 데이터 구조**:
```javascript
{
  id: 1609459200000,           // Unix 타임스탬프
  authorEmail: "user@email.com",
  media: [                      // 배열 구조 (다중 미디어 지원)
    { type: "image", data: "data:image/png;..." },
    { type: "video", data: "data:video/mp4;..." }
  ],
  caption: "게시물 설명",
  location: "위치",
  createdAt: "ISO8601",
  likes: 42,                    // 좋아요 수 (계산됨)
  comments: []                  // 예약된 필드 (미사용)
}
```

**특징**:
- 파일을 Data URL로 변환하여 localStorage에 저장
- 대용량 파일은 localStorage 용량 제한(5-10MB) 초과 위험
- 향후 실제 서버/S3 연동 필요

---

#### 2.3 좋아요 시스템 (Like System)
- **좋아요 토글**: 게시물별로 좋아요/취소 가능
- **영구 저장**: 로그아웃 후에도 기록 유지
- **카운트 업데이트**: 게시물의 `likes` 필드 자동 갱신
- **좋아요한 게시물**: 프로필에서 좋아요 목록 조회 가능

**구현 위치**:
- HTML: 게시물 하트 아이콘 (`<i class="far fa-heart">`)
- JS: `toggleLikePost()`, `toggleLikeDetail()`, `dataManager.toggleLike()`
- 데이터: `localStorage['likes']`

**좋아요 데이터 구조**:
```javascript
{
  "[userEmail]_[postId]": true,  // 좋아요 = key가 존재
  "user@email.com_1609459200000": true
}
```

**로직 흐름**:
1. 사용자가 하트 버튼 클릭
2. `toggleLikePost(postId)` 호출
3. DataManager에서 좋아요 여부 토글
4. 게시물의 `likes` 카운트 동시에 갱신
5. 피드/상세 모달 UI 재렌더링

---

#### 2.4 구독 시스템 (Subscription System)
- **구독 토글**: 다른 사용자 구독 가능 (현재는 자신만 조회 가능)
- **구독 관리**: 프로필의 "구독" 탭에서 구독 목록 표시
- **통계**: 프로필에 구독 수 표시

**구현 위치**:
- JS: `dataManager.toggleSubscription()`, `getSubscribedUsers()`
- 데이터: `localStorage['subscriptions']`

**구독 데이터 구조**:
```javascript
{
  "[userEmail]_[targetEmail]": true,
  "user1@email.com_user2@email.com": true
}
```

**현재 제한사항**: 자신의 프로필에서만 구독 관리 가능
**향후 기능**: 다른 사용자 프로필 방문, 구독 버튼 추가

---

#### 2.5 댓글 시스템 (Comment System)
- **댓글 작성**: 게시물 상세 페이지에서 댓글 입력
- **댓글 조회**: 최신순으로 표시
- **작성자 표시**: 각 댓글에 작성자명 및 작성 시간 표시
- **영구 저장**: 로그아웃 후에도 유지

**구현 위치**:
- HTML: `#postDetail > .comment-input-section`
- JS: `addComment()`, `dataManager.addComment()`, `getComments()`
- 데이터: `localStorage['comments']`

**댓글 데이터 구조**:
```javascript
{
  "[postId]": [
    {
      id: 1609459200001,
      userEmail: "user@email.com",
      text: "좋은 게시물입니다!",
      createdAt: "ISO8601"
    }
  ]
}
```

**특징**:
- Enter 키로도 전송 가능
- 댓글 수정/삭제 기능 없음 (보안상 고려 필요)
- 댓글은 게시물 상세 모달에서만 조회 가능

---

### ⚠️ 부분 완료 또는 제한된 기능

#### 2.6 피드 시스템 (Feed)
- **구현**: ✅ 기본 피드 표시 완료
- **제한**: 무한 스크롤 미구현, 페이지네이션 없음
- **개선 필요**: 
  - 팔로우한 사용자의 게시물만 표시 로직
  - 피드 알고리즘 (인기도, 관련성 등)

#### 2.7 탐색 (Explore)
- **구현**: ✅ 전체 게시물 그리드 표시
- **제한**: 카테고리/필터 기능 없음
- **검색**: 상단 검색바는 UI만 존재, 실제 검색 미구현

---

## 3. 아키텍처 및 설계 원칙

### 3.1 DataManager 클래스 (핵심 로직)
```javascript
class DataManager {
  // 1. 초기화
  initializeStorage()
  
  // 2. 사용자 관리
  registerUser(), loginUser(), getUserInfo()
  
  // 3. 게시물 관리
  createPost(), getAllPosts(), getUserPosts()
  
  // 4. 좋아요 관리
  toggleLike(), isLiked(), getLikedPosts()
  
  // 5. 구독 관리
  toggleSubscription(), isSubscribed(), getSubscriptions()
  
  // 6. 댓글 관리
  addComment(), getComments()
}
```

**설계 이유**:
- 데이터 및 비즈니스 로직을 한곳에 중앙화
- LocalStorage 추상화로 향후 API 연동 시 변경 최소화
- 메서드명이 의도를 명확히 표현

---

### 3.2 상태 관리

**전역 변수**:
```javascript
let currentUser = null;           // 현재 로그인한 사용자
let currentPostDetail = null;     // 상세 모달에서 열린 게시물
let currentMediaIndex = 0;        // 다중 미디어 네비게이션 인덱스
```

**저장소 (LocalStorage)**:
```javascript
localStorage['users']           // 사용자 데이터
localStorage['posts']           // 게시물 데이터
localStorage['likes']           // 좋아요 기록
localStorage['subscriptions']   // 구독 기록
localStorage['comments']        // 댓글 데이터
localStorage['currentUser']     // 로그인 세션
```

**장점**:
- 새로고침 후에도 데이터 유지
- 네트워크 없이도 작동 (오프라인 우선)

**단점**:
- 용량 제한 (보통 5-10MB)
- 데이터 암호화 없음
- 여러 탭에서 데이터 동기화 불가

---

### 3.3 UI/UX 구조

#### 화면 흐름
```
인증 모달 (Auth Modal)
  ↓
메인 앱 (Main App)
  ├─ 헤더 (Header)
  │  ├─ 로고
  │  ├─ 검색바
  │  └─ 아이콘 (알림, 프로필, 로그아웃)
  │
  ├─ 사이드바 (Sidebar)
  │  └─ 네비게이션 (홈, 탐색, 업로드, 프로필)
  │
  └─ 콘텐츠 영역 (Content Area)
     ├─ 피드 (Feed)
     ├─ 탐색 (Explore)
     ├─ 업로드 (Upload)
     └─ 프로필 (Profile)
         ├─ 내 게시물
         ├─ 좋아요한 게시물
         └─ 구독 목록

게시물 상세 모달 (Post Detail Modal)
  ├─ 미디어 (좌측)
  └─ 댓글/정보 (우측)
```

---

## 4. 코드 가이드 및 주요 함수

### 4.1 인증 플로우

```javascript
// 회원가입
handleSignup() 
  → dataManager.registerUser(email, password, username, bio)
  → localStorage['users']에 저장

// 로그인
handleLogin()
  → dataManager.loginUser(email, password)
  → currentUser 전역변수 설정
  → localStorage['currentUser'] 저장
  → showApp() 호출로 메인 화면 표시
  → loadFeed() 호출
```

---

### 4.2 게시물 업로드 플로우

```javascript
// 사진 선택
previewImages(event)
  → FileReader로 Data URL 변환
  → uploadedImages 배열에 저장
  → renderImagePreviews() 호출로 미리보기 표시

// 게시물 발행
publishPost()
  → 사진/영상 선택 확인
  → dataManager.createPost() 호출
  → localStorage['posts']에 추가
  → 입력값 초기화
  → loadFeed() 호출로 피드 새로고침
```

**파일 처리 방식**:
- JavaScript FileReader API로 파일을 Data URL로 변환
- `data:image/png;base64,...` 형태로 저장
- localStorage 용량 초과 시 오류 발생 가능

---

### 4.3 게시물 조회 (피드, 탐색, 프로필)

```javascript
loadFeed()
  → dataManager.getAllPosts() 호출
  → 각 게시물마다 DOM 생성
  → 좋아요 여부 dataManager.isLiked()로 확인
  → 이벤트 리스너 등록

viewPostDetail(postId)
  → currentPostDetail 설정
  → currentMediaIndex = 0 (첫 미디어부터)
  → 모달 DOM 업데이트
  → 댓글 목록 로드
  → postModal 표시
```

---

### 4.4 좋아요 토글 로직

```javascript
toggleLikePost(postId)
  → dataManager.toggleLike(currentUser.email, postId)
    ├─ likes에 [email_postId] 키 존재 확인
    ├─ 미존재: 추가 + posts[postId].likes++
    └─ 존재: 삭제 + posts[postId].likes--
  → loadFeed() 또는 viewPostDetail() 재렌더링
```

**중요**: 좋아요는 "사용자_게시물" 쌍으로 저장되어 한 번만 누를 수 있음

---

### 4.5 유틸리티 함수

```javascript
formatDate(dateString)
// ISO 8601 → "2분 전", "어제", "5일 전" 등으로 변환

escapeHtml(text)
// XSS 방지를 위해 HTML 특수문자 이스케이핑
// 현재 사용: 게시물 설명, 댓글 텍스트
```

---

## 5. 주요 기술 스택 및 라이브러리

### 5.1 사용 라이브러리

| 라이브러리 | 버전 | 용도 | CDN |
|-----------|------|------|-----|
| Font Awesome | 6.4.0 | 아이콘 | cdnjs.cloudflare.com |

### 5.2 인라인 스타일 및 CSS Variables

```css
:root {
  --primary-color: #0095f6;          /* Instagram 파란색 */
  --secondary-color: #f77737;        /* 좋아요 주황색 */
  --text-primary: #262626;           /* 기본 텍스트 */
  --text-secondary: #737373;         /* 보조 텍스트 */
  --border-color: #dbdbdb;           /* 경계선 */
  --background: #fafafa;             /* 배경 */
  --white: #ffffff;
}
```

**모바일 반응형**:
- 480px 이하: 모바일 레이아웃 (사이드바 상단 이동)
- 768px 이상: 태블릿 레이아웃
- 1000px 이상: 데스크톱 레이아웃

---

## 6. 보안 고려 사항 및 제한

### ⚠️ 현재 보안 문제

1. **비밀번호 평문 저장**
   - 현재: `localStorage['users'][email].password` = 평문
   - 개선안: 클라이언트에서 SHA256 해싱, 또는 로그인 시 HTTPS only

2. **XSS 취약점**
   - 현재: `escapeHtml()` 함수로 부분적으로 방어
   - 위험: 사용자 입력값이 제한되지 않음 (예: 매우 긴 게시물 설명)

3. **CSRF 토큰 없음**
   - 클라이언트 사이드만 존재하므로 현재 영향 없음
   - 향후 서버 연동 시 필수

4. **LocalStorage 접근 제어**
   - 누구나 개발자 도구에서 모든 데이터 조회 가능
   - 민감한 정보(비밀번호, 토큰) 저장 금지

---

### ✅ 권장 보안 개선

```javascript
// 1. 비밀번호 해싱 (bcrypt 또는 crypto-js)
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);

// 2. JWT 토큰 사용
const token = jwt.sign({ email }, 'secret_key', { expiresIn: '7d' });

// 3. HTTPS only 쿠키
document.cookie = "token=" + token + "; secure; samesite=lax";

// 4. 입력 검증 강화
const sanitizedText = DOMPurify.sanitize(userInput);
```

---

## 7. 향후 개선 로드맵

### Phase 1: 기능 완성 (우선순위 높음)
- [ ] 다른 사용자 프로필 방문 기능
- [ ] 팔로우 기반 피드 필터링
- [ ] 실시간 알림 시스템
- [ ] 검색 기능 구현 (사용자, 해시태그)
- [ ] 게시물 삭제/수정 기능
- [ ] 댓글 답글 기능

### Phase 2: 성능 최적화
- [ ] 무한 스크롤 또는 페이지네이션
- [ ] 이미지 압축 및 최적화 (ImageOptim, TinyPNG)
- [ ] 가상 스크롤 (Virtual Scrolling)
- [ ] 번들 크기 최적화 (Tree shaking, Code splitting)
- [ ] Lazy loading (교차 관찰자)

### Phase 3: 백엔드 연동
- [ ] Node.js + Express 서버 구축
- [ ] MongoDB/PostgreSQL 데이터베이스 설계
- [ ] REST API 또는 GraphQL 구현
- [ ] 파일 저장소 (AWS S3, Cloudinary)
- [ ] 실시간 통신 (WebSocket, Socket.io)

### Phase 4: 배포 및 운영
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인 (GitHub Actions, GitLab CI)
- [ ] 모니터링 및 로깅 (Sentry, LogRocket)
- [ ] CDN 설정 (Cloudflare, AWS CloudFront)
- [ ] SSL/TLS 인증서

---

## 8. 테스트 가이드

### 8.1 수동 테스트 체크리스트

#### 인증
- [ ] 새 계정으로 회원가입 후 로그인 가능한가?
- [ ] 잘못된 비밀번호로 로그인 불가능한가?
- [ ] 로그아웃 후 localStorage 데이터 제거되는가?
- [ ] 브라우저 새로고침 후 세션 유지되는가?

#### 게시물
- [ ] 사진 1개 업로드 가능한가?
- [ ] 사진 여러개 업로드 및 미리보기 가능한가?
- [ ] 영상 업로드 후 재생 가능한가?
- [ ] 설명 및 위치 없이도 게시물 발행 가능한가?
- [ ] 게시물 삭제 시 좋아요/댓글도 함께 삭제되는가? (현재 미구현)

#### 상호작용
- [ ] 게시물 하트 아이콘 클릭 시 색상 변경되는가?
- [ ] 좋아요 수 카운트 증가/감소하는가?
- [ ] 댓글 작성 후 즉시 표시되는가?
- [ ] 다중 미디어 게시물의 이전/다음 버튼 작동하는가?

#### 반응형
- [ ] 480px 이하 (모바일): 사이드바 숨김?
- [ ] 800px (태블릿): 레이아웃 재정렬?
- [ ] 1400px (데스크톱): 정상 표시?

---

### 8.2 자동화 테스트 (선택사항)

```javascript
// Jest + Testing Library 예시
describe('DataManager', () => {
  test('registerUser() 새 사용자 추가', () => {
    const result = dataManager.registerUser(
      'newuser@test.com',
      'password123',
      'newuser'
    );
    expect(result.success).toBe(true);
  });

  test('toggleLike() 좋아요 토글', () => {
    const postId = 1609459200000;
    const before = dataManager.isLiked('user@test.com', postId);
    dataManager.toggleLike('user@test.com', postId);
    const after = dataManager.isLiked('user@test.com', postId);
    expect(before).not.toBe(after);
  });
});
```

---

## 9. 문제 해결 (Troubleshooting)

### Q1: "localStorage quotaExceededError" 오류
**원인**: 데이터 용량이 localStorage 제한(5-10MB) 초과
**해결책**:
```javascript
// 1. 이전 데이터 삭제
localStorage.clear();

// 2. 이미지 압축
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0, 800, 600);
const compressed = canvas.toDataURL('image/jpeg', 0.7);

// 3. 서버에 저장 (권장)
// S3, Firebase Storage 등 클라우드 저장소 사용
```

---

### Q2: 로그아웃 후 다시 로그인했을 때 이전 좋아요 기록이 안 보임
**원인**: 좋아요는 사용자별로 분리되어 저장됨 (올바른 동작)
**확인**: `localStorage['likes']` 에서 `user2@email.com_postId` 키 확인

---

### Q3: 댓글이 게시되지 않음
**원인**: 게시물 상세 모달이 아닌 피드에서 댓글 시도
**해결**: 게시물 클릭 → 모달 열기 → 댓글 입력

---

### Q4: 파일 업로드 후 "undefined" 표시됨
**원인**: FileReader 비동기 처리 지연
**현재 코드**: 올바르게 처리 중 (`reader.onload` 이벤트 사용)
**확인**: 콘솔에서 `uploadedImages` 배열 확인

---

## 10. 개발자 온보딩 체크리스트

신입 개발자가 이 프로젝트를 인수받을 때 확인할 항목:

- [ ] 이 문서를 완독했는가?
- [ ] 로컬에서 프로젝트 실행할 수 있는가?
- [ ] 회원가입 → 로그인 → 게시물 업로드 테스트했는가?
- [ ] index.html, styles.css, script.js 각각 200줄 이상 읽었는가?
- [ ] DataManager 클래스의 주요 메서드 5개 이해했는가?
- [ ] localStorage의 5가지 저장소(users, posts, likes 등) 이해했는가?
- [ ] 모바일(480px)에서도 화면이 정상 표시되는지 확인했는가?
- [ ] 향후 개선 로드맵에서 작업할 항목 정의했는가?

---

## 11. 연락처 및 참고 자료

### 참고 자료
- [Instagram Design System](https://www.instagram.com)
- [MDN - LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [Data URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)

### 유용한 도구
- **개발**: VS Code + Live Server
- **디버깅**: Chrome DevTools (Application tab에서 localStorage 확인)
- **설계**: Figma, Adobe XD
- **버전관리**: Git

---

## 12. 주요 코드 스니펫

### 12.1 새로운 기능 추가 예시

#### 기능: 게시물 공유 (Share) 구현

```javascript
// 1. DataManager에 메서드 추가
class DataManager {
  sharePost(postId, userName) {
    const post = this.getPost(postId);
    const message = `${userName}가 공유했습니다: ${post.caption}`;
    console.log(message);
    // 향후: 소셜 미디어 API 연동
  }
}

// 2. HTML에 공유 버튼 추가
// <button class="action-btn" onclick="sharePost(${post.id})">
//   <i class="far fa-share"></i>
// </button>

// 3. JS에 이벤트 핸들러 추가
function sharePost(postId) {
  const post = dataManager.getPost(postId);
  const author = dataManager.getUserInfo(post.authorEmail);
  dataManager.sharePost(postId, author.username);
  
  // 웹 공유 API (선택사항)
  if (navigator.share) {
    navigator.share({
      title: 'InstagramClone',
      text: post.caption,
      url: window.location.href
    });
  }
}
```

---

### 12.2 버그 수정 예시

#### 버그: 같은 이메일로 여러 번 회원가입 가능

**수정 전**:
```javascript
function handleSignup() {
  const email = document.getElementById('signupEmail').value;
  dataManager.registerUser(email, ...); // 중복 확인 없음
}
```

**수정 후**:
```javascript
function handleSignup() {
  const email = document.getElementById('signupEmail').value;
  const users = JSON.parse(localStorage.getItem('users'));
  
  if (users[email]) {
    alert('이미 가입된 이메일입니다');
    return;
  }
  
  dataManager.registerUser(email, ...);
}

// 또는 DataManager에 메서드 추가
class DataManager {
  isEmailRegistered(email) {
    const users = JSON.parse(localStorage.getItem('users'));
    return !!users[email];
  }
}
```

---

## 최종 정리

이 InstagramClone 프로젝트는 **프로덕션 환경이 아닌 학습/데모 목적**으로 설계되었습니다. 주요 특징:

✅ **장점**:
- 심플한 구조로 이해하기 쉬움
- 백엔드 없이 즉시 작동
- 확장 가능한 아키텍처

⚠️ **한계**:
- 클라이언트 사이드에만 데이터 저장 (단일 브라우저/기기에서만 작동)
- 보안 취약점 (평문 비밀번호 등)
- 대규모 데이터 처리 불가

**다음 단계**: Node.js + 데이터베이스 백엔드 구축으로 진정한 소셜 네트워크 구현 가능

---

**최종 수정일**: 2026년 3월 31일
**문서 버전**: 1.0
**작성자**: Senior Developer Team
