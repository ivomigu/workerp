import { Color } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Colores semánticos del sistema: en iOS son los colores de UIKit y en
 * Android los de Material 3 (se adaptan al fondo de pantalla del usuario).
 * Cambian solos entre modo claro y oscuro.
 */
export const colors = {
  label: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: '#000000',
  })!,
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: '#3c3c43',
  })!,
  separator: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: '#c6c6c8',
  })!,
  background: Platform.select({
    ios: Color.ios.systemGroupedBackground,
    android: Color.android.dynamic.surface,
    default: '#f2f2f7',
  })!,
  card: Platform.select({
    ios: Color.ios.secondarySystemGroupedBackground,
    android: Color.android.dynamic.surfaceContainer,
    default: '#ffffff',
  })!,
  fill: Platform.select({
    ios: Color.ios.tertiarySystemFill,
    android: Color.android.dynamic.surfaceContainerHigh,
    default: '#e5e5ea',
  })!,
  accent: Platform.select({
    ios: Color.ios.systemBlue,
    android: Color.android.dynamic.primary,
    default: '#007aff',
  })!,
  onAccent: Platform.select({
    ios: '#ffffff',
    android: Color.android.dynamic.onPrimary,
    default: '#ffffff',
  })!,
  accentSoft: Platform.select({
    ios: Color.ios.secondarySystemFill,
    android: Color.android.dynamic.primaryContainer,
    default: '#e5f0ff',
  })!,
  success: Platform.select({
    ios: Color.ios.systemGreen,
    android: Color.android.dynamic.tertiary,
    default: '#34c759',
  })!,
  danger: Platform.select({
    ios: Color.ios.systemRed,
    android: Color.android.dynamic.error,
    default: '#ff3b30',
  })!,
};
