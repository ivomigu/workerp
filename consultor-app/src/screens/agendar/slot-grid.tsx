import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/constants/colors';
import { formato } from '@/utils/agenda';

const COLUMNAS = 3;
const GAP = 10;
const MARGEN = 16;

type Props = {
  libres: Date[];
  onSelect: (inicio: Date) => void;
};

/** Botones con cada hora libre del día elegido. */
export function SlotGrid({ libres, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const ancho = Math.floor((Math.min(width, 600) - MARGEN * 2 - GAP * (COLUMNAS - 1)) / COLUMNAS);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: MARGEN }}>
      {libres.map((inicio) => {
        const hora = formato.hora(inicio);
        return (
          <Pressable
            key={inicio.getTime()}
            testID={`hora-${hora}`}
            accessibilityRole="button"
            accessibilityLabel={`Reservar a las ${hora}`}
            onPress={() => onSelect(inicio)}
            style={({ pressed }) => ({
              width: ancho,
              paddingVertical: 14,
              alignItems: 'center',
              borderRadius: 14,
              borderCurve: 'continuous',
              backgroundColor: pressed ? colors.accentSoft : colors.card,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text
              style={{
                color: colors.accent,
                fontSize: 17,
                fontWeight: '600',
                fontVariant: ['tabular-nums'],
              }}>
              {hora}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
