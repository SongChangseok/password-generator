---
name: "3단계: 메인 UI 구현"
about: 패스워드 생성기 메인 화면 및 사용자 인터페이스 개발
title: "[Phase 3] 메인 UI 구현"
labels: ["phase-3", "ui", "frontend", "user-experience"]
assignees: []
---

## 📋 목표
사용자 친화적인 패스워드 생성기 메인 화면 및 핵심 UI 컴포넌트 구현

## 🎯 완료 기준
- [ ] 직관적인 패스워드 생성기 메인 화면 완성
- [ ] 모든 생성 옵션이 쉽게 조절 가능
- [ ] 원터치 복사 및 공유 기능 구현
- [ ] 다크/라이트 테마 완벽 지원
- [ ] 접근성 요구사항 준수

## 📱 화면 구성

### 메인 생성 화면 (`src/screens/Generator/GeneratorScreen.tsx`)
```
┌─────────────────────────────────────┐
│ SecurePass Generator        ⚙️ 🌙   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │    Kj#8Mx!n-P2Qr-7$vW-9Zt2    │ │  <- 패스워드 카드
│ │                                 │ │
│ │  📋 복사    📤 공유    🔄 재생성  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 강도: ████████▒▒ 강함 (8/10)        │  <- 강도 표시기
│                                     │
│ 길이: 16 ▐████████████▌             │  <- 길이 슬라이더
│       4                        128  │
│                                     │
│ □ 대문자 (A-Z)     ☑ 소문자 (a-z)  │  <- 옵션 토글들
│ ☑ 숫자 (0-9)       ☑ 특수문자       │
│                                     │
│ 고급 옵션 ▼                         │
│ □ 유사 문자 제외   □ 연속 문자 방지   │
│                                     │
│           🔐 패스워드 생성            │  <- 메인 생성 버튼
│                                     │
│            [광고 영역]               │  <- 배너 광고
└─────────────────────────────────────┘
```

## 📝 세부 작업

### 핵심 컴포넌트 개발

#### 1. PasswordCard (`src/components/password/PasswordCard/`)
- [ ] `PasswordCard.tsx` - 메인 컴포넌트
- [ ] `PasswordCard.styles.ts` - 스타일 정의
- [ ] 모노스페이스 폰트로 패스워드 표시
- [ ] 읽기 쉬운 형식 (4자리씩 구분) 옵션
- [ ] 길게 터치 시 패스워드 표시/숨김

```typescript
interface PasswordCardProps {
  password: string;
  strength: StrengthResult;
  onCopy: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
}
```

#### 2. StrengthMeter (`src/components/password/StrengthMeter/`)
- [ ] 시각적 진행 바 (0-10점 스케일)
- [ ] 색상 코딩 (빨강→노랑→녹색)
- [ ] 텍스트 라벨 ("매우 약함" ~ "매우 강함")
- [ ] 애니메이션 효과

#### 3. LengthSlider (`src/components/common/Slider/`)
- [ ] 4-128 범위 슬라이더
- [ ] 현재 값 실시간 표시
- [ ] 햅틱 피드백
- [ ] 접근성 지원 (스크린 리더)

#### 4. OptionToggle (`src/components/common/Toggle/`)
- [ ] iOS/Android 네이티브 스타일
- [ ] 명확한 라벨 표시
- [ ] 비활성화 상태 처리
- [ ] 접근성 힌트

### 사용자 인터랙션

#### 복사 기능
- [ ] 패스워드 영역 탭으로 즉시 복사
- [ ] 토스트 메시지 "패스워드가 복사되었습니다"
- [ ] 햅틱 피드백 (성공 진동)
- [ ] 클립보드 보안 (자동 삭제 타이머)

#### 공유 기능
- [ ] 공유 버튼 클릭 시 확인 다이얼로그
- [ ] "패스워드를 공유하시겠습니까? 보안상 주의가 필요합니다."
- [ ] 시스템 공유 시트 활용
- [ ] 패스워드만 전송 (앱 홍보 문구 제외)

#### 생성 버튼 인터랙션
- [ ] 버튼 애니메이션 (로딩 스피너)
- [ ] 생성 완료 시 성공 애니메이션
- [ ] 오류 처리 및 사용자 피드백

### 테마 시스템 (`src/constants/colors.ts`, `src/constants/typography.ts`)

#### 컬러 팔레트
```typescript
export const Colors = {
  primary: '#1E3A8A',      // 진한 파란색
  secondary: '#1E40AF',    // 파란색
  success: '#059669',      // 녹색
  warning: '#DC2626',      // 빨간색
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#64748B'
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8'
  }
};
```

#### 다크/라이트 모드
- [ ] 시스템 설정 자동 감지
- [ ] 테마 Context Provider 구현
- [ ] 모든 컴포넌트 테마 대응
- [ ] 부드러운 테마 전환 애니메이션

### 접근성 (Accessibility)

#### WCAG 2.1 AA 준수
- [ ] 모든 인터랙티브 요소에 접근성 라벨
- [ ] 최소 터치 영역 44x44pt
- [ ] 색상 대비 비율 4.5:1 이상
- [ ] 스크린 리더 지원

#### 키보드 네비게이션
- [ ] Tab 순서 논리적 구성
- [ ] Focus 표시 명확히
- [ ] 모든 기능 키보드로 접근 가능

### 반응형 디자인
- [ ] 다양한 화면 크기 대응
- [ ] 세로 모드 최적화
- [ ] Safe Area 고려 (노치, 홈 인디케이터)
- [ ] 한 손 조작 편의성

## 🧪 테스트

### 컴포넌트 테스트
```typescript
// src/__tests__/components/PasswordCard.test.tsx
describe('PasswordCard', () => {
  test('패스워드 표시', () => {
    render(<PasswordCard password="test123" />);
    expect(screen.getByText('test123')).toBeInTheDocument();
  });

  test('복사 기능', () => {
    const onCopy = jest.fn();
    render(<PasswordCard onCopy={onCopy} />);
    fireEvent.press(screen.getByTestId('copy-button'));
    expect(onCopy).toHaveBeenCalled();
  });
});
```

### 스냅샷 테스트
- [ ] 각 컴포넌트 기본 렌더링
- [ ] 다크/라이트 테마 스냅샷
- [ ] 다양한 props 조합

### 접근성 테스트
- [ ] 스크린 리더 테스트
- [ ] 키보드 네비게이션 테스트
- [ ] 색상 대비 검사

## 📱 플랫폼별 고려사항

### iOS
- [ ] Human Interface Guidelines 준수
- [ ] SF Symbols 아이콘 활용
- [ ] 네이티브 햅틱 패턴
- [ ] Safe Area 처리

### Android
- [ ] Material Design 가이드라인
- [ ] 시스템 백 버튼 처리
- [ ] 네이티브 토스트 메시지
- [ ] 상태 표시줄 색상 조정

## 📊 성능 최적화
- [ ] React.memo() 적용으로 불필요한 리렌더링 방지
- [ ] useMemo()로 강도 계산 최적화
- [ ] 이미지 최적화 (WebP 형식)
- [ ] 애니메이션 60fps 유지

## 📚 참고 자료
- [React Native UI Kitten](https://akveo.github.io/react-native-ui-kitten/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## ⏰ 예상 소요 시간
7-10일

## 🏷️ 관련 이슈
- #2 2단계: 패스워드 생성 엔진 (선행)
- #4 4단계: 보안 기능 구현 (후행)

## ✅ Definition of Done
- [ ] 모든 컴포넌트 테스트 통과
- [ ] 접근성 검증 완료
- [ ] 다크/라이트 테마 완벽 동작
- [ ] iOS/Android 플랫폼별 테스트 완료
- [ ] 디자인 시스템 문서화
- [ ] 성능 요구사항 달성 (60fps)