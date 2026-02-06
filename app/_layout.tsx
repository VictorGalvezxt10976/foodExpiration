import { useCallback } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import {
  useFonts,
  PlaypenSans_400Regular,
  PlaypenSans_500Medium,
  PlaypenSans_600SemiBold,
  PlaypenSans_700Bold,
} from '@expo-google-fonts/playpen-sans';
import { useTheme } from '../src/hooks/useTheme';
import { initDatabase } from '../src/database/schema';
import { SettingsProvider } from '../src/contexts/SettingsContext';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: 'PlaypenSans_600SemiBold' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-item"
          options={{
            title: 'Agregar Producto',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="edit-item"
          options={{
            title: 'Editar Producto',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="add-meal"
          options={{
            title: 'Registrar Comida',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="ai-recipes"
          options={{
            title: 'Recetas con IA',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlaypenSans_400Regular,
    PlaypenSans_500Medium,
    PlaypenSans_600SemiBold,
    PlaypenSans_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName="freshkeep.db" onInit={initDatabase}>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </View>
  );
}
