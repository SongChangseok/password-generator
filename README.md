# SecurePass Generator

안전하고 강력한 패스워드를 빠르고 쉽게 생성할 수 있는 모바일 유틸리티 앱

## 프로젝트 개요

이 프로젝트는 개인 사용자와 IT 전문가들을 위한 패스워드 생성기 앱입니다. React Native와 Expo를 사용하여 개발되었으며, 완전한 오프라인 작동과 강력한 보안 기능을 제공합니다.

## 주요 기능

- 🔐 강력한 패스워드 생성 (4-128자)
- 📱 직관적이고 깔끔한 UI
- 🔒 완전한 오프라인 작동
- 💾 패스워드 저장 및 관리
- 🎨 다크/라이트 모드 지원
- 🔍 생체 인증 및 PIN 코드 보안

## 기술 스택

- **프레임워크**: React Native + Expo
- **언어**: TypeScript
- **네비게이션**: React Navigation
- **상태 관리**: React Context API
- **로컬 저장소**: AsyncStorage
- **암호화**: react-native-crypto-js

## 설치 및 실행

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn
- Expo CLI

### 프로젝트 설정

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start

# iOS 실행 (macOS 필요)
npm run ios

# Android 실행
npm run android

# 웹 실행
npm run web
```

## 프로젝트 구조

```
src/
├── components/        # 재사용 가능한 컴포넌트
│   ├── common/       # 공통 컴포넌트
│   ├── password/     # 패스워드 관련 컴포넌트
│   └── security/     # 보안 관련 컴포넌트
├── screens/          # 화면 컴포넌트
├── navigation/       # 네비게이션 설정
├── utils/            # 유틸리티 함수
├── hooks/            # 커스텀 훅
├── services/         # 서비스 로직
├── constants/        # 상수 정의
├── types/            # TypeScript 타입 정의
└── __tests__/        # 테스트 파일
```

## 개발 단계

### Phase 1: 프로젝트 기반 설정 ✅
- [x] React Native 프로젝트 초기화
- [x] TypeScript 환경 설정
- [x] 필수 라이브러리 설치
- [x] 코드 품질 도구 설정
- [x] 기본 네비게이션 구조

### Phase 2: MVP 기능 구현 (진행 예정)
- [ ] 패스워드 생성 엔진 구현
- [ ] 기본 UI/UX 완성
- [ ] 패스워드 강도 표시
- [ ] 클립보드 복사 기능

### Phase 3: 고급 기능 (계획)
- [ ] 패스워드 저장 및 관리
- [ ] 보안 잠금 기능
- [ ] 공유 기능
- [ ] 광고 연동

## 코드 품질

프로젝트는 다음 도구들을 사용하여 코드 품질을 유지합니다:

- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **TypeScript**: 타입 안전성

```bash
# 타입 체크
npx tsc --noEmit

# 린트 실행
npm run lint

# 코드 포맷팅
npm run format
```

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 해주세요.