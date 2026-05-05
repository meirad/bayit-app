import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CodesScreen from '../screens/CodesScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import AddPropertyScreen from '../screens/AddPropertyScreen';
import EditPropertyScreen from '../screens/EditPropertyScreen';

const Tab = createBottomTabNavigator();
const CodesStack = createNativeStackNavigator();

function CodesStackNavigator() {
  return (
    <CodesStack.Navigator>
      <CodesStack.Screen name="Codes" component={CodesScreen} options={{ title: 'Property Codes' }} />
      <CodesStack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ title: 'Property' }}
      />
      <CodesStack.Screen name="AddProperty" component={AddPropertyScreen} options={{ title: 'Add Property' }} />
      <CodesStack.Screen
        name="EditProperty"
        component={EditPropertyScreen}
        options={{ title: 'Edit Property' }}
      />
    </CodesStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="CodesTab"
        component={CodesStackNavigator}
        options={{
          title: 'Codes',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
