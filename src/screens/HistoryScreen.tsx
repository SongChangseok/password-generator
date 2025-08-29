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
import { PasswordCard } from '@/components/PasswordCard';
import { searchPasswords, SearchResult } from '@/utils/searchUtils';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [allPasswords, setAllPasswords] = useState<SavedPassword[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<SavedPassword[]>(
    []
  );
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

      // Load all passwords
      const passwords = await passwordStorage.getAllPasswords();
      setAllPasswords(passwords);

      // Apply current sort and search
      const filtered = searchQuery
        ? searchPasswords(passwords, searchQuery).results
        : passwords;

      setFilteredPasswords(passwordStorage.sortPasswords(filtered, sortOrder));

      // Load storage stats
      const stats = await getStorageStats();
      const isPremium = await getPremiumStatus();
      setStorageStats({
        totalPasswords: passwords.length,
        isPremium,
        limit: isPremium ? 1000 : 10,
      });
    } catch (error) {
      console.error('Failed to load passwords:', error);
      Alert.alert('Error', 'Failed to load password history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredPasswords(
        passwordStorage.sortPasswords(allPasswords, sortOrder)
      );
      setSearchResult(null);
      return;
    }

    const result = searchPasswords(allPasswords, query);
    setSearchResult(result);
    setFilteredPasswords(
      passwordStorage.sortPasswords(result.results, sortOrder)
    );
  };

  const handlePasswordPress = (password: SavedPassword) => {
    (navigation as any).navigate('PasswordDetail', {
      passwordId: password.id,
    });
  };

  const handlePasswordDelete = async (passwordId: string) => {
    Alert.alert(
      'Delete Password',
      'Are you sure you want to delete this password?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await passwordStorage.deletePassword(passwordId);
              await loadPasswords(); // Refresh list
            } catch (error) {
              console.error('Failed to delete password:', error);
              Alert.alert('Error', 'Failed to delete password');
            }
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="key-outline" size={64} color={Colors.gray400} />
      <Text style={styles.emptyTitle}>No Saved Passwords</Text>
      <Text style={styles.emptySubtitle}>
        Generate and save passwords to see them here
      </Text>
    </View>
  );

  const renderPasswordItem = ({ item }: { item: SavedPassword }) => (
    <PasswordCard
      password={item}
      onPress={() => handlePasswordPress(item)}
      onDelete={() => handlePasswordDelete(item.id)}
      style={styles.passwordCard}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Password History</Text>
      {storageStats && (
        <Text style={styles.statsText}>
          {storageStats.totalPasswords}/{storageStats.limit} passwords
          {!storageStats.isPremium && storageStats.totalPasswords >= 5 && (
            <Text style={styles.limitText}> (Upgrade for unlimited)</Text>
          )}
        </Text>
      )}

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search passwords..."
        style={styles.searchBar}
      />
    </View>
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
      {renderHeader()}

      <FlatList
        data={filteredPasswords}
        renderItem={renderPasswordItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadPasswords} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  limitText: {
    color: Colors.warning,
    fontWeight: '600',
  },
  searchBar: {
    marginBottom: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  passwordCard: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
