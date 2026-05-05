import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import colors from '../theme/colors';
import ErrorBanner from '../components/ErrorBanner';

export default function EditPropertyScreen({ route, navigation }) {
  const { id, property: routeProperty } = route.params || {};
  const { user } = useAuth();

  const [name, setName] = useState(routeProperty?.name || '');
  const [codes, setCodes] = useState(routeProperty?.codes || [{ label: '', value: '' }]);
  const [notes, setNotes] = useState(routeProperty?.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!routeProperty);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Access denied.');
      navigation.goBack();
      return;
    }

    if (routeProperty || !id) {
      return;
    }

    const loadProperty = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/codes/${id}`);
        setName(data.name || '');
        setCodes(Array.isArray(data.codes) && data.codes.length > 0 ? data.codes : [{ label: '', value: '' }]);
        setNotes(data.notes || '');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load property.');
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id, navigation, routeProperty, user?.role]);

  const addCodeRow = () => setCodes((prev) => [...prev, { label: '', value: '' }]);
  const removeCodeRow = (index) => setCodes((prev) => prev.filter((_, i) => i !== index));
  const updateCodeRow = (index, field, value) => {
    setCodes((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleSave = async () => {
    setError('');

    const normalizedCodes = codes
      .map((c) => ({ label: c.label.trim(), value: c.value.trim() }))
      .filter((c) => c.label && c.value);

    if (!name.trim()) {
      setError('Property name is required.');
      return;
    }

    if (normalizedCodes.length === 0) {
      setError('Add at least one complete code row.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/codes/${id}`, {
        name: name.trim(),
        codes: normalizedCodes,
        notes: notes.trim(),
      });
      navigation.replace('PropertyDetail', { id });
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError("You don't have permission to do this.");
      } else {
        setError(err.response?.data?.error || 'Failed to save changes.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ErrorBanner message={error} onDismiss={() => setError('')} />

        <Text style={styles.label}>Property Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Property name" />

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Codes</Text>
          <Pressable onPress={addCodeRow}>
            <Text style={styles.link}>Add Code</Text>
          </Pressable>
        </View>

        {codes.map((row, index) => (
          <View key={`${index}-${row.label}`} style={styles.codeRow}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={row.label}
              onChangeText={(text) => updateCodeRow(index, 'label', text)}
              placeholder="Label"
            />
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={row.value}
              onChangeText={(text) => updateCodeRow(index, 'value', text)}
              placeholder="Value"
            />
            {codes.length > 1 && (
              <Pressable style={styles.removeButton} onPress={() => removeCodeRow(index)}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            )}
          </View>
        ))}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes (optional)"
          multiline
          numberOfLines={4}
        />

        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  codeRow: {
    marginBottom: 4,
  },
  codeInput: {
    marginBottom: 8,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  removeButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  removeButtonText: {
    color: colors.error,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
