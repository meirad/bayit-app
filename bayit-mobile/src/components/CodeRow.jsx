import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import colors from '../theme/colors';

export default function CodeRow({ label, value, onCopied }) {
  const copyValue = async () => {
    await Clipboard.setStringAsync(String(value || ''));
    if (onCopied) {
      onCopied();
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Pressable style={styles.copyButton} onPress={copyValue}>
        <Text style={styles.copyText}>Copy</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  copyText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});
