import { useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, Text } from 'react-native';

import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';
import { modoDemo } from '@/lib/supabase';
import { reiniciarDemo } from '@/utils/demo';

/** Aviso de que la app está en modo demostración. Al tocarlo, ofrece reiniciar los datos. */
export function AvisoDemo() {
  const qc = useQueryClient();
  if (!modoDemo) return null;

  function preguntar() {
    Alert.alert(
      'Modo demostración',
      'Las citas son de ejemplo y lo que hagas se guarda solo en este teléfono. ' +
        'No se envían emails. ¿Quieres borrar tus pruebas y volver a los datos de ejemplo?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Reiniciar demo',
          style: 'destructive',
          onPress: () => {
            reiniciarDemo();
            qc.resetQueries();
          },
        },
      ],
    );
  }

  return (
    <Pressable
      testID="aviso-demo"
      accessibilityRole="button"
      accessibilityHint="Muestra información del modo demostración y permite reiniciarlo"
      onPress={preguntar}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: colors.accentSoft,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Icon name={{ ios: 'sparkles', android: 'science' }} size={18} color={colors.accent} />
      <Text style={{ flex: 1, color: colors.label, fontSize: 14 }}>
        <Text style={{ fontWeight: '600' }}>Modo demostración.</Text> Datos de ejemplo, sin
        conexión. Toca para reiniciar.
      </Text>
    </Pressable>
  );
}
