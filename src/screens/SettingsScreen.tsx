import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors } from '@/utils/colors';
import {
  checkBiometricCapabilities,
  getAuthenticationTypeName,
  isBiometricAuthEnabled,
  setBiometricAuthEnabled,
  getSecurityLevelDescription,
  type BiometricCapabilities,
} from '@/utils/biometricAuth';
import {
  isPinConfigured,
  isPinEnabled,
  type PinSettings,
  getPinSettings,
} from '@/utils/pinAuth';
import { useAppLock } from '@/contexts/AppLockContext';
import {
  enableAppLock,
  disableAppLock,
  type AppLockSettings,
} from '@/utils/appLock';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {
    settings: appLockSettings,
    isAvailable: appLockAvailable,
    refreshSettings,
  } = useAppLock();
  const [biometricCapabilities, setBiometricCapabilities] =
    useState<BiometricCapabilities | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinSettings, setPinSettings] = useState<PinSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      // Load biometric capabilities
      const capabilities = await checkBiometricCapabilities();
      setBiometricCapabilities(capabilities);

      // Load biometric setting
      const biometricSetting = await isBiometricAuthEnabled();
      setBiometricEnabled(biometricSetting);

      // Load PIN settings
      const pinSettings = await getPinSettings();
      setPinSettings(pinSettings);

      // Refresh app lock settings
      await refreshSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  }, [refreshSettings]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      if (enabled && biometricCapabilities) {
        if (!biometricCapabilities.hasHardware) {
          Alert.alert(
            'Not Available',
            'Biometric authentication hardware is not available on this device.'
          );
          return;
        }

        if (!biometricCapabilities.isEnrolled) {
          Alert.alert(
            'Not Set Up',
            'Please set up biometric authentication in your device settings first.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Settings',
                onPress: () => {
                  /* Open device settings */
                },
              },
            ]
          );
          return;
        }
      }

      await setBiometricAuthEnabled(enabled);
      setBiometricEnabled(enabled);
    } catch (error) {
      console.error('Error toggling biometric auth:', error);
      Alert.alert('Error', 'Failed to update biometric authentication setting');
    }
  };

  const handlePinSetup = () => {
    (navigation as any).navigate('PinSetup', { mode: 'setup' });
  };

  const handlePinChange = () => {
    (navigation as any).navigate('PinSetup', { mode: 'change' });
  };

  const handlePinRemove = () => {
    Alert.alert(
      'Remove PIN',
      'Are you sure you want to remove PIN authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            (navigation as any).navigate('PinSetup', { mode: 'remove' });
          },
        },
      ]
    );
  };

  const handleAppLockToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        if (!appLockAvailable) {
          Alert.alert(
            'Authentication Required',
            'Please set up biometric authentication or PIN code first.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Set up PIN',
                onPress: () =>
                  (navigation as any).navigate('PinSetup', { mode: 'setup' }),
              },
            ]
          );
          return;
        }
        await enableAppLock();
      } else {
        Alert.alert(
          'Disable App Lock',
          'Are you sure you want to disable app lock protection?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await disableAppLock();
                await refreshSettings();
              },
            },
          ]
        );
        return;
      }

      await refreshSettings();
    } catch (error) {
      console.error('Error toggling app lock:', error);
      Alert.alert('Error', 'Failed to update app lock setting');
    }
  };

  const renderSecuritySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>

      {/* App Lock */}
      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>App Lock</Text>
          <Text style={styles.settingDescription}>
            {appLockSettings?.isEnabled
              ? 'App will lock automatically for security'
              : appLockAvailable
                ? 'Enable automatic app locking'
                : 'Set up authentication methods first'}
          </Text>
        </View>
        <Switch
          value={appLockSettings?.isEnabled || false}
          onValueChange={handleAppLockToggle}
          disabled={!appLockAvailable}
          trackColor={{ false: Colors.gray300, true: Colors.primary }}
          thumbColor={
            appLockSettings?.isEnabled ? Colors.white : Colors.gray100
          }
        />
      </View>

      {/* Biometric Authentication */}
      {biometricCapabilities && (
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>
              {getAuthenticationTypeName(biometricCapabilities.supportedTypes)}
            </Text>
            <Text style={styles.settingDescription}>
              {biometricCapabilities.hasHardware
                ? biometricCapabilities.isEnrolled
                  ? 'Use biometric authentication to secure the app'
                  : 'Set up biometric authentication in device settings'
                : 'Biometric hardware not available'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={
              !biometricCapabilities.hasHardware ||
              !biometricCapabilities.isEnrolled
            }
            trackColor={{ false: Colors.gray300, true: Colors.primary }}
            thumbColor={biometricEnabled ? Colors.white : Colors.gray100}
          />
        </View>
      )}

      {/* PIN Authentication */}
      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>PIN Code</Text>
          <Text style={styles.settingDescription}>
            {pinSettings?.hasPin
              ? 'PIN code is configured'
              : 'Set up a backup PIN code for authentication'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={pinSettings?.hasPin ? handlePinChange : handlePinSetup}
        >
          <Text style={styles.buttonText}>
            {pinSettings?.hasPin ? 'Change' : 'Setup'}
          </Text>
        </TouchableOpacity>
      </View>

      {pinSettings?.hasPin && (
        <TouchableOpacity style={styles.dangerButton} onPress={handlePinRemove}>
          <Text style={styles.dangerButtonText}>Remove PIN</Text>
        </TouchableOpacity>
      )}

      {/* Security Level Indicator */}
      <View style={styles.securityLevel}>
        <Text style={styles.securityLevelTitle}>Security Level</Text>
        <Text style={styles.securityLevelText}>
          {biometricCapabilities
            ? getSecurityLevelDescription(biometricCapabilities)
            : 'Checking security capabilities...'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>
        {renderSecuritySection()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray600,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginTop: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: Colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  securityLevel: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  securityLevelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  securityLevelText: {
    fontSize: 14,
    color: Colors.gray700,
    lineHeight: 20,
  },
});
