import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

const ios = process.env.EXPO_OS === 'ios';

/** Encabezado con título grande al estilo iOS; en Android, barra Material normal. */
export const tabStackOptions: ComponentProps<typeof Stack>['screenOptions'] = {
  headerLargeTitleEnabled: true,
  headerTransparent: ios,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerLargeStyle: { backgroundColor: 'transparent' },
  headerBlurEffect: ios ? 'systemChromeMaterial' : undefined,
};
