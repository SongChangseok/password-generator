---
name: "4단계: 보안 기능 구현"
about: 생체 인증, 암호화, 앱 잠금 등 보안 시스템 개발
title: "[Phase 4] 보안 기능 구현"
labels: ["phase-4", "security", "authentication", "encryption"]
assignees: []
---

## 📋 목표
사용자 데이터 보호를 위한 포괄적인 보안 시스템 구축

## 🎯 완료 기준
- [ ] 생체 인증 (지문, 얼굴 인식) 완전 구현
- [ ] PIN 코드 인증 시스템 구축
- [ ] AES-256 데이터 암호화 적용
- [ ] 앱 백그라운드 보호 기능
- [ ] 자동 잠금 시스템 구현

## 🔒 보안 아키텍처

### 인증 레이어
```
사용자 → 생체 인증 → (실패 시) PIN 인증 → 앱 접근 허용
         ↓ (3회 실패)
        앱 데이터 초기화 옵션
```

### 데이터 보호 레이어
```
사용자 데이터 → AES-256 암호화 → 키체인 저장 → 복호화 → 앱에서 사용
```

## 📝 세부 작업

### 1. SecurityService 구현 (`src/services/SecurityService.ts`)

#### 생체 인증
```typescript
import { ReactNativeBiometrics } from 'react-native-biometrics';

export class SecurityService {
  // 생체 인증 가능성 확인
  static async isBiometricAvailable(): Promise<{
    available: boolean;
    biometryType: 'TouchID' | 'FaceID' | 'Biometrics' | null;
  }> {
    // react-native-biometrics 사용
  }

  // 생체 인증 실행
  static async authenticateWithBiometric(): Promise<{
    success: boolean;
    error?: string;
  }> {
    // 지문, 얼굴 인식 처리
  }

  // 생체 인증 설정
  static async enableBiometricAuth(): Promise<boolean> {
    // 생체 인증 활성화
  }
}
```

#### PIN 코드 인증
```typescript
import Keychain from '@react-native-keychain/react-native-keychain';

export class PINService {
  // PIN 설정
  static async setPIN(pin: string): Promise<boolean> {
    const hashedPIN = await this.hashPIN(pin);
    return await Keychain.setInternetCredentials(
      'SecurePassGenerator_PIN',
      'user',
      hashedPIN
    );
  }

  // PIN 검증
  static async verifyPIN(pin: string): Promise<boolean> {
    const credentials = await Keychain.getInternetCredentials('SecurePassGenerator_PIN');
    if (credentials) {
      const hashedInput = await this.hashPIN(pin);
      return hashedInput === credentials.password;
    }
    return false;
  }

  // PIN 해시 (보안 강화)
  private static async hashPIN(pin: string): Promise<string> {
    // bcrypt 또는 PBKDF2 사용
  }
}
```

### 2. 암호화 시스템 (`src/services/EncryptionService.ts`)

#### AES-256-GCM 구현
```typescript
import CryptoJS from 'react-native-crypto-js';

export class EncryptionService {
  // 기기별 고유 키 생성
  private static async generateDeviceKey(): Promise<string> {
    // 기기 고유 정보 + 랜덤 값 조합
  }

  // 데이터 암호화
  static async encryptData(data: string): Promise<{
    encrypted: string;
    iv: string;
  }> {
    const key = await this.getOrCreateKey();
    const iv = CryptoJS.lib.WordArray.random(16);
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.GCM
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv.toString()
    };
  }

  // 데이터 복호화
  static async decryptData(encrypted: string, iv: string): Promise<string> {
    const key = await this.getOrCreateKey();
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.GCM
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
```

### 3. 앱 잠금 시스템 (`src/components/security/LockScreen/`)

#### LockScreen 컴포넌트
```typescript
interface LockScreenProps {
  authType: 'biometric' | 'pin';
  onAuthenticated: () => void;
  onFailure: (attempts: number) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  authType,
  onAuthenticated,
  onFailure
}) => {
  // 인증 화면 UI
  // 실패 횟수 추적
  // 3회 실패 시 데이터 초기화 옵션
};
```

#### 자동 잠금 타이머
```typescript
export const useAutoLock = () => {
  const [lockTime, setLockTime] = useState<number>(300); // 5분 기본값
  
  useEffect(() => {
    const timer = setTimeout(() => {
      // 앱 잠금 실행
    }, lockTime * 1000);
    
    return () => clearTimeout(timer);
  }, [lockTime]);
};
```

### 4. 백그라운드 보호 (`src/hooks/useAppState.ts`)

#### 화면 보호 시스템
```typescript
import { AppState, Platform } from 'react-native';

export const useBackgroundProtection = () => {
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // 화면 블러 처리
        // 민감한 데이터 메모리에서 제거
      } else if (nextAppState === 'active') {
        // 인증 화면 표시
      }
    };

    AppState.addEventListener('change', handleAppStateChange);
    return () => AppState.removeEventListener('change', handleAppStateChange);
  }, []);
};
```

### 5. 보안 설정 화면 (`src/screens/Security/SecurityScreen.tsx`)

#### 설정 옵션
```typescript
const SecurityScreen = () => {
  return (
    <ScrollView>
      {/* 생체 인증 설정 */}
      <SettingSection title="생체 인증">
        <Toggle 
          value={biometricEnabled}
          onValueChange={toggleBiometric}
          label="지문/얼굴 인식 사용"
        />
      </SettingSection>

      {/* PIN 설정 */}
      <SettingSection title="PIN 코드">
        <Button 
          title={hasPIN ? "PIN 변경" : "PIN 설정"}
          onPress={showPINSetup}
        />
      </SettingSection>

      {/* 자동 잠금 */}
      <SettingSection title="자동 잠금">
        <Picker
          selectedValue={lockTimeout}
          onValueChange={setLockTimeout}
        >
          <Picker.Item label="즉시" value={0} />
          <Picker.Item label="1분" value={60} />
          <Picker.Item label="5분" value={300} />
          <Picker.Item label="15분" value={900} />
        </Picker>
      </SettingSection>

      {/* 데이터 초기화 */}
      <SettingSection title="보안">
        <Button 
          title="모든 데이터 초기화"
          onPress={showDataWipeDialog}
          color="red"
        />
      </SettingSection>
    </ScrollView>
  );
};
```

### 6. PIN 입력 컴포넌트 (`src/components/security/PinInput/`)

#### 사용자 친화적 PIN 입력
```typescript
const PinInput: React.FC<{
  onComplete: (pin: string) => void;
  maxAttempts?: number;
}> = ({ onComplete, maxAttempts = 3 }) => {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);

  // 숫자 키패드 UI
  // 점(•) 표시로 입력 값 숨김
  // 실패 시 진동 피드백
  // 최대 시도 횟수 제한

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PIN 입력</Text>
      <View style={styles.dotsContainer}>
        {[...Array(6)].map((_, index) => (
          <View 
            key={index}
            style={[
              styles.dot,
              pin.length > index && styles.filledDot
            ]}
          />
        ))}
      </View>
      <NumericKeypad onPress={handleKeyPress} />
      {attempts > 0 && (
        <Text style={styles.error}>
          잘못된 PIN입니다. ({maxAttempts - attempts}회 남음)
        </Text>
      )}
    </View>
  );
};
```

## 🧪 보안 테스트

### 단위 테스트
```typescript
describe('SecurityService', () => {
  test('데이터 암호화/복호화', async () => {
    const original = 'sensitive-password';
    const encrypted = await EncryptionService.encryptData(original);
    const decrypted = await EncryptionService.decryptData(
      encrypted.encrypted, 
      encrypted.iv
    );
    expect(decrypted).toBe(original);
  });

  test('PIN 해시 보안', async () => {
    const pin = '123456';
    const hash1 = await PINService.hashPIN(pin);
    const hash2 = await PINService.hashPIN(pin);
    // 같은 PIN이라도 다른 해시 (salt 사용)
    expect(hash1).not.toBe(hash2);
  });
});
```

### 보안 취약점 검사
- [ ] **타이밍 공격**: PIN 검증 시간 일정하게 유지
- [ ] **브루트 포스**: 시도 횟수 제한 및 지연 시간 추가
- [ ] **메모리 덤프**: 민감한 데이터 메모리 상주 최소화
- [ ] **키 관리**: 암호화 키 안전한 저장

### 침투 테스트 시나리오
1. **앱 백그라운드 전환 시** → 화면 내용 숨겨짐 확인
2. **메모리 분석 도구** → 패스워드 메모리 노출 여부
3. **루팅/탈옥 기기** → 보안 기능 우회 시도
4. **물리적 접근** → 생체 인증 우회 가능성

## 📱 플랫폼별 구현

### iOS 특화 기능
- [ ] **Keychain Services** 활용한 안전한 데이터 저장
- [ ] **LocalAuthentication** 프레임워크로 Touch ID/Face ID
- [ ] **App Background** 시 스크린샷 방지
- [ ] **Secure Enclave** 하드웨어 보안 활용

### Android 특화 기능
- [ ] **Android Keystore** 하드웨어 백 키 저장
- [ ] **BiometricPrompt** API로 지문 인식
- [ ] **WindowManager** 플래그로 스크린샷 방지
- [ ] **앱 전환 시 최근 앱 목록에서 숨김**

## 📊 성능 및 사용성

### 성능 목표
- [ ] 생체 인증 응답: **2초 이내**
- [ ] 암호화/복호화: **100ms 이내**
- [ ] 앱 잠금 해제: **3초 이내**

### 사용성 고려사항
- [ ] 생체 인증 실패 시 PIN 입력으로 자연스러운 전환
- [ ] 명확한 오류 메시지 및 가이드
- [ ] 설정 변경 시 확인 다이얼로그
- [ ] 데이터 백업 및 복구 안내

## 📚 참고 자료
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [iOS Security Guide](https://support.apple.com/guide/security/welcome/web)
- [Android Security Best Practices](https://developer.android.com/topic/security/best-practices)
- [React Native Security](https://reactnative.dev/docs/security)

## ⏰ 예상 소요 시간
10-14일

## 🏷️ 관련 이슈
- #3 3단계: 메인 UI 구현 (선행)
- #5 5단계: 패스워드 관리 시스템 (후행)

## ✅ Definition of Done
- [ ] 모든 보안 테스트 통과
- [ ] 침투 테스트 완료
- [ ] iOS/Android 플랫폼별 검증
- [ ] 성능 요구사항 달성
- [ ] 보안 감사 완료
- [ ] 사용자 가이드 작성