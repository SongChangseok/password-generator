import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Colors } from '../utils/colors';
import { getPasswordDisplayText } from '../utils/passwordFormatter';

interface PasswordDisplayProps {
  password: string;
  readableFormat?: boolean;
  onCopy?: () => void;
  style?: any;
}

export const PasswordDisplay: React.FC<PasswordDisplayProps> = ({
  password,
  readableFormat = false,
  onCopy,
  style,
}) => {
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(password);

      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Show success message
      Alert.alert('Copied!', 'Password copied to clipboard', [{ text: 'OK' }]);

      // Call optional callback
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy password:', error);
      Alert.alert('Error', 'Failed to copy password to clipboard');
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Generated Password</Text>
      <TouchableOpacity
        style={styles.passwordContainer}
        onPress={handleCopy}
        activeOpacity={0.7}
      >
        <Text style={styles.password} selectable>
          {password ? getPasswordDisplayText(password, readableFormat) : 'Tap "Generate" to create a password'}
        </Text>
        <View style={styles.copyHint}>
          <Text style={styles.copyHintText}>Tap to copy</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  passwordContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: Colors.shadowLight,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  password: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 1,
  },
  copyHint: {
    marginTop: 8,
    alignItems: 'center',
  },
  copyHintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
