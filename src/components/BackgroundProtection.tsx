import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Colors } from '@/utils/colors';

interface BackgroundProtectionProps {
  enabled: boolean;
  children: React.ReactNode;
}

export const BackgroundProtection: React.FC<BackgroundProtectionProps> = ({
  enabled,
  children,
}) => {
  const [isAppInBackground, setIsAppInBackground] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsAppInBackground(true);
      } else if (nextAppState === 'active') {
        setIsAppInBackground(false);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [enabled]);

  if (!enabled || !isAppInBackground) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.protectionContent}>
          <View style={styles.iconContainer}>
            <View style={styles.lockIcon}>
              <View style={styles.lockBody} />
              <View style={styles.lockShackle} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.hiddenContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  protectionContent: {
    alignItems: 'center',
  },
  iconContainer: {
    padding: 40,
  },
  lockIcon: {
    width: 60,
    height: 60,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  lockBody: {
    width: 40,
    height: 30,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 28,
    borderWidth: 4,
    borderColor: Colors.white,
    borderRadius: 14,
    borderBottomWidth: 0,
  },
  hiddenContent: {
    flex: 1,
    opacity: 0,
  },
});
