import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { Accent } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TabIconProps {
  name: IconName;
  color: ColorValue;
  size: number;
}

function TabIcon({ name, color, size }: TabIconProps) {
  return <MaterialCommunityIcons name={name} color={String(color)} size={size} />;
}

/** Web: JS tabs (native tabs render vector icons with a native-only API). */
export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catalogue',
          tabBarIcon: ({ color, size }) => <TabIcon name="tshirt-crew" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: 'Studio',
          tabBarIcon: ({ color, size }) => <TabIcon name="camera" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Espace pro',
          tabBarIcon: ({ color, size }) => <TabIcon name="store-cog" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
