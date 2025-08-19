# 🚀 Deployment Guide

이 문서는 Password Generator 앱의 배포 과정을 상세히 설명합니다.

## 📋 배포 체크리스트

### Pre-deployment 확인사항

- [ ] 모든 테스트 통과 확인 (`npm test`)
- [ ] 코드 품질 검증 (`npm run lint && npm run typecheck`)
- [ ] 성능 벤치마크 통과 확인
- [ ] 버전 번호 업데이트 (package.json, app.config.js)
- [ ] 변경사항 문서화 (CHANGELOG.md)

### 필수 도구 설치

```bash
# EAS CLI 설치
npm install -g eas-cli

# 로그인 (Expo 계정 필요)
eas login
```

## 🏗️ 빌드 프로필

### Preview 빌드 (내부 테스트용)

**iOS (TestFlight)**
```bash
eas build --platform ios --profile preview
```

**Android (Google Play Console 내부 테스트)**
```bash
eas build --platform android --profile preview
```

**멀티 플랫폼**
```bash
eas build --platform all --profile preview
```

### Production 빌드 (스토어 배포용)

```bash
eas build --platform all --profile production
```

## 📱 플랫폼별 배포

### iOS App Store

1. **TestFlight 업로드**
   ```bash
   eas submit --platform ios --latest
   ```

2. **App Store Connect에서 설정**
   - 메타데이터 입력
   - 스크린샷 업로드
   - 개인정보 보호 정보
   - 연령 등급 설정

3. **리뷰 제출**
   - App Store 검토 가이드라인 확인
   - 제출 및 검토 대기

### Google Play Store

1. **Play Console 업로드**
   ```bash
   eas submit --platform android --latest
   ```

2. **스토어 등록정보 설정**
   - 앱 설명 및 제목
   - 스크린샷 및 아이콘
   - 연령 등급 및 콘텐츠 등급

3. **내부 테스트 릴리스**
   - 테스터 그룹 설정
   - 내부 테스트 시작

### Web 배포

1. **정적 사이트 빌드**
   ```bash
   npx expo export --platform web
   ```

2. **호스팅 플랫폼 배포**
   - Vercel, Netlify, 또는 GitHub Pages
   - `dist` 폴더 업로드

## ⚙️ 배포 설정

### app.config.js 주요 설정

```javascript
export default {
  expo: {
    name: "Password Generator",
    slug: "password-generator",
    version: "1.0.0-beta.1",  // 버전 관리
    
    ios: {
      bundleIdentifier: "com.passwordgen.app",
      buildNumber: "1.0.0"
    },
    
    android: {
      package: "com.passwordgen.app",
      versionCode: 1  // Android는 정수 증가
    },
    
    extra: {
      eas: {
        projectId: "password-generator-mvp"
      }
    }
  }
};
```

### eas.json 빌드 프로필

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  }
}
```

## 🧪 내부 테스트 절차

### 1. 테스터 그룹 설정

**iOS TestFlight**
- Apple Developer Console에서 내부 테스터 추가
- 최대 100명까지 내부 테스터 초대
- 자동 배포 설정 가능

**Android 내부 테스트**
- Google Play Console에서 내부 테스트 트랙 생성
- 테스터 이메일 목록 업로드
- 최대 100명까지 내부 테스터

### 2. 테스트 시나리오

**기본 기능 테스트**
- [ ] 앱 실행 및 초기 화면 로딩
- [ ] 패스워드 생성 기능
- [ ] 길이 조절 슬라이더
- [ ] 문자 타입 옵션 선택
- [ ] 클립보드 복사 기능
- [ ] 햅틱 피드백 동작

**성능 테스트**
- [ ] 앱 실행 시간 (목표: <2.5초)
- [ ] 패스워드 생성 속도 (목표: <300ms)
- [ ] 메모리 사용량 확인
- [ ] 배터리 소모량 측정

**플랫폼별 테스트**
- [ ] iOS: 다양한 디바이스 크기 (iPhone, iPad)
- [ ] Android: 다양한 화면 크기 및 OS 버전
- [ ] Web: 주요 브라우저 호환성

### 3. 피드백 수집

**피드백 채널**
- TestFlight/Play Console 내장 피드백
- GitHub Issues
- 이메일: feedback@passwordgen.app
- 내부 Slack 채널 (팀 전용)

**수집할 정보**
- 기능적 버그 리포트
- UI/UX 개선 제안
- 성능 이슈
- 플랫폼별 특이사항

## 🔍 배포 후 모니터링

### 크래시 모니터링

**iOS**
- Xcode Organizer에서 크래시 로그 확인
- TestFlight 크래시 리포트

**Android**
- Play Console 안정성 섹션
- Firebase Crashlytics (추후 통합 고려)

### 성능 모니터링

**주요 지표**
- 앱 실행 시간
- 메모리 사용량
- 배터리 소모
- 네트워크 사용량 (현재 0)

**도구**
- Flipper (개발 중)
- React DevTools
- Expo 개발 도구

## 🚨 롤백 절차

### 긴급 롤백이 필요한 경우

1. **즉시 조치**
   - 스토어에서 앱 업데이트 중지
   - 사용자에게 문제 상황 공지

2. **이전 버전 복구**
   ```bash
   # 이전 안정 버전으로 빌드
   git checkout <previous-stable-tag>
   eas build --platform all --profile production
   ```

3. **핫픽스 배포**
   - 문제 해결 후 패치 버전 증가
   - 빠른 검증 후 재배포

## 📈 성공 지표

### 베타 테스트 목표

**기술적 지표**
- 크래시율: 0%
- 평균 실행 시간: <2초
- 메모리 사용량: <80MB
- 사용자 피드백 응답률: >50%

**사용자 만족도**
- 앱 스토어 평점: >4.0
- 기능 완성도 만족도: >80%
- 재사용 의향: >70%

### 프로덕션 출시 준비

**달성 조건**
- [ ] 베타 테스트 완료 (최소 2주)
- [ ] 주요 버그 모두 수정
- [ ] 성능 목표 달성
- [ ] 스토어 메타데이터 완성
- [ ] 법적 검토 완료

## 📞 지원 및 문의

**개발팀 연락처**
- 기술적 이슈: dev@passwordgen.app
- 배포 문의: deployment@passwordgen.app
- 긴급 상황: +82-10-XXXX-XXXX

**유용한 링크**
- [Expo EAS 문서](https://docs.expo.dev/build/introduction/)
- [App Store Connect 가이드](https://developer.apple.com/app-store-connect/)
- [Google Play Console 도움말](https://support.google.com/googleplay/android-developer/)

---

**마지막 업데이트**: 2025년 1월 15일  
**버전**: 1.0.0-beta.1