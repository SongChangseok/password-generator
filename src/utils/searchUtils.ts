import { SavedPassword } from './types';

export interface SearchResult {
  passwords: SavedPassword[];
  matchCount: number;
  searchTime: number;
}

export interface SearchOptions {
  includeAccountName?: boolean;
  includeMemo?: boolean;
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

/**
 * Search passwords with performance optimization
 * Target: <100ms search response time
 */
export const searchPasswords = (
  passwords: SavedPassword[],
  query: string,
  options: SearchOptions = {}
): SearchResult => {
  const startTime = performance.now();

  // Empty query returns all passwords
  if (!query.trim()) {
    const endTime = performance.now();
    return {
      passwords,
      matchCount: passwords.length,
      searchTime: endTime - startTime,
    };
  }

  const {
    includeAccountName = true,
    includeMemo = true,
    caseSensitive = false,
    exactMatch = false,
  } = options;

  const searchQuery = caseSensitive ? query.trim() : query.trim().toLowerCase();

  const filteredPasswords = passwords.filter((password) => {
    // Search in site name (primary field)
    const siteName = caseSensitive
      ? password.siteName
      : password.siteName.toLowerCase();
    const siteNameMatch = exactMatch
      ? siteName === searchQuery
      : siteName.includes(searchQuery);

    if (siteNameMatch) return true;

    // Search in account name if enabled
    if (includeAccountName && password.accountName) {
      const accountName = caseSensitive
        ? password.accountName
        : password.accountName.toLowerCase();
      const accountNameMatch = exactMatch
        ? accountName === searchQuery
        : accountName.includes(searchQuery);

      if (accountNameMatch) return true;
    }

    // Search in memo if enabled
    if (includeMemo && password.memo) {
      const memo = caseSensitive ? password.memo : password.memo.toLowerCase();
      const memoMatch = exactMatch
        ? memo === searchQuery
        : memo.includes(searchQuery);

      if (memoMatch) return true;
    }

    return false;
  });

  const endTime = performance.now();

  return {
    passwords: filteredPasswords,
    matchCount: filteredPasswords.length,
    searchTime: endTime - startTime,
  };
};

/**
 * Advanced search with multiple criteria
 */
export const advancedSearch = (
  passwords: SavedPassword[],
  criteria: {
    query?: string;
    minStrength?: number;
    maxStrength?: number;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
    hasAccount?: boolean;
    hasMemo?: boolean;
    minUsageCount?: number;
  }
): SearchResult => {
  const startTime = performance.now();

  let filteredPasswords = [...passwords];

  // Text search
  if (criteria.query?.trim()) {
    const textSearchResult = searchPasswords(filteredPasswords, criteria.query);
    filteredPasswords = textSearchResult.passwords;
  }

  // Strength filter
  if (criteria.minStrength !== undefined) {
    filteredPasswords = filteredPasswords.filter(
      (p) => p.strength.score >= criteria.minStrength!
    );
  }

  if (criteria.maxStrength !== undefined) {
    filteredPasswords = filteredPasswords.filter(
      (p) => p.strength.score <= criteria.maxStrength!
    );
  }

  // Date range filter
  if (criteria.dateRange) {
    filteredPasswords = filteredPasswords.filter((p) => {
      const createdAt = p.createdAt.getTime();
      const startTime = criteria.dateRange!.startDate.getTime();
      const endTime = criteria.dateRange!.endDate.getTime();
      return createdAt >= startTime && createdAt <= endTime;
    });
  }

  // Account name filter
  if (criteria.hasAccount !== undefined) {
    if (criteria.hasAccount) {
      filteredPasswords = filteredPasswords.filter((p) =>
        p.accountName?.trim()
      );
    } else {
      filteredPasswords = filteredPasswords.filter(
        (p) => !p.accountName?.trim()
      );
    }
  }

  // Memo filter
  if (criteria.hasMemo !== undefined) {
    if (criteria.hasMemo) {
      filteredPasswords = filteredPasswords.filter((p) => p.memo?.trim());
    } else {
      filteredPasswords = filteredPasswords.filter((p) => !p.memo?.trim());
    }
  }

  // Usage count filter
  if (criteria.minUsageCount !== undefined) {
    filteredPasswords = filteredPasswords.filter(
      (p) => p.usageCount >= criteria.minUsageCount!
    );
  }

  const endTime = performance.now();

  return {
    passwords: filteredPasswords,
    matchCount: filteredPasswords.length,
    searchTime: endTime - startTime,
  };
};

/**
 * Highlight search matches in text
 */
export const highlightSearchMatches = (
  text: string,
  query: string,
  caseSensitive: boolean = false
): string => {
  if (!query.trim()) return text;

  const searchQuery = caseSensitive ? query.trim() : query.trim().toLowerCase();
  const searchText = caseSensitive ? text : text.toLowerCase();

  // Simple highlighting - in a real app you might want to use a more sophisticated approach
  const regex = new RegExp(
    `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    caseSensitive ? 'g' : 'gi'
  );
  return text.replace(regex, '**$1**');
};

/**
 * Get search suggestions based on existing passwords
 */
export const getSearchSuggestions = (
  passwords: SavedPassword[],
  query: string,
  maxSuggestions: number = 5
): string[] => {
  if (!query.trim() || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();

  // Extract suggestions from site names
  passwords.forEach((password) => {
    const siteName = password.siteName.toLowerCase();
    if (siteName.includes(lowerQuery) && !siteName.startsWith(lowerQuery)) {
      suggestions.add(password.siteName);
    }

    // Extract suggestions from account names
    if (password.accountName) {
      const accountName = password.accountName.toLowerCase();
      if (
        accountName.includes(lowerQuery) &&
        !accountName.startsWith(lowerQuery)
      ) {
        suggestions.add(password.accountName);
      }
    }
  });

  return Array.from(suggestions)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, maxSuggestions);
};

/**
 * Performance measurement for search operations
 */
export const measureSearchPerformance = async (
  searchFunction: () => SearchResult,
  iterations: number = 10
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
}> => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = searchFunction();
    times.push(result.searchTime);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    averageTime,
    minTime,
    maxTime,
    totalTime,
  };
};
