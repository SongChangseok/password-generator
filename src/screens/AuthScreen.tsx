import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Colors } from '@/utils/colors';
import { SecureKeypad } from '@/components/SecureKeypad';
import {
  authenticateUser,
  checkBiometricCapabilities,
  getAuthenticationTypeName,
  isBiometricAuthEnabled,
} from '@/utils/biometricAuth';
import {
  verifyPin,
  isPinEnabled,
  isPinConfigured,
  type PinValidationResult,
} from '@/utils/pinAuth';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [authMethod, setAuthMethod] = useState<'biometric' | 'pin' | 'none'>(
    'none'
  );
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsPending, setAttemptsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);

      // Check if any authentication is required
      const [biometricEnabled, pinEnabled] = await Promise.all([
        isBiometricAuthEnabled(),
        isPinEnabled(),
      ]);

      if (!biometricEnabled && !pinEnabled) {
        // No authentication required
        onAuthenticated();
        return;
      }

      // Check biometric capabilities
      const capabilities = await checkBiometricCapabilities();
      const authTypeName = getAuthenticationTypeName(
        capabilities.supportedTypes
      );
      setBiometricType(authTypeName);

      // Determine primary auth method
      if (
        biometricEnabled &&
        capabilities.hasHardware &&
        capabilities.isEnrolled
      ) {
        setAuthMethod('biometric');
        // Auto-trigger biometric authentication
        await attemptBiometricAuth();
      } else if (pinEnabled) {
        setAuthMethod('pin');
      } else {
        // No valid auth method available
        onAuthenticated();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthMethod('pin'); // Fallback to PIN
    } finally {
      setLoading(false);
    }
  }, [onAuthenticated]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const attemptBiometricAuth = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const result = await authenticateUser();

      if (result.success) {
        onAuthenticated();
      } else {
        // Biometric failed, check if PIN is available as fallback
        const pinConfigured = await isPinConfigured();
        if (pinConfigured) {
          setAuthMethod('pin');
          setErrorMessage('Use PIN to unlock');
        } else {
          setErrorMessage(result.error || 'Authentication failed');
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      const pinConfigured = await isPinConfigured();
      if (pinConfigured) {
        setAuthMethod('pin');
        setErrorMessage('Use PIN to unlock');
      } else {
        setErrorMessage('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = useCallback((newPin: string) => {
    setPin(newPin);
    setErrorMessage(null);
  }, []);

  const handlePinComplete = useCallback(
    async (completedPin: string) => {
      try {
        setLoading(true);
        setAttemptsPending(true);

        const result: PinValidationResult = await verifyPin(completedPin);

        if (result.isValid) {
          onAuthenticated();
        } else {
          setErrorMessage(result.error || 'Incorrect PIN');
          setPin(''); // Clear PIN input

          if (
            result.attemptsRemaining !== undefined &&
            result.attemptsRemaining <= 0
          ) {
            Alert.alert(
              'Account Locked',
              'Too many failed attempts. Please try again later.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Could add app exit logic here
                  },
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error('PIN verification error:', error);
        setErrorMessage('Authentication failed');
        setPin('');
      } finally {
        setLoading(false);
        setAttemptsPending(false);
      }
    },
    [onAuthenticated]
  );

  const handleRetryBiometric = () => {
    setErrorMessage(null);
    attemptBiometricAuth();
  };

  const renderBiometricAuth = () => (
    <View style={styles.biometricContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.biometricIcon}>
          <Text style={styles.biometricIconText}>🔒</Text>
        </View>
      </View>

      <Text style={styles.biometricTitle}>Unlock with {biometricType}</Text>

      <Text style={styles.biometricDescription}>
        Use {biometricType} to access Password Generator
      </Text>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <TouchableOpacity
        style={styles.biometricButton}
        onPress={handleRetryBiometric}
        disabled={loading}
      >
        <Text style={styles.biometricButtonText}>
          {loading ? 'Authenticating...' : `Use ${biometricType}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fallbackButton}
        onPress={() => setAuthMethod('pin')}
        disabled={loading}
      >
        <Text style={styles.fallbackButtonText}>Use PIN Code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPinAuth = () => (
    <View style={styles.pinContainer}>
      <Text style={styles.pinTitle}>Enter PIN</Text>
      <Text style={styles.pinDescription}>
        Enter your PIN code to access Password Generator
      </Text>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <SecureKeypad
        onPinChange={handlePinChange}
        onPinComplete={handlePinComplete}
        disabled={loading || attemptsPending}
        maxLength={6}
        minLength={4}
      />

      {authMethod === 'pin' && (
        <TouchableOpacity
          style={styles.biometricFallbackButton}
          onPress={() => setAuthMethod('biometric')}
          disabled={loading}
        >
          <Text style={styles.fallbackButtonText}>Use {biometricType}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && authMethod === 'none') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing security...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Password Generator</Text>
      </View>

      <View style={styles.content}>
        {authMethod === 'biometric' ? renderBiometricAuth() : renderPinAuth()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
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
  biometricContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  biometricIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricIconText: {
    fontSize: 32,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
  biometricDescription: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  biometricButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
  },
  biometricButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fallbackButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
  pinDescription: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: Colors.warning,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  biometricFallbackButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
