import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="reservar"
          options={{ presentation: 'modal', title: 'Confirmar cita' }}
        />
        <Stack.Screen name="cita/[id]" options={{ presentation: 'modal', title: 'Tu cita' }} />
      </Stack>
    </ThemeProvider>
  );
}
