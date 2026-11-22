import { Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';
import { CONSULTOR } from '@/constants/consultor';

export function ConsultorCard() {
  return (
    <View
      style={{
        marginHorizontal: 16,
        padding: 16,
        gap: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderCurve: 'continuous',
        backgroundColor: colors.card,
      }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
        }}>
        <Icon
          name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' }}
          size={26}
          color={colors.onAccent}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.label, fontSize: 17, fontWeight: '600' }}>
          {CONSULTOR.nombre}
        </Text>
        <Text style={{ color: colors.secondaryLabel, fontSize: 14 }}>{CONSULTOR.especialidad}</Text>
        <Text style={{ color: colors.secondaryLabel, fontSize: 14 }}>
          {CONSULTOR.duracionMin} min · Videollamada o presencial
        </Text>
      </View>
    </View>
  );
}
