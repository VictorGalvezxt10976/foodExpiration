import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme';
import { initDatabase } from '../src/database/schema';
import { SettingsProvider } from '../src/contexts/SettingsContext';

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
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="freshkeep.db" onInit={initDatabase}>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
