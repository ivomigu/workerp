import { Pressable, ScrollView, Text } from 'react-native';

import { colors } from '@/constants/colors';
import { esMismoDia, formato, type Dia } from '@/utils/agenda';

type Props = {
  dias: Dia[];
  seleccionado?: Date;
  onSelect: (dia: Dia) => void;
};

/** Tira horizontal de días con cuántos horarios libres tiene cada uno. */
export function DayStrip({ dias, seleccionado, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {dias.map((dia, i) => {
        const activo = !!seleccionado && esMismoDia(dia.fecha, seleccionado);
        const lleno = dia.libres.length === 0;
        const texto = activo ? colors.onAccent : colors.label;
        const sub = activo ? colors.onAccent : colors.secondaryLabel;

        return (
          <Pressable
            key={dia.fecha.getTime()}
            testID={`dia-${i}`}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`${formato.fechaLarga(dia.fecha)}, ${
              lleno ? 'sin horarios libres' : `${dia.libres.length} horarios libres`
            }`}
            onPress={() => onSelect(dia)}
            style={({ pressed }) => ({
              width: 68,
              paddingVertical: 12,
              gap: 2,
              alignItems: 'center',
              borderRadius: 18,
              borderCurve: 'continuous',
              backgroundColor: activo ? colors.accent : colors.card,
              opacity: pressed ? 0.7 : lleno && !activo ? 0.5 : 1,
            })}>
            <Text
              style={{ color: sub, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
              {formato.diaCorto(dia.fecha)}
            </Text>
            <Text
              style={{
                color: texto,
                fontSize: 24,
                fontWeight: '700',
                fontVariant: ['tabular-nums'],
              }}>
              {formato.numeroDia(dia.fecha)}
            </Text>
            <Text style={{ color: sub, fontSize: 12 }}>
              {lleno ? 'Lleno' : `${dia.libres.length} libres`}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
