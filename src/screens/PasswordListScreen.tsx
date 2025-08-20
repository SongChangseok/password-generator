import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';
import { SavedPassword, SortOrder } from '@/utils/types';
import { passwordStorage, getStorageStats } from '@/utils/passwordStorage';
import { getPremiumStatus } from '@/utils/premiumFeatures';
import { SearchBar } from '@/components/SearchBar';
import { searchPasswords, SearchResult } from '@/utils/searchUtils';

interface PasswordListScreenProps {
  // Navigation props will be typed properly with navigation typing
}

export default function PasswordListScreen() {
  const navigation = useNavigation();
  const [allPasswords, setAllPasswords] = useState<SavedPassword[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<SavedPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NEWEST_FIRST);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [storageStats, setStorageStats] = useState<{
    totalPasswords: number;
    isPremium: boolean;
    limit: number;
  } | null>(null);

  // Load passwords when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadPasswords();
    }, [])
  );

  const loadPasswords = async () => {
    try {
      setLoading(true);
      const [passwordList, stats, premiumStatus] = await Promise.all([
        passwordStorage.getAll(),
        getStorageStats(),
        getPremiumStatus(),
      ]);

      const sortedPasswords = sortPasswords(passwordList, sortOrder);
      setAllPasswords(sortedPasswords);
      
      // Apply search if there's a query
      if (searchQuery.trim()) {
        const result = searchPasswords(sortedPasswords, searchQuery);
        setFilteredPasswords(result.passwords);
        setSearchResult(result);
      } else {
        setFilteredPasswords(sortedPasswords);
        setSearchResult(null);
      }

      setStorageStats({
        totalPasswords: stats.totalPasswords,
        isPremium: stats.isPremium,
        limit: stats.limit,
      });
    } catch (error) {
      console.error('Error loading passwords:', error);
      Alert.alert('Error', 'Failed to load saved passwords');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPasswords();
    setRefreshing(false);
  };

  const handlePasswordPress = (password: SavedPassword) => {
    // Navigate to password detail screen
    (navigation as any).navigate('PasswordDetail', { passwordId: password.id });
  };

  const handleDeletePassword = (passwordId: string, siteName: string) => {
    Alert.alert(
      'Delete Password',
      `Are you sure you want to delete the password for "${siteName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePassword(passwordId),
        },
      ]
    );
  };

  const deletePassword = async (passwordId: string) => {
    try {
      await passwordStorage.delete(passwordId);
      await loadPasswords();
      Alert.alert('Success', 'Password deleted successfully');
    } catch (error) {
      console.error('Error deleting password:', error);
      Alert.alert('Error', 'Failed to delete password');
    }
  };

  const handleSortPress = () => {
    const sortOptions = [
      { title: 'Newest First', value: SortOrder.NEWEST_FIRST },
      { title: 'Oldest First', value: SortOrder.OLDEST_FIRST },
      { title: 'Name A-Z', value: SortOrder.NAME_ASC },
      { title: 'Name Z-A', value: SortOrder.NAME_DESC },
      { title: 'Strongest First', value: SortOrder.STRENGTH_DESC },
      { title: 'Most Used', value: SortOrder.MOST_USED },
    ];

    const options = sortOptions.map(option => ({
      text: option.title,
      onPress: () => handleSortChange(option.value),
    }));
    options.push({ text: 'Cancel', onPress: async () => {} });

    Alert.alert('Sort Passwords', 'Choose sorting order:', options as any);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // No search query - show all passwords
      setFilteredPasswords(allPasswords);
      setSearchResult(null);
      return;
    }
    
    // Perform search with performance measurement
    const result = searchPasswords(allPasswords, query, {
      includeAccountName: true,
      includeMemo: true,
      caseSensitive: false,
      exactMatch: false,
    });
    
    setFilteredPasswords(result.passwords);
    setSearchResult(result);
    
    // Log search performance for debugging
    if (__DEV__) {
      console.log(`Search completed in ${result.searchTime.toFixed(2)}ms for "${query}"`);
      console.log(`Found ${result.matchCount} matches out of ${allPasswords.length} total passwords`);
    }
  }, [allPasswords]);

  const handleSortChange = async (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
    
    // Re-sort all passwords
    const sortedAllPasswords = sortPasswords([...allPasswords], newSortOrder);
    setAllPasswords(sortedAllPasswords);
    
    // Apply search to newly sorted data
    if (searchQuery.trim()) {
      const result = searchPasswords(sortedAllPasswords, searchQuery);
      setFilteredPasswords(result.passwords);
      setSearchResult(result);
    } else {
      setFilteredPasswords(sortedAllPasswords);
    }
  };

  const sortPasswords = (passwordList: SavedPassword[], order: SortOrder): SavedPassword[] => {
    const sorted = [...passwordList];
    
    switch (order) {
      case SortOrder.NEWEST_FIRST:
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case SortOrder.OLDEST_FIRST:
        return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      case SortOrder.NAME_ASC:
        return sorted.sort((a, b) => a.siteName.toLowerCase().localeCompare(b.siteName.toLowerCase()));
      case SortOrder.NAME_DESC:
        return sorted.sort((a, b) => b.siteName.toLowerCase().localeCompare(a.siteName.toLowerCase()));
      case SortOrder.STRENGTH_DESC:
        return sorted.sort((a, b) => b.strength.score - a.strength.score);
      case SortOrder.MOST_USED:
        return sorted.sort((a, b) => b.usageCount - a.usageCount);
      default:
        return sorted;
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Passwords',
      'Are you sure you want to delete ALL saved passwords? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: deleteAllPasswords,
        },
      ]
    );
  };

  const deleteAllPasswords = async () => {
    try {
      await passwordStorage.deleteAll();
      await loadPasswords();
      Alert.alert('Success', 'All passwords deleted successfully');
    } catch (error) {
      console.error('Error deleting all passwords:', error);
      Alert.alert('Error', 'Failed to delete passwords');
    }
  };

  const getSortOrderLabel = (order: SortOrder): string => {
    switch (order) {
      case SortOrder.NEWEST_FIRST: return 'Newest First';
      case SortOrder.OLDEST_FIRST: return 'Oldest First';
      case SortOrder.NAME_ASC: return 'Name A-Z';
      case SortOrder.NAME_DESC: return 'Name Z-A';
      case SortOrder.STRENGTH_DESC: return 'Strongest First';
      case SortOrder.MOST_USED: return 'Most Used';
      default: return 'Sort';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="key-outline" size={64} color={Colors.gray400} />
      <Text style={styles.emptyStateTitle}>No Saved Passwords</Text>
      <Text style={styles.emptyStateText}>
        Start generating and saving passwords to see them here
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => (navigation as any).navigate('Generator')}
      >
        <Text style={styles.emptyStateButtonText}>Generate Password</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoResultsState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={Colors.gray400} />
      <Text style={styles.emptyStateTitle}>No Results Found</Text>
      <Text style={styles.emptyStateText}>
        No passwords match "{searchQuery}".{'\n'}
        Try different keywords or check spelling.
      </Text>
      <TouchableOpacity
        style={[styles.emptyStateButton, styles.clearSearchButton]}
        onPress={() => handleSearch('')}
      >
        <Text style={styles.emptyStateButtonText}>Clear Search</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPasswordItem = ({ item }: { item: SavedPassword }) => (
    <PasswordListItem
      password={item}
      onPress={() => handlePasswordPress(item)}
      onDelete={() => handleDeletePassword(item.id, item.siteName)}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading passwords...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Saved Passwords</Text>
        <View style={styles.headerActions}>
          {allPasswords.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSortPress}
              >
                <Ionicons name="funnel-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDeleteAll}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Search Bar */}
      {allPasswords.length > 0 && (
        <SearchBar
          onSearch={handleSearch}
          placeholder={`Search ${allPasswords.length} password${allPasswords.length !== 1 ? 's' : ''}...`}
          debounceMs={300}
        />
      )}

      {/* Storage Info */}
      {storageStats && (
        <View style={styles.storageInfo}>
          <View style={styles.storageLeft}>
            <Text style={styles.storageText}>
              {storageStats.totalPasswords}/{storageStats.isPremium ? '∞' : storageStats.limit} passwords
            </Text>
            {searchResult && (
              <Text style={styles.searchResultText}>
                {searchResult.matchCount} result{searchResult.matchCount !== 1 ? 's' : ''} 
                {searchResult.searchTime < 100 ? (
                  <Text style={styles.performanceGood}> ({searchResult.searchTime.toFixed(1)}ms)</Text>
                ) : (
                  <Text style={styles.performanceSlow}> ({searchResult.searchTime.toFixed(1)}ms)</Text>
                )}
              </Text>
            )}
          </View>
          {!storageStats.isPremium && storageStats.totalPasswords >= storageStats.limit - 2 && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {/* TODO: Navigate to premium upgrade */}}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sort indicator */}
      {filteredPasswords.length > 0 && (
        <View style={styles.sortInfo}>
          <Text style={styles.sortText}>
            Sorted by: {getSortOrderLabel(sortOrder)}
          </Text>
          {searchQuery.trim() && (
            <Text style={styles.searchActiveText}>
              • Searching: "{searchQuery}"
            </Text>
          )}
        </View>
      )}

      {/* Password List */}
      <FlatList
        data={filteredPasswords}
        renderItem={renderPasswordItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredPasswords.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={searchQuery.trim() ? renderNoResultsState : renderEmptyState}
      />
    </SafeAreaView>
  );
}

// Password List Item Component (will be moved to separate file)
const PasswordListItem: React.FC<{
  password: SavedPassword;
  onPress: () => void;
  onDelete: () => void;
}> = ({ password, onPress, onDelete }) => {
  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0: return Colors.danger;
      case 1: return Colors.warning;
      case 2: return '#FFA500';
      case 3: return Colors.success;
      case 4: return Colors.success;
      default: return Colors.gray;
    }
  };

  const getStrengthLabel = (label: string): string => {
    const labels: Record<string, string> = {
      'very-weak': 'Very Weak',
      'weak': 'Weak',
      'fair': 'Fair', 
      'good': 'Good',
      'strong': 'Strong',
    };
    return labels[label] || label;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.passwordItem} onPress={onPress}>
      <View style={styles.passwordItemContent}>
        {/* Site name and account */}
        <View style={styles.passwordItemHeader}>
          <Text style={styles.siteName} numberOfLines={1}>
            {password.siteName}
          </Text>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Account name */}
        {password.accountName && (
          <Text style={styles.accountName} numberOfLines={1}>
            {password.accountName}
          </Text>
        )}

        {/* Memo preview */}
        {password.memo && (
          <Text style={styles.memo} numberOfLines={2}>
            {password.memo}
          </Text>
        )}

        {/* Footer info */}
        <View style={styles.passwordItemFooter}>
          <Text style={styles.dateText}>
            {formatDate(password.createdAt)}
          </Text>
          <View style={styles.strengthContainer}>
            <View 
              style={[
                styles.strengthDot,
                { backgroundColor: getStrengthColor(password.strength.score) }
              ]}
            />
            <Text style={styles.strengthText}>
              {getStrengthLabel(password.strength.label)}
            </Text>
          </View>
          {password.usageCount > 0 && (
            <Text style={styles.usageText}>
              Used {password.usageCount} time{password.usageCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.gray900,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  storageInfo: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageLeft: {
    flex: 1,
  },
  storageText: {
    fontSize: 14,
    color: Colors.gray600,
    fontWeight: '500',
  },
  searchResultText: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
  performanceGood: {
    color: Colors.success,
    fontWeight: '600',
  },
  performanceSlow: {
    color: Colors.warning,
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upgradeButtonText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  sortInfo: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sortText: {
    fontSize: 12,
    color: Colors.gray500,
  },
  searchActiveText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  clearSearchButton: {
    backgroundColor: Colors.gray600,
  },
  passwordItem: {
    marginHorizontal: 20,
    marginVertical: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordItemContent: {
    padding: 16,
  },
  passwordItemHeader: {
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
  deleteButton: {
    padding: 4,
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
  passwordItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  usageText: {
    fontSize: 12,
    color: Colors.gray400,
    marginLeft: 'auto',
  },
});