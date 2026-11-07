import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Accent, Colors } from '@/constants/theme';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      iconColor={{ default: colors.textSecondary, selected: Accent }}
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Catalogue</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'tshirt', selected: 'tshirt.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="tshirt-crew" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="studio">
        <NativeTabs.Trigger.Label>Studio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'camera', selected: 'camera.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="camera" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="admin">
        <NativeTabs.Trigger.Label>Espace pro</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          src={
            <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="store-cog" />
          }
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
