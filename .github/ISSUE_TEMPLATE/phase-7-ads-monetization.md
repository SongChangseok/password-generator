---
name: "7단계: 광고 및 수익화"
about: AdMob 광고 통합 및 광고 제거 인앱 구매 구현
title: "[Phase 7] 광고 및 수익화"
labels: ["phase-7", "monetization", "ads", "iap"]
assignees: []
---

## 📋 목표
AdMob 광고 시스템 통합 및 광고 제거 인앱 구매 옵션으로 수익화 모델 구축

## 🎯 완료 기준
- [ ] 배너, 전면, 네이티브 광고 모든 유형 구현
- [ ] 사용자 경험을 해치지 않는 적절한 광고 빈도
- [ ] $1.99 광고 제거 인앱 구매 시스템
- [ ] 광고 수익 최적화 및 성능 모니터링
- [ ] GDPR/CCPA 개인정보 보호 정책 준수

## 📝 세부 작업

### 1. AdMob 초기 설정 (`src/services/AdService.ts`)

#### 광고 서비스 기본 구조
```typescript
import { 
  AdMobBanner, 
  AdMobInterstitial, 
  AdMobRewarded,
  PublisherBanner 
} from 'react-native-admob-native-ads';
import { BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AdService {
  // 광고 ID 설정 (개발/운영 구분)
  private static readonly AD_UNIT_IDS = {
    banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxx/xxxxxxxx',
    interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxx/xxxxxxxx',
    nativeAdvanced: __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-xxxxxxxx/xxxxxxxx'
  };

  // 광고 표시 간격 설정 (초 단위)
  private static readonly AD_INTERVALS = {
    interstitial: 180,    // 3분마다
    appOpen: 300,         // 5분마다
    sessionBased: 5       // 5회 사용마다
  };

  // 광고 제거 구매 여부 캐시
  private static adFreeStatus: boolean | null = null;
  private static lastInterstitialTime = 0;
  private static actionCount = 0;

  // AdMob 초기화
  static async initialize(): Promise<void> {
    try {
      await GoogleMobileAds.initialize();
      
      // GDPR 설정 (유럽 사용자 대상)
      const consentInfo = await AdsConsent.requestInfoUpdate({
        debugGeography: __DEV__ ? AdsConsentDebugGeography.EEA : undefined,
        testDeviceIds: __DEV__ ? ['TEST_DEVICE_ID'] : []
      });

      if (consentInfo.isConsentFormAvailable) {
        await AdsConsent.showForm();
      }

      // 광고 제거 상태 확인
      await this.checkAdFreeStatus();
      
      console.log('AdMob 초기화 완료');
    } catch (error) {
      console.error('AdMob 초기화 실패:', error);
    }
  }

  // 광고 제거 상태 확인
  static async checkAdFreeStatus(): Promise<boolean> {
    try {
      if (this.adFreeStatus === null) {
        const status = await AsyncStorage.getItem('ad_free_purchased');
        this.adFreeStatus = status === 'true';
      }
      return this.adFreeStatus || false;
    } catch (error) {
      console.error('광고 제거 상태 확인 실패:', error);
      return false;
    }
  }

  // 광고 제거 상태 업데이트
  static async setAdFreeStatus(status: boolean): Promise<void> {
    try {
      this.adFreeStatus = status;
      await AsyncStorage.setItem('ad_free_purchased', status.toString());
    } catch (error) {
      console.error('광고 제거 상태 저장 실패:', error);
    }
  }

  // 배너 광고 표시 여부 확인
  static async shouldShowBannerAd(): Promise<boolean> {
    const adFree = await this.checkAdFreeStatus();
    return !adFree;
  }

  // 전면 광고 표시 여부 확인 (시간 기반)
  static async shouldShowInterstitialAd(): Promise<boolean> {
    const adFree = await this.checkAdFreeStatus();
    if (adFree) return false;

    const now = Date.now();
    const timeDiff = (now - this.lastInterstitialTime) / 1000;
    
    return timeDiff >= this.AD_INTERVALS.interstitial;
  }

  // 액션 기반 광고 표시 여부 확인
  static async shouldShowActionBasedAd(): Promise<boolean> {
    const adFree = await this.checkAdFreeStatus();
    if (adFree) return false;

    this.actionCount++;
    
    if (this.actionCount >= this.AD_INTERVALS.sessionBased) {
      this.actionCount = 0;
      return true;
    }
    
    return false;
  }

  // 전면 광고 표시
  static async showInterstitialAd(): Promise<boolean> {
    try {
      const shouldShow = await this.shouldShowInterstitialAd();
      if (!shouldShow) return false;

      const interstitial = AdMobInterstitial.createForAdRequest(
        this.AD_UNIT_IDS.interstitial
      );

      await interstitial.load();
      await interstitial.show();
      
      this.lastInterstitialTime = Date.now();
      this.logAdEvent('interstitial_shown');
      
      return true;
    } catch (error) {
      console.error('전면 광고 표시 실패:', error);
      return false;
    }
  }

  // 광고 이벤트 로깅
  static logAdEvent(eventType: string, additionalData?: any): void {
    try {
      const event = {
        event_name: 'ad_event',
        ad_type: eventType,
        timestamp: new Date().toISOString(),
        ...additionalData
      };

      // Analytics에 전송 (Firebase Analytics 등)
      // Analytics.logEvent('ad_event', event);
      console.log('Ad event logged:', event);
    } catch (error) {
      console.error('광고 이벤트 로깅 실패:', error);
    }
  }

  // 광고 수익 최적화를 위한 A/B 테스트
  static getAdPlacementVariant(): 'bottom' | 'top' | 'smart' {
    // 사용자 ID나 세션 기반으로 A/B 테스트 그룹 결정
    const variants = ['bottom', 'top', 'smart'] as const;
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }
}
```

### 2. 배너 광고 컴포넌트 (`src/components/ads/BannerAd/`)

#### 적응형 배너 광고
```typescript
interface BannerAdProps {
  placement: 'top' | 'bottom' | 'inline';
  style?: ViewStyle;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: any) => void;
}

export const BannerAd: React.FC<BannerAdProps> = ({
  placement,
  style,
  onAdLoaded,
  onAdFailedToLoad
}) => {
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const [adSize, setAdSize] = useState<BannerAdSize>(BannerAdSize.ADAPTIVE_BANNER);

  useEffect(() => {
    checkAdStatus();
  }, []);

  const checkAdStatus = async () => {
    const shouldShow = await AdService.shouldShowBannerAd();
    setShouldShowAd(shouldShow);

    if (shouldShow) {
      // 화면 크기에 따른 적응형 광고 크기 결정
      const { width, height } = Dimensions.get('window');
      if (width < 400) {
        setAdSize(BannerAdSize.BANNER);
      } else if (width < 728) {
        setAdSize(BannerAdSize.LARGE_BANNER);
      } else {
        setAdSize(BannerAdSize.LEADERBOARD);
      }
    }
  };

  const handleAdLoaded = () => {
    AdService.logAdEvent('banner_loaded', { placement });
    onAdLoaded?.();
  };

  const handleAdError = (error: any) => {
    console.error(`Banner ad error (${placement}):`, error);
    AdService.logAdEvent('banner_error', { placement, error: error.message });
    onAdFailedToLoad?.(error);
  };

  if (!shouldShowAd) {
    return null;
  }

  return (
    <View style={[styles.bannerContainer, style]}>
      <BannerAd
        unitId={AdService.AD_UNIT_IDS.banner}
        size={adSize}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          networkExtras: {
            collapsible: placement === 'bottom' ? 'bottom' : 'top'
          }
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdError}
      />
      
      {/* 광고 표시기 (선택사항) */}
      <Text style={styles.adLabel}>광고</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
  },
  adLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  }
});
```

### 3. 네이티브 광고 컴포넌트 (`src/components/ads/NativeAd/`)

#### 패스워드 목록에 자연스럽게 통합되는 네이티브 광고
```typescript
interface NativeAdProps {
  index: number; // 목록에서의 위치
  onAdLoaded?: () => void;
  onAdClicked?: () => void;
}

export const NativeAd: React.FC<NativeAdProps> = ({
  index,
  onAdLoaded,
  onAdClicked
}) => {
  const [adData, setAdData] = useState<any>(null);
  const [shouldShowAd, setShouldShowAd] = useState(false);

  useEffect(() => {
    checkAndLoadAd();
  }, [index]);

  const checkAndLoadAd = async () => {
    // 3번째, 8번째 위치에만 광고 표시 (너무 자주 노출 방지)
    const shouldShow = await AdService.shouldShowBannerAd() && 
                      (index === 2 || index === 7);
    
    setShouldShowAd(shouldShow);
    
    if (shouldShow) {
      loadNativeAd();
    }
  };

  const loadNativeAd = async () => {
    try {
      const nativeAd = new NativeAd(AdService.AD_UNIT_IDS.nativeAdvanced);
      
      nativeAd.onAdLoaded(() => {
        setAdData(nativeAd);
        AdService.logAdEvent('native_loaded', { index });
        onAdLoaded?.();
      });

      nativeAd.onAdFailedToLoad((error) => {
        console.error('Native ad failed to load:', error);
        AdService.logAdEvent('native_error', { index, error: error.message });
      });

      nativeAd.onAdClicked(() => {
        AdService.logAdEvent('native_clicked', { index });
        onAdClicked?.();
      });

      await nativeAd.load();
    } catch (error) {
      console.error('Native ad loading error:', error);
    }
  };

  if (!shouldShowAd || !adData) {
    return null;
  }

  return (
    <View style={styles.nativeAdContainer}>
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>광고</Text>
      </View>
      
      <NativeAdView adData={adData} style={styles.nativeAdView}>
        <View style={styles.adContent}>
          <Image source={{ uri: adData.icon }} style={styles.adIcon} />
          <View style={styles.adTextContent}>
            <Text style={styles.adHeadline} numberOfLines={1}>
              {adData.headline}
            </Text>
            <Text style={styles.adBody} numberOfLines={2}>
              {adData.body}
            </Text>
          </View>
          <TouchableOpacity style={styles.adActionButton}>
            <Text style={styles.adActionText}>
              {adData.callToAction}
            </Text>
          </TouchableOpacity>
        </View>
      </NativeAdView>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeAdContainer: {
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#94A3B8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  nativeAdView: {
    flex: 1,
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  adTextContent: {
    flex: 1,
  },
  adHeadline: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  adBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  adActionButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  adActionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  }
});
```

### 4. 인앱 구매 시스템 (`src/services/PurchaseService.ts`)

#### 광고 제거 구매 관리
```typescript
import { 
  purchaseErrorListener, 
  purchaseUpdatedListener,
  initConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  PurchaseError,
  ProductPurchase
} from 'react-native-iap';

export class PurchaseService {
  private static readonly PRODUCT_IDS = {
    removeAds: __DEV__ ? 'com.securepass.removeads.test' : 'com.securepass.removeads'
  };

  private static purchaseUpdateSubscription: any;
  private static purchaseErrorSubscription: any;
  private static isInitialized = false;

  // 인앱 구매 초기화
  static async initialize(): Promise<void> {
    try {
      await initConnection();
      this.isInitialized = true;
      
      // 구매 이벤트 리스너 설정
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        this.handlePurchaseUpdate.bind(this)
      );

      this.purchaseErrorSubscription = purchaseErrorListener(
        this.handlePurchaseError.bind(this)
      );

      // 기존 구매 내역 확인 (앱 재설치 등의 경우)
      await this.restorePurchases();
      
      console.log('인앱 구매 초기화 완료');
    } catch (error) {
      console.error('인앱 구매 초기화 실패:', error);
    }
  }

  // 구매 가능한 상품 조회
  static async getAvailableProducts(): Promise<any[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const products = await getProducts([this.PRODUCT_IDS.removeAds]);
      return products;
    } catch (error) {
      console.error('상품 조회 실패:', error);
      return [];
    }
  }

  // 광고 제거 구매 실행
  static async purchaseRemoveAds(): Promise<boolean> {
    try {
      const products = await this.getAvailableProducts();
      if (products.length === 0) {
        Alert.alert('오류', '구매 가능한 상품이 없습니다.');
        return false;
      }

      // 구매 확인 다이얼로그
      const userConfirmed = await this.showPurchaseConfirmation(products[0]);
      if (!userConfirmed) {
        return false;
      }

      // 구매 실행
      await requestPurchase(this.PRODUCT_IDS.removeAds);
      return true; // 실제 구매 완료는 handlePurchaseUpdate에서 처리
    } catch (error) {
      console.error('구매 실행 실패:', error);
      Alert.alert('구매 실패', '구매 처리 중 오류가 발생했습니다.');
      return false;
    }
  }

  // 구매 확인 다이얼로그
  private static showPurchaseConfirmation(product: any): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '광고 제거',
        `광고를 영구적으로 제거하시겠습니까?\n\n가격: ${product.localizedPrice}\n\n• 모든 배너 광고 제거\n• 전면 광고 제거\n• 네이티브 광고 제거\n• 구매는 복원 가능합니다`,
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: '구매하기',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  // 구매 업데이트 처리
  private static async handlePurchaseUpdate(purchase: ProductPurchase): Promise<void> {
    try {
      if (purchase.productId === this.PRODUCT_IDS.removeAds) {
        // 구매 검증 (서버 검증 권장, 여기서는 간단히 처리)
        if (purchase.transactionReceipt) {
          await AdService.setAdFreeStatus(true);
          
          // 구매 완료 알림
          Alert.alert(
            '구매 완료',
            '광고가 성공적으로 제거되었습니다. 이용해 주셔서 감사합니다!'
          );

          // 구매 이벤트 로깅
          this.logPurchaseEvent('remove_ads_purchased', purchase);
        }
      }

      // 트랜잭션 완료 처리
      await finishTransaction(purchase);
    } catch (error) {
      console.error('구매 업데이트 처리 실패:', error);
    }
  }

  // 구매 에러 처리
  private static handlePurchaseError(error: PurchaseError): void {
    console.error('구매 에러:', error);
    
    if (error.code !== 'E_USER_CANCELLED') {
      Alert.alert('구매 실패', error.message || '구매 처리 중 오류가 발생했습니다.');
    }

    this.logPurchaseEvent('purchase_error', { error: error.message });
  }

  // 구매 복원
  static async restorePurchases(): Promise<void> {
    try {
      // 플랫폼별 구매 내역 조회 및 복원 로직
      // iOS: getAvailablePurchases(), Android: getPurchaseHistory()
      
      // 간단한 예시
      const adFreeStatus = await AdService.checkAdFreeStatus();
      if (adFreeStatus) {
        console.log('광고 제거 구매 상태 확인됨');
      }
    } catch (error) {
      console.error('구매 복원 실패:', error);
    }
  }

  // 구매 이벤트 로깅
  private static logPurchaseEvent(eventType: string, data?: any): void {
    try {
      const event = {
        event_name: 'purchase_event',
        purchase_type: eventType,
        timestamp: new Date().toISOString(),
        // 민감한 정보는 제외하고 로깅
        product_id: data?.productId || this.PRODUCT_IDS.removeAds,
        ...data
      };

      // Analytics.logEvent('purchase_event', event);
      console.log('Purchase event logged:', event);
    } catch (error) {
      console.error('구매 이벤트 로깅 실패:', error);
    }
  }

  // 정리
  static cleanup(): void {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
    }
  }
}
```

### 5. 광고 제거 설정 화면 (`src/components/ads/RemoveAdsCard/`)

#### 설정 화면의 광고 제거 옵션
```typescript
export const RemoveAdsCard: React.FC = () => {
  const [adFreeStatus, setAdFreeStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 광고 제거 상태 확인
      const status = await AdService.checkAdFreeStatus();
      setAdFreeStatus(status);

      // 구매 가능한 상품 정보 로드
      if (!status) {
        const products = await PurchaseService.getAvailableProducts();
        if (products.length > 0) {
          setProduct(products[0]);
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const success = await PurchaseService.purchaseRemoveAds();
      if (success) {
        // 구매 상태 새로고침
        await loadData();
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await PurchaseService.restorePurchases();
      await loadData();
      Alert.alert('복원 완료', '구매 내역을 확인했습니다.');
    } catch (error) {
      Alert.alert('복원 실패', '구매 내역을 찾을 수 없습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {adFreeStatus ? (
        // 이미 구매한 경우
        <View style={styles.purchasedContainer}>
          <Icon name="check-circle" size={24} color="#059669" />
          <Text style={styles.purchasedTitle}>광고 제거됨</Text>
          <Text style={styles.purchasedSubtitle}>
            프리미엄 버전을 이용해 주셔서 감사합니다!
          </Text>
        </View>
      ) : (
        // 구매 가능한 경우
        <View style={styles.purchaseContainer}>
          <View style={styles.benefitsList}>
            <Text style={styles.title}>광고 제거</Text>
            <Text style={styles.subtitle}>더 나은 사용 경험을 위해</Text>
            
            <View style={styles.benefit}>
              <Icon name="x" size={16} color="#059669" />
              <Text style={styles.benefitText}>모든 배너 광고 제거</Text>
            </View>
            <View style={styles.benefit}>
              <Icon name="x" size={16} color="#059669" />
              <Text style={styles.benefitText}>전면 광고 제거</Text>
            </View>
            <View style={styles.benefit}>
              <Icon name="x" size={16} color="#059669" />
              <Text style={styles.benefitText}>목록 내 광고 제거</Text>
            </View>
            <View style={styles.benefit}>
              <Icon name="heart" size={16} color="#059669" />
              <Text style={styles.benefitText}>개발 지원</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.purchaseButton, purchasing && styles.disabled]}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {product ? `${product.localizedPrice}에 구매` : '구매하기'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
            >
              <Text style={styles.restoreButtonText}>구매 복원</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  purchasedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  purchasedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 8,
  },
  purchasedSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  purchaseContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  actions: {
    gap: 8,
  },
  purchaseButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#64748B',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  }
});
```

## 🧪 테스트

### A/B 테스트 시나리오
```typescript
describe('AdService A/B Testing', () => {
  test('배너 위치별 성능 측정', async () => {
    const variants = ['bottom', 'top', 'smart'];
    
    for (const variant of variants) {
      const placement = AdService.getAdPlacementVariant();
      expect(variants).toContain(placement);
    }
  });
});

describe('PurchaseService', () => {
  test('구매 프로세스 시뮬레이션', async () => {
    const products = await PurchaseService.getAvailableProducts();
    expect(products).toBeDefined();
  });

  test('광고 제거 상태 저장/복원', async () => {
    await AdService.setAdFreeStatus(true);
    const status = await AdService.checkAdFreeStatus();
    expect(status).toBe(true);
  });
});
```

## 📊 수익화 전략

### 광고 배치 최적화
- **배너 광고**: 메인 화면 하단, 접기 가능
- **전면 광고**: 3분 간격 또는 5회 액션마다
- **네이티브 광고**: 목록 3, 8번째 위치

### 수익 목표
- **월간 목표**: $500
- **예상 ARPU**: $0.10-0.50
- **광고 제거 전환율**: 2-5%

## 📱 사용자 경험 보호
- [ ] 과도한 광고 방지 (적절한 간격)
- [ ] 쉬운 광고 제거 옵션 제공
- [ ] 명확한 광고 표시 라벨
- [ ] 빠른 광고 로딩 (2초 이내)

## 📚 참고 자료
- [AdMob 정책 가이드라인](https://support.google.com/admob/answer/6128877)
- [React Native IAP](https://github.com/dooboolab/react-native-iap)
- [GDPR 준수 가이드](https://developers.google.com/admob/android/eu-consent)

## ⏰ 예상 소요 시간
7-10일

## 🏷️ 관련 이슈
- #6 6단계: 공유 기능 구현 (선행)
- #8 8단계: 테스트 및 최적화 (후행)

## ✅ Definition of Done
- [ ] 모든 광고 유형 정상 표시 확인
- [ ] 인앱 구매 플로우 완전 동작
- [ ] 광고 수익 추적 시스템 구현
- [ ] GDPR/CCPA 개인정보 정책 준수
- [ ] A/B 테스트 시스템 구축
- [ ] 스토어 정책 준수 확인