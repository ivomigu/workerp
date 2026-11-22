import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2 }, mutations: { retry: 0 } },
});

export default function RootLayout() {
  const scheme = useColorScheme();

  // Al volver a la app, actualiza horarios y citas.
  useEffect(() => {
    if (process.env.EXPO_OS === 'web') return;
    const sub = AppState.addEventListener('change', (estado) =>
      focusManager.setFocused(estado === 'active'),
    );
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="reservar"
            options={{ presentation: 'modal', title: 'Confirmar cita' }}
          />
          <Stack.Screen name="cita/[id]" options={{ presentation: 'modal', title: 'Tu cita' }} />
          <Stack.Screen name="consultor" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
