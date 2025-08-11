---
name: "6단계: 공유 기능 구현"
about: 안전한 패스워드 공유 기능 및 보안 경고 시스템
title: "[Phase 6] 공유 기능 구현"
labels: ["phase-6", "feature", "security", "ux"]
assignees: []
---

## 📋 목표
사용자가 생성된 패스워드를 안전하게 공유할 수 있는 기능 구현 및 보안 위험성 경고

## 🎯 완료 기준
- [ ] 시스템 네이티브 공유 시트 연동
- [ ] 공유 전 보안 경고 다이얼로그 표시
- [ ] 패스워드만 순수 텍스트로 공유 (앱 홍보 문구 제외)
- [ ] 공유 이벤트 로깅 (분석용, 선택사항)
- [ ] 다양한 공유 방식 지원 (메시지, 이메일, 클립보드 등)

## 📝 세부 작업

### 1. 공유 서비스 (`src/services/ShareService.ts`)

#### 안전한 패스워드 공유 시스템
```typescript
import Share from 'react-native-share';
import { Alert, Platform } from 'react-native';

export class ShareService {
  // 공유 가능한 앱들 정의
  private static readonly SHARE_OPTIONS = {
    message: '메시지',
    email: '이메일',
    copy: '클립보드에 복사',
    more: '더 보기...'
  };

  // 보안 경고와 함께 패스워드 공유
  static async sharePassword(password: string, siteName?: string): Promise<boolean> {
    try {
      // 1단계: 보안 경고 다이얼로그 표시
      const userConsent = await this.showSecurityWarning(siteName);
      if (!userConsent) {
        return false; // 사용자가 취소한 경우
      }

      // 2단계: 공유 방식 선택
      const shareMethod = await this.showShareMethodDialog();
      if (!shareMethod) {
        return false;
      }

      // 3단계: 선택된 방식으로 공유 실행
      const success = await this.executeShare(password, shareMethod, siteName);
      
      // 4단계: 공유 이벤트 로깅 (선택사항)
      if (success) {
        this.logShareEvent(shareMethod, siteName);
      }

      return success;
    } catch (error) {
      console.error('패스워드 공유 실패:', error);
      Alert.alert('오류', '공유 중 오류가 발생했습니다.');
      return false;
    }
  }

  // 보안 경고 다이얼로그
  private static showSecurityWarning(siteName?: string): Promise<boolean> {
    return new Promise((resolve) => {
      const title = '보안 주의사항';
      const message = `${siteName ? `${siteName} ` : ''}패스워드를 공유하시겠습니까?

⚠️ 중요한 보안 주의사항:
• 패스워드는 안전한 채널을 통해서만 전송하세요
• 공유 후에는 즉시 삭제하시길 권장합니다
• 신뢰할 수 있는 사람과만 공유하세요
• 가능하면 별도의 보안 앱을 사용하세요`;

      Alert.alert(
        title,
        message,
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: '공유하기',
            style: 'default',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  // 공유 방식 선택 다이얼로그
  private static showShareMethodDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const options = [
        { text: '메시지 앱', value: 'message' },
        { text: '이메일', value: 'email' },
        { text: '클립보드 복사', value: 'clipboard' },
        { text: '기타 앱', value: 'general' },
        { text: '취소', value: null, style: 'cancel' }
      ];

      // iOS의 경우 ActionSheet 사용, Android는 Alert 사용
      if (Platform.OS === 'ios') {
        // iOS ActionSheet 구현
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: options.map(opt => opt.text),
            cancelButtonIndex: options.length - 1,
            title: '공유 방식을 선택하세요'
          },
          (buttonIndex) => {
            resolve(options[buttonIndex].value);
          }
        );
      } else {
        // Android Alert 구현
        Alert.alert(
          '공유 방식 선택',
          '어떤 방식으로 공유하시겠습니까?',
          options.map(opt => ({
            text: opt.text,
            style: opt.style || 'default',
            onPress: () => resolve(opt.value)
          }))
        );
      }
    });
  }

  // 실제 공유 실행
  private static async executeShare(
    password: string, 
    method: string, 
    siteName?: string
  ): Promise<boolean> {
    try {
      switch (method) {
        case 'clipboard':
          return await this.copyToClipboard(password);
        
        case 'message':
          return await this.shareViaMessage(password, siteName);
        
        case 'email':
          return await this.shareViaEmail(password, siteName);
        
        case 'general':
          return await this.shareViaSystem(password, siteName);
        
        default:
          return false;
      }
    } catch (error) {
      console.error(`${method} 공유 실패:`, error);
      return false;
    }
  }

  // 클립보드 복사
  private static async copyToClipboard(password: string): Promise<boolean> {
    try {
      await Clipboard.setString(password);
      
      // 보안을 위해 30초 후 클립보드 자동 삭제
      setTimeout(async () => {
        const current = await Clipboard.getString();
        if (current === password) {
          await Clipboard.setString(''); // 클립보드 비우기
        }
      }, 30000);

      Alert.alert(
        '복사 완료', 
        '패스워드가 클립보드에 복사되었습니다.\n보안을 위해 30초 후 자동 삭제됩니다.'
      );
      
      return true;
    } catch (error) {
      Alert.alert('오류', '클립보드 복사에 실패했습니다.');
      return false;
    }
  }

  // 메시지 앱으로 공유
  private static async shareViaMessage(password: string, siteName?: string): Promise<boolean> {
    const shareOptions = {
      title: '패스워드 공유',
      message: this.formatPasswordMessage(password, siteName),
      social: Share.Social.SMS,
    };

    try {
      const result = await Share.open(shareOptions);
      return result.success || false;
    } catch (error) {
      if (error.message !== 'User did not share') {
        Alert.alert('오류', '메시지 공유에 실패했습니다.');
      }
      return false;
    }
  }

  // 이메일로 공유
  private static async shareViaEmail(password: string, siteName?: string): Promise<boolean> {
    const shareOptions = {
      title: `${siteName ? `${siteName} ` : ''}패스워드`,
      message: this.formatPasswordMessage(password, siteName),
      subject: `${siteName ? `${siteName} ` : ''}패스워드 공유`,
      social: Share.Social.EMAIL,
    };

    try {
      const result = await Share.open(shareOptions);
      return result.success || false;
    } catch (error) {
      if (error.message !== 'User did not share') {
        Alert.alert('오류', '이메일 공유에 실패했습니다.');
      }
      return false;
    }
  }

  // 시스템 공유 시트
  private static async shareViaSystem(password: string, siteName?: string): Promise<boolean> {
    const shareOptions = {
      title: '패스워드 공유',
      message: password, // 순수 패스워드만 공유
    };

    try {
      const result = await Share.open(shareOptions);
      return result.success || false;
    } catch (error) {
      if (error.message !== 'User did not share') {
        Alert.alert('오류', '공유에 실패했습니다.');
      }
      return false;
    }
  }

  // 공유용 메시지 포맷팅
  private static formatPasswordMessage(password: string, siteName?: string): string {
    const siteInfo = siteName ? `${siteName}용 ` : '';
    
    return `${siteInfo}패스워드: ${password}

⚠️ 보안상 사용 후 즉시 삭제해주세요.`;
  }

  // 공유 이벤트 로깅
  private static logShareEvent(method: string, siteName?: string): void {
    try {
      // 분석 도구에 이벤트 전송 (Firebase Analytics 등)
      // 개인정보는 절대 포함하지 않음
      const event = {
        event_name: 'password_shared',
        method: method,
        has_site_name: !!siteName,
        timestamp: new Date().toISOString()
      };

      // Analytics.logEvent('password_shared', event);
      console.log('Share event logged:', event);
    } catch (error) {
      console.error('이벤트 로깅 실패:', error);
    }
  }

  // 공유 기능 사용 가능성 확인
  static async isShareAvailable(): Promise<boolean> {
    try {
      // 플랫폼별 공유 기능 지원 여부 확인
      return await Share.isPackageInstalled('com.android.mms') || Platform.OS === 'ios';
    } catch (error) {
      return true; // 기본적으로 사용 가능하다고 가정
    }
  }
}
```

### 2. 공유 버튼 컴포넌트 (`src/components/password/ShareButton/`)

#### ShareButton 컴포넌트
```typescript
interface ShareButtonProps {
  password: string;
  siteName?: string;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onShareComplete?: (success: boolean) => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  password,
  siteName,
  style,
  size = 'medium',
  disabled = false,
  onShareComplete
}) => {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (disabled || sharing || !password) return;

    setSharing(true);
    try {
      const success = await ShareService.sharePassword(password, siteName);
      onShareComplete?.(success);
      
      if (success) {
        // 햅틱 피드백
        HapticFeedback.notificationAsync(
          HapticFeedback.NotificationFeedbackType.Success
        );
      }
    } finally {
      setSharing(false);
    }
  };

  const buttonSize = {
    small: { width: 32, height: 32, iconSize: 14 },
    medium: { width: 40, height: 40, iconSize: 16 },
    large: { width: 48, height: 48, iconSize: 20 }
  }[size];

  return (
    <TouchableOpacity
      style={[
        styles.shareButton,
        {
          width: buttonSize.width,
          height: buttonSize.height,
          opacity: disabled ? 0.5 : 1
        },
        style
      ]}
      onPress={handleShare}
      disabled={disabled || sharing}
      activeOpacity={0.7}
    >
      {sharing ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Icon 
          name="share" 
          size={buttonSize.iconSize} 
          color="white" 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shareButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  }
});
```

### 3. 고급 공유 기능 (`src/components/password/AdvancedShare/`)

#### 공유 히스토리 및 설정
```typescript
export const AdvancedShareDialog: React.FC<{
  visible: boolean;
  password: string;
  siteName?: string;
  onClose: () => void;
}> = ({ visible, password, siteName, onClose }) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [autoDeleteTime, setAutoDeleteTime] = useState(30); // 초 단위
  const [includeWarning, setIncludeWarning] = useState(true);

  const shareOptions = [
    { 
      id: 'clipboard', 
      title: '클립보드', 
      subtitle: '복사 후 자동 삭제',
      icon: 'copy',
      color: '#059669'
    },
    { 
      id: 'message', 
      title: '메시지', 
      subtitle: 'SMS/MMS 앱으로 전송',
      icon: 'message-square',
      color: '#1E40AF'
    },
    { 
      id: 'email', 
      title: '이메일', 
      subtitle: '이메일 클라이언트로 전송',
      icon: 'mail',
      color: '#DC2626'
    },
    { 
      id: 'secure', 
      title: '보안 앱', 
      subtitle: '암호화된 메신저 추천',
      icon: 'shield',
      color: '#7C3AED'
    }
  ];

  const handleShare = async () => {
    if (!selectedMethod) {
      Alert.alert('알림', '공유 방식을 선택해주세요.');
      return;
    }

    let success = false;
    
    if (selectedMethod === 'secure') {
      // 보안 앱 추천 다이얼로그
      showSecureAppRecommendations();
    } else {
      success = await ShareService.sharePassword(password, siteName);
    }

    if (success) {
      onClose();
    }
  };

  const showSecureAppRecommendations = () => {
    Alert.alert(
      '보안 앱 추천',
      '더 안전한 공유를 위해 다음 앱들을 권장합니다:\n\n• Signal\n• Telegram (Secret Chat)\n• WhatsApp\n• Wire\n\n이런 앱들은 종단간 암호화를 제공합니다.',
      [
        { text: '확인', onPress: () => onClose() }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>공유 방식 선택</Text>
          <TouchableOpacity onPress={handleShare}>
            <Text style={styles.shareText}>공유</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 보안 경고 */}
          <View style={styles.warningCard}>
            <Icon name="alert-triangle" size={20} color="#DC2626" />
            <View style={styles.warningText}>
              <Text style={styles.warningTitle}>보안 주의사항</Text>
              <Text style={styles.warningSubtitle}>
                패스워드 공유는 보안 위험을 수반합니다. 신뢰할 수 있는 채널을 사용하세요.
              </Text>
            </View>
          </View>

          {/* 공유 옵션들 */}
          {shareOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedMethod === option.id && styles.selectedCard
              ]}
              onPress={() => setSelectedMethod(option.id)}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                <Icon name={option.icon} size={20} color="white" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              {selectedMethod === option.id && (
                <Icon name="check-circle" size={20} color="#059669" />
              )}
            </TouchableOpacity>
          ))}

          {/* 추가 설정 */}
          {selectedMethod === 'clipboard' && (
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>클립보드 설정</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>자동 삭제 시간</Text>
                <View style={styles.timeSelector}>
                  {[10, 30, 60, 120].map(time => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeButton,
                        autoDeleteTime === time && styles.selectedTime
                      ]}
                      onPress={() => setAutoDeleteTime(time)}
                    >
                      <Text style={[
                        styles.timeText,
                        autoDeleteTime === time && styles.selectedTimeText
                      ]}>
                        {time}초
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
```

## 🧪 테스트

### 단위 테스트
```typescript
describe('ShareService', () => {
  test('보안 경고 다이얼로그 표시', async () => {
    const mockAlert = jest.spyOn(Alert, 'alert');
    
    await ShareService.sharePassword('test123', 'Gmail');
    
    expect(mockAlert).toHaveBeenCalledWith(
      '보안 주의사항',
      expect.stringContaining('Gmail 패스워드를 공유하시겠습니까?'),
      expect.any(Array)
    );
  });

  test('클립보드 자동 삭제', async () => {
    const mockClipboard = jest.spyOn(Clipboard, 'setString');
    
    await ShareService.copyToClipboard('test123');
    
    // 30초 후 클립보드가 비워지는지 확인
    jest.advanceTimersByTime(30000);
    
    expect(mockClipboard).toHaveBeenLastCalledWith('');
  });

  test('공유 이벤트 로깅', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    ShareService.logShareEvent('message', 'Gmail');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Share event logged:',
      expect.objectContaining({
        event_name: 'password_shared',
        method: 'message'
      })
    );
  });
});
```

### E2E 테스트 시나리오
1. **공유 버튼 클릭** → 보안 경고 표시 확인
2. **경고 승인** → 공유 방식 선택 다이얼로그 표시
3. **클립보드 선택** → 복사 완료 메시지 및 자동 삭제 확인
4. **메시지 공유** → 네이티브 메시지 앱 실행 확인
5. **취소 플로우** → 각 단계에서 취소 가능 확인

## 📊 보안 요구사항
- [ ] **순수 패스워드만 공유**: 앱 홍보나 추가 정보 포함 금지
- [ ] **보안 경고 필수**: 모든 공유 전에 위험성 경고
- [ ] **클립보드 자동 삭제**: 30초 후 자동 삭제로 보안 강화
- [ ] **로깅 익명화**: 개인정보나 패스워드 내용은 절대 로깅 금지

## 📱 사용성 요구사항
- [ ] 직관적인 공유 버튼 배치
- [ ] 명확한 공유 방식 분류
- [ ] 적절한 햅틱 피드백 제공
- [ ] 오프라인 상황 대응

## 📚 참고 자료
- [React Native Share](https://github.com/react-native-share/react-native-share)
- [iOS Share Sheet Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/extensions/sharing-and-actions/)
- [Android Sharing Best Practices](https://developer.android.com/training/sharing)

## ⏰ 예상 소요 시간
5-7일

## 🏷️ 관련 이슈
- #5 5단계: 패스워드 관리 시스템 (선행)
- #7 7단계: 광고 및 수익화 (후행)

## ✅ Definition of Done
- [ ] 모든 공유 방식 정상 동작 확인
- [ ] 보안 경고 시스템 완전 구현
- [ ] 플랫폼별 네이티브 공유 연동 확인
- [ ] 사용자 경험 테스트 완료
- [ ] 보안 검토 통과
- [ ] 접근성 가이드라인 준수