---
name: "1단계: 프로젝트 기반 설정"
about: React Native 프로젝트 초기화 및 개발 환경 구축
title: "[Phase 1] 프로젝트 기반 설정"
labels: ["phase-1", "setup", "infrastructure"]
assignees: []
---

## 📋 목표
React Native 프로젝트 초기화 및 기본 개발 환경 구축

## 🎯 완료 기준
- [ ] React Native 프로젝트가 정상적으로 실행됨
- [ ] 모든 필수 라이브러리가 설치 및 설정 완료
- [ ] 기본 네비게이션 구조 구현
- [ ] 코드 품질 도구 (ESLint, Prettier) 설정 완료

## 📝 세부 작업

### 프로젝트 초기화
- [ ] `npx create-expo-app SecurePassGenerator --template` 실행
- [ ] TypeScript 환경 설정
- [ ] 프로젝트 폴더 구조 생성

### 필수 라이브러리 설치
```bash
# 필수 의존성
expo install @react-native-async-storage/async-storage
expo install @react-native-clipboard/clipboard
npm install react-native-crypto-js
expo install react-native-vector-icons
expo install react-native-haptic-feedback
npm install react-native-google-mobile-ads
expo install react-native-share
npm install react-native-biometrics
npm install @react-native-keychain/react-native-keychain

# 네비게이션
npm install @react-navigation/native @react-navigation/stack
expo install react-native-screens react-native-safe-area-context

# 개발 도구
npm install --save-dev @types/react @types/react-native
npm install --save-dev eslint @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-plugin-react-native
```

### 폴더 구조 생성
```
src/
├── components/
│   ├── common/
│   ├── password/
│   └── security/
├── screens/
├── utils/
├── hooks/
├── services/
├── constants/
├── types/
└── __tests__/
```

### 설정 파일
- [ ] `.eslintrc.js` 설정
- [ ] `prettier.config.js` 설정
- [ ] `tsconfig.json` 설정
- [ ] `app.json` 앱 설정

### 네비게이션 구조
- [ ] Stack Navigator 기본 설정
- [ ] 화면 라우팅 구조 정의

## 🔍 테스트
- [ ] 앱이 iOS/Android 시뮬레이터에서 정상 실행
- [ ] Hot reload 정상 작동
- [ ] TypeScript 컴파일 에러 없음

## 📚 참고 자료
- [React Native 공식 문서](https://reactnative.dev/docs/getting-started)
- [Expo 공식 문서](https://docs.expo.dev/)
- [React Navigation 문서](https://reactnavigation.org/docs/getting-started)

## ⏰ 예상 소요 시간
3-5일

## 🏷️ 관련 이슈
- 관련된 다른 이슈들 링크

## ✅ Definition of Done
- [ ] 앱이 에러 없이 실행됨
- [ ] 모든 설정 파일이 올바르게 구성됨
- [ ] 코드 품질 도구가 정상 작동함
- [ ] 기본 네비게이션이 구현됨
- [ ] 문서화 완료 (README.md 업데이트)