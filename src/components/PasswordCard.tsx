import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/utils/colors';
import { SavedPassword } from '@/utils/types';
import { markPasswordAsUsed } from '@/utils/passwordStorage';

interface PasswordCardProps {
  password: SavedPassword;
  onPress: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

export const PasswordCard: React.FC<PasswordCardProps> = ({
  password,
  onPress,
  onDelete,
  onEdit,
  showActions = true,
}) => {
  const [copying, setCopying] = useState(false);

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

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil((diffDays - 1) / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleCopyPassword = async () => {
    if (copying) return;

    setCopying(true);
    try {
      await Clipboard.setStringAsync(password.password);

      // Haptic feedback
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Mark password as used
      await markPasswordAsUsed(password.id);

      Alert.alert('Success', 'Password copied to clipboard');
    } catch (error) {
      console.error('Error copying password:', error);
      Alert.alert('Error', 'Failed to copy password');
    } finally {
      setCopying(false);
    }
  };

  const handleLongPress = () => {
    if (!showActions) return;

    const options = [
      { text: 'View Details', onPress },
      { text: 'Copy Password', onPress: handleCopyPassword },
    ];

    if (onEdit) {
      options.push({ text: 'Edit', onPress: onEdit });
    }

    options.push(
      { text: 'Delete', onPress: onDelete },
      { text: 'Cancel', onPress: () => {} }
    );

    Alert.alert(
      'Password Options',
      `Options for ${password.siteName}`,
      options
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Header with site name and actions */}
        <View style={styles.header}>
          <Text style={styles.siteName} numberOfLines={1}>
            {password.siteName}
          </Text>
          {showActions && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopyPassword}
                disabled={copying}
              >
                <Ionicons
                  name={copying ? 'hourglass-outline' : 'copy-outline'}
                  size={18}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={Colors.gray400}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account name if available */}
        {password.accountName && (
          <Text style={styles.accountName} numberOfLines={1}>
            {password.accountName}
          </Text>
        )}

        {/* Memo preview if available */}
        {password.memo && (
          <Text style={styles.memo} numberOfLines={2}>
            {password.memo}
          </Text>
        )}

        {/* Password preview (masked) */}
        <View style={styles.passwordPreview}>
          <Text style={styles.passwordText} numberOfLines={1}>
            {'•'.repeat(Math.min(password.password.length, 12))}
          </Text>
          <Text style={styles.passwordLength}>
            {password.password.length} chars
          </Text>
        </View>

        {/* Footer with metadata */}
        <View style={styles.footer}>
          <View style={styles.leftFooter}>
            <Text style={styles.dateText}>
              {formatDate(password.createdAt)}
            </Text>
            <View style={styles.strengthContainer}>
              <View
                style={[
                  styles.strengthDot,
                  {
                    backgroundColor: getStrengthColor(password.strength.score),
                  },
                ]}
              />
              <Text style={styles.strengthText}>
                {getStrengthLabel(password.strength.label)}
              </Text>
            </View>
          </View>

          <View style={styles.rightFooter}>
            {password.usageCount > 0 && (
              <View style={styles.usageContainer}>
                <Ionicons name="eye-outline" size={12} color={Colors.gray400} />
                <Text style={styles.usageText}>{password.usageCount}</Text>
              </View>
            )}
            {password.lastUsed && (
              <Text style={styles.lastUsedText}>
                Last used: {formatDate(password.lastUsed)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Visual indicator for tap action */}
      <View style={styles.tapIndicator}>
        <Ionicons
          name="chevron-forward-outline"
          size={16}
          color={Colors.gray300}
        />
      </View>
    </TouchableOpacity>
  );
};

// Compact version for list views
export const PasswordCardCompact: React.FC<PasswordCardProps> = ({
  password,
  onPress,
  onDelete,
  showActions = false,
}) => {
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

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1}d ago`;
    if (diffDays <= 30) return `${Math.ceil((diffDays - 1) / 7)}w ago`;
    return `${Math.ceil((diffDays - 1) / 30)}m ago`;
  };

  return (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.compactContent}>
        <View style={styles.compactLeft}>
          <Text style={styles.compactSiteName} numberOfLines={1}>
            {password.siteName}
          </Text>
          {password.accountName && (
            <Text style={styles.compactAccountName} numberOfLines={1}>
              {password.accountName}
            </Text>
          )}
          <Text style={styles.compactDate}>
            {formatDate(password.createdAt)}
          </Text>
        </View>

        <View style={styles.compactRight}>
          <View
            style={[
              styles.compactStrengthDot,
              { backgroundColor: getStrengthColor(password.strength.score) },
            ]}
          />
          {password.usageCount > 0 && (
            <Text style={styles.compactUsage}>{password.usageCount}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  siteName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
  },
  accountName: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 4,
  },
  memo: {
    fontSize: 14,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 8,
  },
  passwordPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    color: Colors.gray700,
    letterSpacing: 2,
  },
  passwordLength: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  leftFooter: {
    flex: 1,
    gap: 4,
  },
  rightFooter: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dateText: {
    fontSize: 12,
    color: Colors.gray400,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 12,
    color: Colors.gray600,
    fontWeight: '500',
  },
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  usageText: {
    fontSize: 12,
    color: Colors.gray400,
  },
  lastUsedText: {
    fontSize: 10,
    color: Colors.gray400,
  },
  tapIndicator: {
    paddingRight: 16,
    paddingLeft: 8,
  },

  // Compact styles
  compactCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  compactLeft: {
    flex: 1,
  },
  compactSiteName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 2,
  },
  compactAccountName: {
    fontSize: 13,
    color: Colors.gray600,
    marginBottom: 2,
  },
  compactDate: {
    fontSize: 11,
    color: Colors.gray400,
  },
  compactRight: {
    alignItems: 'center',
    gap: 4,
  },
  compactStrengthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  compactUsage: {
    fontSize: 11,
    color: Colors.gray500,
    fontWeight: '500',
  },
});
