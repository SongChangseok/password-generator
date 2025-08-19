import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/utils/colors';

interface SecureKeypadProps {
  onPinChange: (pin: string) => void;
  onPinComplete: (pin: string) => void;
  maxLength?: number;
  minLength?: number;
  showPin?: boolean;
  disabled?: boolean;
}

export const SecureKeypad: React.FC<SecureKeypadProps> = ({
  onPinChange,
  onPinComplete,
  maxLength = 6,
  minLength = 4,
  showPin = false,
  disabled = false,
}) => {
  const [pin, setPin] = useState('');

  const handleNumberPress = useCallback(
    async (number: string) => {
      if (disabled || pin.length >= maxLength) return;

      // Haptic feedback
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Vibration.vibrate(50);
      }

      const newPin = pin + number;
      setPin(newPin);
      onPinChange(newPin);

      // Auto-complete when reaching minimum length
      if (newPin.length >= minLength && newPin.length <= maxLength) {
        onPinComplete(newPin);
      }
    },
    [pin, maxLength, minLength, onPinChange, onPinComplete, disabled]
  );

  const handleBackspace = useCallback(async () => {
    if (disabled || pin.length === 0) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(30);
    }

    const newPin = pin.slice(0, -1);
    setPin(newPin);
    onPinChange(newPin);
  }, [pin, onPinChange, disabled]);

  const handleClear = useCallback(async () => {
    if (disabled) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(100);
    }

    setPin('');
    onPinChange('');
  }, [onPinChange, disabled]);

  const renderPinIndicator = () => {
    const indicators = [];
    for (let i = 0; i < maxLength; i++) {
      const isFilled = i < pin.length;
      indicators.push(
        <View
          key={i}
          style={[styles.pinIndicator, isFilled && styles.pinIndicatorFilled]}
        >
          {showPin && isFilled && <Text style={styles.pinDigit}>{pin[i]}</Text>}
        </View>
      );
    }
    return <View style={styles.pinIndicatorContainer}>{indicators}</View>;
  };

  const renderKeypadButton = (
    value: string,
    onPress: () => void,
    style?: any
  ) => (
    <TouchableOpacity
      style={[
        styles.keypadButton,
        disabled && styles.keypadButtonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.keypadButtonText,
          disabled && styles.keypadButtonTextDisabled,
        ]}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderPinIndicator()}

      <View style={styles.keypadContainer}>
        {/* Row 1 */}
        <View style={styles.keypadRow}>
          {renderKeypadButton('1', () => handleNumberPress('1'))}
          {renderKeypadButton('2', () => handleNumberPress('2'))}
          {renderKeypadButton('3', () => handleNumberPress('3'))}
        </View>

        {/* Row 2 */}
        <View style={styles.keypadRow}>
          {renderKeypadButton('4', () => handleNumberPress('4'))}
          {renderKeypadButton('5', () => handleNumberPress('5'))}
          {renderKeypadButton('6', () => handleNumberPress('6'))}
        </View>

        {/* Row 3 */}
        <View style={styles.keypadRow}>
          {renderKeypadButton('7', () => handleNumberPress('7'))}
          {renderKeypadButton('8', () => handleNumberPress('8'))}
          {renderKeypadButton('9', () => handleNumberPress('9'))}
        </View>

        {/* Row 4 */}
        <View style={styles.keypadRow}>
          {renderKeypadButton('Clear', handleClear, styles.actionButton)}
          {renderKeypadButton('0', () => handleNumberPress('0'))}
          {renderKeypadButton('⌫', handleBackspace, styles.actionButton)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pinIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  pinIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.gray300,
    backgroundColor: 'transparent',
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinIndicatorFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pinDigit: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.white,
  },
  keypadContainer: {
    width: 300,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keypadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  keypadButtonDisabled: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.gray900,
  },
  keypadButtonTextDisabled: {
    color: Colors.gray400,
  },
  actionButton: {
    backgroundColor: Colors.gray200,
  },
});
