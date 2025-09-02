import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '@/utils/colors';
import { SavePasswordOptions, SavedPassword } from '@/utils/types';
import {
  passwordStorage,
  generatePasswordId,
  getStorageLimit,
  isStorageLimitReached,
} from '@/utils/passwordStorage';

interface SavePasswordDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (savedPassword: SavedPassword) => void;
  passwordData: SavePasswordOptions;
}

export const SavePasswordDialog: React.FC<SavePasswordDialogProps> = ({
  visible,
  onClose,
  onSave,
  passwordData,
}) => {
  // Provide safe fallback for passwordData
  const safePasswordData = passwordData || {
    password: '',
    strength: { score: 0, label: 'very-weak' as const, feedback: [] }
  };
  const [siteName, setSiteName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    current: number;
    max: number;
    isPremium: boolean;
  } | null>(null);

  // Load storage information when dialog opens
  useEffect(() => {
    if (visible) {
      loadStorageInfo();
      // Pre-fill with any existing data
      setSiteName(safePasswordData.siteName || '');
      setAccountName(safePasswordData.accountName || '');
      setMemo(safePasswordData.memo || '');
    }
  }, [visible, safePasswordData]);

  const loadStorageInfo = async () => {
    try {
      const limit = await getStorageLimit();
      setStorageInfo({
        current: limit.currentCount,
        max: limit.maxPasswords,
        isPremium: limit.isPremium,
      });
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleSave = async () => {
    if (!siteName.trim()) {
      Alert.alert('Required Field', 'Please enter a site name');
      return;
    }

    // Check storage limit
    if (await isStorageLimitReached()) {
      Alert.alert(
        'Storage Limit Reached',
        `Free version allows ${storageInfo?.max || 10} passwords. Upgrade to premium for unlimited storage.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => {
              /* TODO: Handle premium upgrade */
            },
          },
        ]
      );
      return;
    }

    setSaving(true);

    try {
      const passwordId = await generatePasswordId();
      const savedPassword: SavedPassword = {
        id: passwordId,
        password: safePasswordData.password,
        siteName: siteName.trim(),
        accountName: accountName.trim() || undefined,
        memo: memo.trim() || undefined,
        strength: safePasswordData.strength,
        createdAt: new Date(),
        lastUsed: undefined,
        usageCount: 0,
      };

      await passwordStorage.save(savedPassword);
      onSave(savedPassword);

      // Reset form
      setSiteName('');
      setAccountName('');
      setMemo('');

      onClose();

      Alert.alert('Success', 'Password saved successfully!');
    } catch (error) {
      console.error('Error saving password:', error);
      Alert.alert('Error', 'Failed to save password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSiteName('');
    setAccountName('');
    setMemo('');
    onClose();
  };

  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0:
        return Colors.danger;
      case 1:
        return Colors.warning;
      case 2:
        return '#FFA500';
      case 3:
        return Colors.success;
      case 4:
        return Colors.success;
      default:
        return Colors.gray;
    }
  };

  const getStrengthLabel = (label: string): string => {
    const labels: Record<string, string> = {
      'very-weak': 'Very Weak',
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
    };
    // Safe property access to prevent object injection
    switch (label) {
      case 'very-weak': return labels['very-weak'];
      case 'weak': return labels['weak'];
      case 'fair': return labels['fair'];
      case 'good': return labels['good'];
      case 'strong': return labels['strong'];
      default: return label;
    }
  };

  // Early return if no valid password data
  if (!safePasswordData.password) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Save Password</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Password Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Password</Text>
            <View style={styles.passwordPreview}>
              <Text style={styles.passwordText} numberOfLines={1}>
                {safePasswordData.password}
              </Text>
              <View
                style={[
                  styles.strengthIndicator,
                  {
                    backgroundColor: getStrengthColor(
                      safePasswordData.strength.score
                    ),
                  },
                ]}
              />
            </View>
            <Text style={styles.strengthLabel}>
              Strength: {getStrengthLabel(safePasswordData.strength.label)}
            </Text>
          </View>

          {/* Storage Information */}
          {storageInfo && (
            <View style={styles.storageInfo}>
              <Text style={styles.storageText}>
                {storageInfo.current}/
                {storageInfo.isPremium ? '∞' : storageInfo.max} passwords saved
              </Text>
              {!storageInfo.isPremium &&
                storageInfo.current >= storageInfo.max - 2 && (
                  <Text style={styles.storageWarning}>
                    {storageInfo.max - storageInfo.current} slots remaining
                  </Text>
                )}
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>

            {/* Site Name - Required */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Site Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={siteName}
                onChangeText={setSiteName}
                placeholder="e.g., Gmail, Facebook, Company WiFi"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Account Name - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.textInput}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="e.g., your.email@gmail.com, username"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            {/* Memo - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.memoInput]}
                value={memo}
                onChangeText={setMemo}
                placeholder="Additional notes or reminders"
                placeholderTextColor={Colors.gray400}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Quick Save Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Save</Text>
            <View style={styles.quickSaveOptions}>
              <TouchableOpacity
                style={styles.quickSaveButton}
                onPress={() => setSiteName('Website')}
              >
                <Text style={styles.quickSaveText}>Website</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSaveButton}
                onPress={() => setSiteName('Email')}
              >
                <Text style={styles.quickSaveText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSaveButton}
                onPress={() => setSiteName('Social Media')}
              >
                <Text style={styles.quickSaveText}>Social</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSaveButton}
                onPress={() => setSiteName('Work')}
              >
                <Text style={styles.quickSaveText}>Work</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.gray600,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 12,
  },
  passwordPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  passwordText: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    color: Colors.gray900,
    marginRight: 12,
  },
  strengthIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  strengthLabel: {
    fontSize: 14,
    color: Colors.gray600,
    textAlign: 'center',
  },
  storageInfo: {
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  storageText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  storageWarning: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray700,
    marginBottom: 8,
  },
  required: {
    color: Colors.danger,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.gray900,
    backgroundColor: Colors.white,
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  quickSaveOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSaveButton: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  quickSaveText: {
    fontSize: 14,
    color: Colors.gray700,
    fontWeight: '500',
  },
});
