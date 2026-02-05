import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '../constants/theme';
import { useSettings } from '../contexts/SettingsContext';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();
  const themeSetting = settings.theme;

  const isDark =
    themeSetting === 'system'
      ? colorScheme === 'dark'
      : themeSetting === 'dark';

  return {
    colors: isDark ? Colors.dark : Colors.light,
    isDark,
  };
}
