import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';

/** Indicador de carga centrado. */
export function Cargando({ texto }: { texto?: string }) {
  return (
    <View style={{ padding: 32, gap: 12, alignItems: 'center' }}>
      <ActivityIndicator />
      {texto && <Text style={{ color: colors.secondaryLabel, fontSize: 15 }}>{texto}</Text>}
    </View>
  );
}

/** Error con botón para reintentar. */
export function ErrorCarga({ error, onReintentar }: { error: unknown; onReintentar: () => void }) {
  const mensaje = error instanceof Error ? error.message : 'Algo salió mal.';
  return (
    <View
      style={{
        marginHorizontal: 16,
        padding: 24,
        gap: 10,
        alignItems: 'center',
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: colors.card,
      }}>
      <Icon
        name={{ ios: 'wifi.exclamationmark', android: 'wifi_off' }}
        size={32}
        color={colors.secondaryLabel}
      />
      <Text selectable style={{ color: colors.label, fontSize: 15, textAlign: 'center' }}>
        {mensaje}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onReintentar}
        style={({ pressed }) => ({
          paddingVertical: 8,
          paddingHorizontal: 16,
          opacity: pressed ? 0.6 : 1,
        })}>
        <Text style={{ color: colors.accent, fontSize: 17, fontWeight: '600' }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

/** Aviso pequeño cuando falla una actualización pero hay datos guardados. */
export function AvisoDesactualizado({ onReintentar }: { onReintentar: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onReintentar}
      style={{ marginHorizontal: 16, padding: 12, borderRadius: 12, backgroundColor: colors.fill }}>
      <Text style={{ color: colors.secondaryLabel, fontSize: 14, textAlign: 'center' }}>
        No se pudo actualizar. Toca para reintentar.
      </Text>
    </Pressable>
  );
}
