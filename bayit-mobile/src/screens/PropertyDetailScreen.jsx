import React, { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, ToastAndroid, View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import colors from '../theme/colors';
import CodeRow from '../components/CodeRow';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorBanner from '../components/ErrorBanner';

export default function PropertyDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const loadProperty = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const snap = await getDoc(doc(db, 'properties', id));
      if (!snap.exists()) {
        setError('Property not found.');
      } else {
        setProperty({ id: snap.id, ...snap.data() });
      }
    } catch (err) {
      setError('Failed to load property.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadProperty();
    }, [loadProperty])
  );

  const handleCopied = () => {
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied!', ToastAndroid.SHORT);
      return;
    }
    Alert.alert('Copied', 'Code copied to clipboard.');
  };

  const confirmDelete = () => {
    Alert.alert('Delete property?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'properties', id));
            navigation.goBack();
          } catch (err) {
            setError('Delete failed.');
          }
        },
      },
    ]);
  };

  if (loading && !property) {
    return <LoadingOverlay label="Loading property..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {property ? (
        <>
          <Text style={styles.name}>{property.name}</Text>

          <Text style={styles.sectionTitle}>Codes</Text>
          {Array.isArray(property.codes) && property.codes.length > 0 ? (
            property.codes.map((code, index) => (
              <CodeRow
                key={`${code.label}-${index}`}
                label={code.label}
                value={code.value}
                onCopied={handleCopied}
              />
            ))
          ) : (
            <Text style={styles.empty}>No codes saved.</Text>
          )}

          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{property.notes || 'No notes.'}</Text>

          {isAdmin && (
            <View style={styles.actions}>
              <Pressable
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProperty', { id: property.id, property })}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={confirmDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.empty}>Property not found.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 8,
  },
  notes: {
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 10,
  },
  actions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
