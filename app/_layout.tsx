import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/hooks/useTheme';
import { initDatabase } from '../src/database/schema';

export default function RootLayout() {
  const { colors, isDark } = useTheme();

  return (
    <SQLiteProvider databaseName="freshkeep.db" onInit={initDatabase}>
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
      </Stack>
    </SQLiteProvider>
  );
}
