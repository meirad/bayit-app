import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

export default function PropertyCard({ property, onPress }) {
  const codeCount = Array.isArray(property?.codes) ? property.codes.length : 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{property?.name}</Text>
        <Text style={styles.badge}>{codeCount} {codeCount === 1 ? 'code' : 'codes'}</Text>
      </View>
      <Text numberOfLines={2} style={styles.notes}>
        {property?.notes || 'No notes'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badge: {
    fontSize: 12,
    color: colors.primaryDark,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  notes: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
