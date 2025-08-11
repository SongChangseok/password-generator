---
name: "5단계: 패스워드 관리 시스템"
about: 패스워드 저장, 목록, 검색 및 관리 기능 개발
title: "[Phase 5] 패스워드 관리 시스템"
labels: ["phase-5", "feature", "storage", "ui"]
assignees: []
---

## 📋 목표
사용자가 생성한 패스워드를 안전하게 저장하고 효율적으로 관리할 수 있는 시스템 구축

## 🎯 완료 기준
- [ ] 최대 10개까지 패스워드 저장 기능
- [ ] 직관적인 목록 화면 및 상세 보기
- [ ] 빠른 검색 및 정렬 기능
- [ ] 편집/삭제 기능 완전 구현
- [ ] 암호화된 안전한 저장소 시스템

## 📝 세부 작업

### 1. 데이터 모델 및 타입 정의 (`src/types/password.ts`)

#### SavedPassword 인터페이스
```typescript
export interface SavedPassword {
  id: string;                    // UUID v4
  password: string;              // 암호화된 패스워드
  siteName: string;              // 사이트/앱 이름
  accountName?: string;          // 계정명 (선택)
  memo?: string;                 // 메모 (선택)
  strength: StrengthResult;      // 패스워드 강도 정보
  createdAt: Date;               // 생성일시
  lastUsed?: Date;               // 최근 사용일시
  usageCount: number;            // 사용 횟수
}

export interface PasswordListItem {
  id: string;
  siteName: string;
  accountName?: string;
  strength: StrengthResult;
  createdAt: Date;
  lastUsed?: Date;
  memoPreview?: string;          // 메모 미리보기 (첫 30자)
}

export type SortOption = 'latest' | 'name' | 'usage' | 'strength';
export type FilterOption = 'all' | 'weak' | 'strong' | 'recent';
```

### 2. 저장소 서비스 (`src/services/StorageService.ts`)

#### 암호화된 로컬 저장소 관리
```typescript
export class StorageService {
  private static readonly STORAGE_KEY = 'saved_passwords';
  private static readonly MAX_PASSWORDS = 10;

  // 패스워드 저장
  static async savePassword(password: SavedPassword): Promise<boolean> {
    try {
      const existing = await this.getAllPasswords();
      
      // 최대 개수 확인
      if (existing.length >= this.MAX_PASSWORDS) {
        throw new Error('최대 저장 가능한 패스워드 수를 초과했습니다.');
      }

      const updated = [...existing, password];
      const encrypted = await EncryptionService.encryptData(JSON.stringify(updated));
      await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
      
      return true;
    } catch (error) {
      console.error('패스워드 저장 실패:', error);
      return false;
    }
  }

  // 전체 패스워드 목록 조회
  static async getAllPasswords(): Promise<SavedPassword[]> {
    try {
      const encrypted = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!encrypted) return [];

      const decrypted = await EncryptionService.decryptData(encrypted);
      return JSON.parse(decrypted) as SavedPassword[];
    } catch (error) {
      console.error('패스워드 목록 조회 실패:', error);
      return [];
    }
  }

  // ID로 패스워드 조회
  static async getPasswordById(id: string): Promise<SavedPassword | null> {
    const passwords = await this.getAllPasswords();
    return passwords.find(p => p.id === id) || null;
  }

  // 패스워드 수정 (사이트명, 메모만)
  static async updatePassword(id: string, updates: Partial<SavedPassword>): Promise<boolean> {
    try {
      const passwords = await this.getAllPasswords();
      const index = passwords.findIndex(p => p.id === id);
      
      if (index === -1) return false;

      // 패스워드 자체는 수정 불가
      const { password, ...allowedUpdates } = updates;
      passwords[index] = { ...passwords[index], ...allowedUpdates };

      const encrypted = await EncryptionService.encryptData(JSON.stringify(passwords));
      await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
      
      return true;
    } catch (error) {
      console.error('패스워드 수정 실패:', error);
      return false;
    }
  }

  // 패스워드 삭제
  static async deletePassword(id: string): Promise<boolean> {
    try {
      const passwords = await this.getAllPasswords();
      const filtered = passwords.filter(p => p.id !== id);

      const encrypted = await EncryptionService.encryptData(JSON.stringify(filtered));
      await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
      
      return true;
    } catch (error) {
      console.error('패스워드 삭제 실패:', error);
      return false;
    }
  }

  // 전체 삭제
  static async deleteAllPasswords(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('전체 패스워드 삭제 실패:', error);
      return false;
    }
  }

  // 사용 기록 업데이트
  static async updateUsage(id: string): Promise<boolean> {
    return this.updatePassword(id, {
      lastUsed: new Date(),
      usageCount: (await this.getPasswordById(id))?.usageCount + 1 || 1
    });
  }
}
```

### 3. 패스워드 저장 다이얼로그 (`src/components/password/SaveDialog/`)

#### SaveDialog 컴포넌트
```typescript
interface SaveDialogProps {
  visible: boolean;
  password: string;
  strength: StrengthResult;
  onClose: () => void;
  onSave: (savedPassword: SavedPassword) => void;
}

export const SaveDialog: React.FC<SaveDialogProps> = ({
  visible,
  password,
  strength,
  onClose,
  onSave
}) => {
  const [siteName, setSiteName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!siteName.trim()) {
      Alert.alert('오류', '사이트명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const savedPassword: SavedPassword = {
        id: uuid.v4(),
        password: password,
        siteName: siteName.trim(),
        accountName: accountName.trim() || undefined,
        memo: memo.trim() || undefined,
        strength,
        createdAt: new Date(),
        usageCount: 0
      };

      const success = await StorageService.savePassword(savedPassword);
      if (success) {
        onSave(savedPassword);
        onClose();
        // 입력 필드 초기화
        setSiteName('');
        setAccountName('');
        setMemo('');
      } else {
        Alert.alert('오류', '패스워드 저장에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>패스워드 저장</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={!siteName.trim() || loading}
            style={[styles.saveButton, (!siteName.trim() || loading) && styles.disabled]}
          >
            <Text style={styles.saveText}>
              {loading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 패스워드 미리보기 */}
          <View style={styles.passwordPreview}>
            <Text style={styles.passwordText}>{password}</Text>
            <StrengthMeter strength={strength} />
          </View>

          {/* 입력 필드들 */}
          <View style={styles.formSection}>
            <Text style={styles.label}>사이트명 *</Text>
            <TextInput
              style={styles.input}
              value={siteName}
              onChangeText={setSiteName}
              placeholder="예: Gmail, 네이버, 회사 시스템"
              maxLength={50}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>계정명 (선택)</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="예: user@example.com"
              maxLength={100}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>메모 (선택)</Text>
            <TextInput
              style={[styles.input, styles.memoInput]}
              value={memo}
              onChangeText={setMemo}
              placeholder="추가 정보나 특이사항을 입력하세요"
              maxLength={200}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
```

### 4. 패스워드 목록 화면 (`src/screens/SavedPasswords/`)

#### SavedPasswordsScreen 컴포넌트
```typescript
export const SavedPasswordsScreen: React.FC = () => {
  const [passwords, setPasswords] = useState<SavedPassword[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<SavedPassword[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  // 패스워드 목록 로드
  const loadPasswords = async () => {
    try {
      const data = await StorageService.getAllPasswords();
      setPasswords(data);
      applyFiltersAndSort(data, searchQuery, sortOption);
    } catch (error) {
      Alert.alert('오류', '패스워드 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 검색 및 정렬 적용
  const applyFiltersAndSort = (
    data: SavedPassword[],
    query: string,
    sort: SortOption
  ) => {
    let filtered = data;

    // 검색 필터
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = data.filter(password => 
        password.siteName.toLowerCase().includes(lowerQuery) ||
        password.accountName?.toLowerCase().includes(lowerQuery) ||
        password.memo?.toLowerCase().includes(lowerQuery)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sort) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return a.siteName.localeCompare(b.siteName);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'strength':
          return b.strength.score - a.strength.score;
        default:
          return 0;
      }
    });

    setFilteredPasswords(filtered);
  };

  // 패스워드 카드 렌더링
  const renderPasswordCard = ({ item }: { item: SavedPassword }) => (
    <TouchableOpacity
      style={styles.passwordCard}
      onPress={() => navigation.navigate('PasswordDetail', { passwordId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.siteName}>{item.siteName}</Text>
        <StrengthIndicator strength={item.strength} size="small" />
      </View>
      
      {item.accountName && (
        <Text style={styles.accountName}>{item.accountName}</Text>
      )}
      
      <View style={styles.cardFooter}>
        <Text style={styles.createdDate}>
          {formatDate(item.createdAt)}
        </Text>
        {item.usageCount > 0 && (
          <Text style={styles.usageCount}>
            사용 {item.usageCount}회
          </Text>
        )}
      </View>

      {/* 스와이프 삭제를 위한 제스처 */}
      <SwipeRow
        rightOpenValue={-75}
        onRowOpen={() => console.log('Row opened')}
      >
        <View style={styles.hiddenItem}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Icon name="trash" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SwipeRow>
    </TouchableOpacity>
  );

  // 삭제 처리
  const handleDelete = (id: string) => {
    Alert.alert(
      '삭제 확인',
      '이 패스워드를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            const success = await StorageService.deletePassword(id);
            if (success) {
              loadPasswords();
            } else {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="사이트명, 계정명, 메모로 검색"
          value={searchQuery}
          onChangeText={(query) => {
            setSearchQuery(query);
            applyFiltersAndSort(passwords, query, sortOption);
          }}
        />
      </View>

      {/* 정렬 옵션 */}
      <View style={styles.sortContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'latest', label: '최신순' },
            { key: 'name', label: '이름순' },
            { key: 'usage', label: '사용순' },
            { key: 'strength', label: '강도순' }
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortOption === option.key && styles.sortButtonActive
              ]}
              onPress={() => {
                setSortOption(option.key as SortOption);
                applyFiltersAndSort(passwords, searchQuery, option.key as SortOption);
              }}
            >
              <Text style={[
                styles.sortButtonText,
                sortOption === option.key && styles.sortButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 패스워드 목록 */}
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : filteredPasswords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="lock" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? '검색 결과가 없습니다' : '저장된 패스워드가 없습니다'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? '다른 검색어를 시도해보세요' 
              : '패스워드를 생성한 후 저장해보세요'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPasswords}
          renderItem={renderPasswordCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadPasswords} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* 하단 정보 */}
      <View style={styles.bottomInfo}>
        <Text style={styles.infoText}>
          {filteredPasswords.length}/{StorageService.MAX_PASSWORDS} 저장됨
        </Text>
      </View>
    </SafeAreaView>
  );
};
```

### 5. 패스워드 상세 화면 (`src/screens/PasswordDetail/`)

#### PasswordDetailScreen 컴포넌트
```typescript
interface PasswordDetailScreenProps {
  route: {
    params: {
      passwordId: string;
    };
  };
}

export const PasswordDetailScreen: React.FC<PasswordDetailScreenProps> = ({ route }) => {
  const [password, setPassword] = useState<SavedPassword | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    siteName: '',
    accountName: '',
    memo: ''
  });

  const navigation = useNavigation();
  const { passwordId } = route.params;

  // 패스워드 상세 정보 로드
  useEffect(() => {
    loadPassword();
  }, [passwordId]);

  const loadPassword = async () => {
    try {
      const data = await StorageService.getPasswordById(passwordId);
      if (data) {
        setPassword(data);
        setEditData({
          siteName: data.siteName,
          accountName: data.accountName || '',
          memo: data.memo || ''
        });
      } else {
        Alert.alert('오류', '패스워드를 찾을 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('오류', '패스워드 정보를 불러올 수 없습니다.');
      navigation.goBack();
    }
  };

  // 복사 기능
  const handleCopy = async () => {
    if (password) {
      await Clipboard.setString(password.password);
      await StorageService.updateUsage(password.id);
      HapticFeedback.notificationAsync(HapticFeedback.NotificationFeedbackType.Success);
      Alert.alert('복사 완료', '패스워드가 클립보드에 복사되었습니다.');
    }
  };

  // 편집 저장
  const handleSave = async () => {
    if (!editData.siteName.trim()) {
      Alert.alert('오류', '사이트명을 입력해주세요.');
      return;
    }

    const success = await StorageService.updatePassword(passwordId, {
      siteName: editData.siteName.trim(),
      accountName: editData.accountName.trim() || undefined,
      memo: editData.memo.trim() || undefined
    });

    if (success) {
      setEditing(false);
      loadPassword(); // 새로고침
      Alert.alert('완료', '정보가 수정되었습니다.');
    } else {
      Alert.alert('오류', '수정에 실패했습니다.');
    }
  };

  if (!password) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 패스워드 표시 영역 */}
        <View style={styles.passwordSection}>
          <Text style={styles.sectionTitle}>패스워드</Text>
          <TouchableOpacity
            style={styles.passwordContainer}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.passwordText}>
              {showPassword ? password.password : '••••••••••••'}
            </Text>
            <Icon 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#64748B" 
            />
          </TouchableOpacity>
          
          <StrengthMeter strength={password.strength} />
          
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
            <Icon name="copy" size={16} color="white" />
            <Text style={styles.copyButtonText}>복사</Text>
          </TouchableOpacity>
        </View>

        {/* 정보 섹션 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>정보</Text>
          
          {editing ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>사이트명 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.siteName}
                  onChangeText={(text) => setEditData({...editData, siteName: text})}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>계정명</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.accountName}
                  onChangeText={(text) => setEditData({...editData, accountName: text})}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>메모</Text>
                <TextInput
                  style={[styles.textInput, styles.memoInput]}
                  value={editData.memo}
                  onChangeText={(text) => setEditData({...editData, memo: text})}
                  maxLength={200}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <InfoRow label="사이트명" value={password.siteName} />
              {password.accountName && (
                <InfoRow label="계정명" value={password.accountName} />
              )}
              {password.memo && (
                <InfoRow label="메모" value={password.memo} />
              )}
              
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Icon name="edit" size={16} color="#1E40AF" />
                <Text style={styles.editButtonText}>편집</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 통계 섹션 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>사용 통계</Text>
          <InfoRow label="생성일" value={formatDateTime(password.createdAt)} />
          {password.lastUsed && (
            <InfoRow label="최근 사용" value={formatDateTime(password.lastUsed)} />
          )}
          <InfoRow label="사용 횟수" value={`${password.usageCount}회`} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
```

## 🧪 테스트

### 단위 테스트
```typescript
describe('StorageService', () => {
  beforeEach(async () => {
    await StorageService.deleteAllPasswords();
  });

  test('패스워드 저장 및 조회', async () => {
    const password: SavedPassword = {
      id: 'test-id',
      password: 'TestPassword123!',
      siteName: 'Test Site',
      strength: { score: 4, label: '매우 강함', color: '#059669' },
      createdAt: new Date(),
      usageCount: 0
    };

    const saved = await StorageService.savePassword(password);
    expect(saved).toBe(true);

    const retrieved = await StorageService.getPasswordById('test-id');
    expect(retrieved?.siteName).toBe('Test Site');
  });

  test('최대 저장 개수 제한', async () => {
    // 10개 저장
    for (let i = 0; i < 10; i++) {
      await StorageService.savePassword({
        id: `test-${i}`,
        password: `password${i}`,
        siteName: `Site ${i}`,
        strength: { score: 3, label: '강함', color: '#059669' },
        createdAt: new Date(),
        usageCount: 0
      });
    }

    // 11번째 저장 시도 - 실패해야 함
    const result = await StorageService.savePassword({
      id: 'test-overflow',
      password: 'overflow',
      siteName: 'Overflow Site',
      strength: { score: 3, label: '강함', color: '#059669' },
      createdAt: new Date(),
      usageCount: 0
    });

    expect(result).toBe(false);
  });
});
```

### 통합 테스트
- [ ] 저장 → 목록 표시 → 상세 조회 플로우
- [ ] 검색 기능 정확성 테스트
- [ ] 정렬 옵션별 순서 확인
- [ ] 편집 기능 동작 테스트

## 📊 성능 요구사항
- [ ] 목록 로딩: **500ms 이내**
- [ ] 검색 응답: **200ms 이내**
- [ ] 저장/삭제 처리: **300ms 이내**

## 📱 UI/UX 요구사항
- [ ] 직관적인 카드 기반 목록 디자인
- [ ] 스와이프 삭제 제스처 지원
- [ ] 빈 상태 화면 (Empty State) 제공
- [ ] 로딩 및 오류 상태 처리

## 📚 참고 자료
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
- [AsyncStorage 최적화](https://react-native-async-storage.github.io/async-storage/)
- [React Native Swipe Row](https://github.com/jemise111/react-native-swipe-list-view)

## ⏰ 예상 소요 시간
10-14일

## 🏷️ 관련 이슈
- #4 4단계: 보안 기능 구현 (선행)
- #6 6단계: 공유 기능 구현 (후행)

## ✅ Definition of Done
- [ ] 모든 기능 테스트 통과
- [ ] UI/UX 디자인 가이드 준수
- [ ] 성능 요구사항 달성
- [ ] 암호화 저장 검증
- [ ] 접근성 요구사항 충족
- [ ] 에러 핸들링 완료