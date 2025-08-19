import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/utils/colors';
import { SecureKeypad } from '@/components/SecureKeypad';
import {
  setupPin,
  changePin,
  removePin,
  isValidPinFormat,
} from '@/utils/pinAuth';

interface PinSetupScreenProps {
  route?: {
    params?: {
      mode: 'setup' | 'change' | 'remove';
      currentPin?: string;
    };
  };
}

export default function PinSetupScreen({ route }: PinSetupScreenProps) {
  const navigation = useNavigation();
  const mode = route?.params?.mode || 'setup';
  const currentPin = route?.params?.currentPin;

  const [step, setStep] = useState<'current' | 'new' | 'confirm'>(() => {
    if (mode === 'setup') return 'new';
    if (mode === 'remove') return 'current';
    return 'current'; // change mode
  });

  const [enteredCurrentPin, setEnteredCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const getTitle = () => {
    switch (mode) {
      case 'setup':
        return step === 'new' ? 'Set up PIN' : 'Confirm PIN';
      case 'change':
        if (step === 'current') return 'Enter current PIN';
        if (step === 'new') return 'Enter new PIN';
        return 'Confirm new PIN';
      case 'remove':
        return 'Enter PIN to remove';
      default:
        return 'PIN Setup';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'setup':
        return step === 'new'
          ? 'Create a 4-6 digit PIN code for app security'
          : 'Re-enter your PIN to confirm';
      case 'change':
        if (step === 'current') return 'Enter your current PIN to continue';
        if (step === 'new') return 'Enter your new 4-6 digit PIN';
        return 'Re-enter your new PIN to confirm';
      case 'remove':
        return 'Enter your current PIN to remove PIN authentication';
      default:
        return '';
    }
  };

  const handlePinChange = useCallback(
    (pin: string) => {
      if (step === 'current') {
        setEnteredCurrentPin(pin);
      } else if (step === 'new') {
        setNewPin(pin);
      } else if (step === 'confirm') {
        setConfirmPin(pin);
      }
    },
    [step]
  );

  const handlePinComplete = useCallback(
    async (pin: string) => {
      if (!isValidPinFormat(pin)) {
        Alert.alert('Invalid PIN', 'PIN must be 4-6 digits');
        return;
      }

      setLoading(true);

      try {
        if (step === 'current') {
          if (mode === 'remove') {
            // Remove PIN
            await removePin(pin);
            Alert.alert('PIN Removed', 'PIN authentication has been disabled', [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]);
          } else if (mode === 'change') {
            // Verify current PIN and move to new PIN step
            setEnteredCurrentPin(pin);
            setStep('new');
          }
        } else if (step === 'new') {
          if (mode === 'setup') {
            setNewPin(pin);
            setStep('confirm');
          } else if (mode === 'change') {
            setNewPin(pin);
            setStep('confirm');
          }
        } else if (step === 'confirm') {
          if (pin !== newPin) {
            Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
            setStep('new');
            setNewPin('');
            setConfirmPin('');
            return;
          }

          if (mode === 'setup') {
            await setupPin(pin);
            Alert.alert(
              'PIN Set Up',
              'Your PIN has been successfully configured',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          } else if (mode === 'change') {
            await changePin(enteredCurrentPin, pin);
            Alert.alert(
              'PIN Changed',
              'Your PIN has been successfully updated',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error('PIN operation error:', error);

        let errorMessage = 'An error occurred. Please try again.';
        if (error instanceof Error) {
          if (error.message.includes('incorrect')) {
            errorMessage = 'Current PIN is incorrect';
          } else if (error.message.includes('format')) {
            errorMessage = 'PIN must be 4-6 digits';
          }
        }

        Alert.alert('Error', errorMessage);

        // Reset to appropriate step on error
        if (step === 'current') {
          setEnteredCurrentPin('');
        } else if (step === 'confirm') {
          setStep('new');
          setNewPin('');
          setConfirmPin('');
        }
      } finally {
        setLoading(false);
      }
    },
    [step, mode, newPin, enteredCurrentPin, navigation]
  );

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.description}>{getDescription()}</Text>
        </View>

        <View style={styles.keypadSection}>
          <SecureKeypad
            onPinChange={handlePinChange}
            onPinComplete={handlePinComplete}
            disabled={loading}
            maxLength={6}
            minLength={4}
          />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  keypadSection: {
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: Colors.white + 'E6',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray700,
    fontWeight: '500',
  },
});
