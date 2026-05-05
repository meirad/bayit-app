import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import LoadingOverlay from '../components/LoadingOverlay';

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay label="Loading session..." />;
  }

  return <NavigationContainer>{user ? <MainTabs /> : <AuthStack />}</NavigationContainer>;
}
