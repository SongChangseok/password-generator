---
name: "2단계: 패스워드 생성 엔진 개발"
about: 핵심 패스워드 생성 로직 및 보안 알고리즘 구현
title: "[Phase 2] 패스워드 생성 엔진 개발"
labels: ["phase-2", "core-feature", "security", "algorithm"]
assignees: []
---

## 📋 목표
암호학적으로 안전한 패스워드 생성 엔진 및 강도 계산 시스템 구현

## 🎯 완료 기준
- [ ] 4-128자 범위에서 안전한 패스워드 생성
- [ ] 모든 문자 유형 조합 지원 (대문자/소문자/숫자/특수문자)
- [ ] NIST 가이드라인 기반 패스워드 강도 계산
- [ ] 고급 옵션 (유사문자 제외, 연속문자 방지) 구현

## 📝 세부 작업

### 핵심 생성 엔진 (`src/utils/passwordGenerator.ts`)
- [ ] `GeneratorOptions` 인터페이스 정의
- [ ] `PasswordGenerator` 클래스 구현
- [ ] 암호학적으로 안전한 난수 생성기 (`crypto.getRandomValues()`)
- [ ] 문자 집합 관리 시스템

```typescript
interface GeneratorOptions {
  length: number;              // 4-128
  includeUppercase: boolean;   // A-Z
  includeLowercase: boolean;   // a-z  
  includeNumbers: boolean;     // 0-9
  includeSymbols: boolean;     // !@#$%^&*()_+-=[]{}|;:,.<>?
  excludeSimilar: boolean;     // 0/O, 1/l/I 제외
  preventRepeating: boolean;   // 연속 문자 방지
}
```

### 패스워드 강도 계산 (`src/utils/strengthCalculator.ts`)
- [ ] `StrengthResult` 인터페이스 정의
- [ ] NIST 가이드라인 기반 점수 계산
- [ ] 엔트로피 계산 알고리즘
- [ ] 색상 및 라벨 매핑

```typescript
interface StrengthResult {
  score: number;        // 0-4
  label: string;        // "매우 약함" ~ "매우 강함"
  color: string;        // 시각적 표시용 색상
  entropy: number;      // 엔트로피 값
}
```

### 고급 옵션 구현
- [ ] **유사 문자 제외**: `0`, `O`, `1`, `l`, `I` 등 혼동 가능한 문자 필터링
- [ ] **연속 문자 방지**: 동일 문자 연속 사용 제한
- [ ] **읽기 쉬운 형식**: 4자리씩 구분 표시 옵션

### 보안 요구사항
- [ ] 메모리에서만 처리 (로깅 방지)
- [ ] 시드 값의 예측 불가능성 보장
- [ ] 타이밍 공격 방지

### 입력 검증 (`src/utils/validation.ts`)
- [ ] 패스워드 길이 범위 검증 (4-128)
- [ ] 최소 하나 이상의 문자 유형 선택 강제
- [ ] 옵션 조합 유효성 검사

## 🧪 테스트 케이스

### 단위 테스트 (`src/__tests__/utils/passwordGenerator.test.ts`)
```typescript
describe('PasswordGenerator', () => {
  test('지정된 길이의 패스워드 생성', () => {
    const password = PasswordGenerator.generate({
      length: 12,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false
    });
    expect(password).toHaveLength(12);
  });

  test('문자 유형 포함 확인', () => {
    const password = PasswordGenerator.generate({
      length: 20,
      includeUppercase: true,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false
    });
    expect(/[A-Z]/.test(password)).toBeTruthy();
    expect(/[0-9]/.test(password)).toBeTruthy();
    expect(/[a-z]/.test(password)).toBeFalsy();
  });

  test('유사 문자 제외 옵션', () => {
    const password = PasswordGenerator.generate({
      length: 100,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
      excludeSimilar: true
    });
    expect(password).not.toMatch(/[0OlI1]/);
  });
});
```

### 강도 계산 테스트
```typescript
describe('StrengthCalculator', () => {
  test('약한 패스워드 감지', () => {
    const result = calculatePasswordStrength('123456');
    expect(result.score).toBeLessThan(2);
    expect(result.label).toContain('약함');
  });

  test('강한 패스워드 인식', () => {
    const result = calculatePasswordStrength('Kj#8Mx!nP2Qr7$vW');
    expect(result.score).toBeGreaterThan(3);
    expect(result.label).toContain('강함');
  });
});
```

## 📊 성능 요구사항
- [ ] 패스워드 생성: **1초 이내**
- [ ] 강도 계산: **100ms 이내**
- [ ] 메모리 사용: 최소화
- [ ] 배터리 효율성 고려

## 🔒 보안 체크리스트
- [ ] 암호학적으로 안전한 난수 사용
- [ ] 패스워드 메모리 누수 방지
- [ ] 타이밍 공격 취약점 검증
- [ ] 패턴 예측 가능성 테스트

## 📚 참고 자료
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## ⏰ 예상 소요 시간
7-10일

## 🏷️ 관련 이슈
- #1 1단계: 프로젝트 기반 설정 (선행)
- #3 3단계: 메인 UI 구현 (후행)

## ✅ Definition of Done
- [ ] 모든 단위 테스트 통과
- [ ] 성능 요구사항 달성
- [ ] 보안 체크리스트 완료
- [ ] 코드 리뷰 승인
- [ ] API 문서화 완료