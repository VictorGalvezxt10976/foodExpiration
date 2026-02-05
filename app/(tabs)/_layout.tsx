import { Platform } from 'react-native';
import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../src/hooks/useTheme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs
      tintColor={colors.tabBarActive}
      {...(Platform.OS === 'android' && { backgroundColor: colors.tabBar })}
    >
      <NativeTabs.Trigger name="index" options={{ title: 'Inicio' }}>
        <Icon src={<VectorIcon family={Ionicons} name="home-outline" />} />
        <Label>Inicio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="inventory" options={{ title: 'Inventario' }}>
        <Icon src={<VectorIcon family={Ionicons} name="list-outline" />} />
        <Label>Inventario</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shopping" options={{ title: 'Compras' }}>
        <Icon src={<VectorIcon family={Ionicons} name="cart-outline" />} />
        <Label>Compras</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stats" options={{ title: 'Estadisticas' }}>
        <Icon src={<VectorIcon family={Ionicons} name="stats-chart-outline" />} />
        <Label>Estadisticas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" options={{ title: 'Ajustes' }}>
        <Icon src={<VectorIcon family={Ionicons} name="settings-outline" />} />
        <Label>Ajustes</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
