import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GeneratorScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password Generator</Text>
      <Text style={styles.subtitle}>Coming Soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E3A8A',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
});

export default GeneratorScreen;