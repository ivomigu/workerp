import { router } from 'expo-router';
import { Pressable, SectionList, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';
import { MODALIDADES } from '@/constants/consultor';
import { useCitas } from '@/hooks/use-citas';
import { formato } from '@/utils/agenda';
import type { Cita } from '@/utils/storage';

export function MisCitas() {
  const citas = useCitas();
  const ahora = Date.now();
  const orden = (a: Cita, b: Cita) => a.inicio.localeCompare(b.inicio);

  const proximas = citas
    .filter((c) => c.estado === 'confirmada' && new Date(c.inicio).getTime() > ahora)
    .sort(orden);
  const historial = citas
    .filter((c) => !proximas.includes(c))
    .sort((a, b) => orden(b, a));

  const secciones = [
    { title: 'Próximas', data: proximas },
    { title: 'Historial', data: historial },
  ].filter((s) => s.data.length > 0);

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
      sections={secciones}
      keyExtractor={(c) => c.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text
          style={{
            color: colors.secondaryLabel,
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
            paddingHorizontal: 4,
            paddingTop: 12,
          }}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => <CitaFila cita={item} />}
      ListEmptyComponent={<SinCitas />}
    />
  );
}

function CitaFila({ cita }: { cita: Cita }) {
  const inicio = new Date(cita.inicio);
  const cancelada = cita.estado === 'cancelada';
  const pasada = !cancelada && inicio.getTime() <= Date.now();
  const modalidad = MODALIDADES.find((m) => m.value === cita.modalidad)?.label;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/cita/[id]', params: { id: cita.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: colors.card,
        opacity: pressed ? 0.7 : cancelada || pasada ? 0.6 : 1,
      })}>
      <View
        style={{
          width: 52,
          paddingVertical: 6,
          alignItems: 'center',
          borderRadius: 12,
          borderCurve: 'continuous',
          backgroundColor: colors.fill,
        }}>
        <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
          {formato.mesCorto(inicio)}
        </Text>
        <Text
          style={{ color: colors.label, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
          {inicio.getDate()}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.label, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
          {formato.rangoHora(inicio, cita.duracionMin)}
        </Text>
        <Text style={{ color: colors.secondaryLabel, fontSize: 14 }} numberOfLines={1}>
          {cita.tema} · {modalidad}
        </Text>
        {(cancelada || pasada) && (
          <Text style={{ color: cancelada ? colors.danger : colors.secondaryLabel, fontSize: 13 }}>
            {cancelada ? 'Cancelada' : 'Realizada'}
          </Text>
        )}
      </View>

      {process.env.EXPO_OS === 'ios' && (
        <Icon name="chevron.right" size={14} color={colors.secondaryLabel} />
      )}
    </Pressable>
  );
}

function SinCitas() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
      <Icon
        name={{ ios: 'calendar', android: 'calendar_month' }}
        size={48}
        color={colors.secondaryLabel}
      />
      <Text style={{ color: colors.label, fontSize: 20, fontWeight: '600' }}>Aún no tienes citas</Text>
      <Text style={{ color: colors.secondaryLabel, fontSize: 15, textAlign: 'center' }}>
        Elige un horario libre y agenda tu primera consulta.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.navigate('/')}
        style={({ pressed }) => ({ padding: 12, opacity: pressed ? 0.6 : 1 })}>
        <Text style={{ color: colors.accent, fontSize: 17, fontWeight: '600' }}>Ver horarios libres</Text>
      </Pressable>
    </View>
  );
}
