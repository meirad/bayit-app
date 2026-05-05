import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import colors from '../theme/colors';
import PropertyCard from '../components/PropertyCard';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorBanner from '../components/ErrorBanner';

export default function CodesScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchProperties = useCallback(async (q = '', isRefresh = false) => {
    setError('');
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/codes', { params: q ? { q } : {} });
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load properties.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, fetchProperties]);

  useFocusEffect(
    useCallback(() => {
      fetchProperties(query);
    }, [fetchProperties, query])
  );

  const countLabel = useMemo(() => {
    const count = properties.length;
    return `${count} ${count === 1 ? 'property' : 'properties'}`;
  }, [properties]);

  if (loading && properties.length === 0) {
    return <LoadingOverlay label="Loading properties..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Codes</Text>
        <Text style={styles.subtitle}>{countLabel}</Text>
      </View>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <TextInput
        style={styles.searchInput}
        placeholder="Search by property name..."
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProperties(query, true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No properties found.</Text>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddProperty')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
});
