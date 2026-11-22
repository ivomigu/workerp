import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import type { SymbolViewProps } from 'expo-symbols';

import { Cargando, ErrorCarga } from '@/components/estado';
import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';
import { MODALIDADES } from '@/constants/consultor';
import { useCancelarComoConsultor, useTodasLasCitas } from '@/hooks/use-consultor';
import { formato } from '@/utils/agenda';

/** Ficha de una cita para el consultor, con botones para contactar al cliente. */
export function CitaConsultor({ id }: { id: string }) {
  const citas = useTodasLasCitas(true);
  const cancelar = useCancelarComoConsultor();
  const cita = citas.data?.find((c) => c.id === id);

  if (!cita) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingVertical: 32, alignItems: 'stretch' }}>
        {citas.data === undefined ? (
          citas.error ? (
            <ErrorCarga error={citas.error} onReintentar={() => citas.refetch()} />
          ) : (
            <Cargando />
          )
        ) : (
          <Text style={{ color: colors.secondaryLabel, fontSize: 17, textAlign: 'center' }}>
            No encontramos esta cita.
          </Text>
        )}
      </ScrollView>
    );
  }

  const inicio = new Date(cita.inicio);
  const cancelada = cita.estado === 'cancelada';
  const futura = inicio.getTime() > Date.now();
  const modalidad = MODALIDADES.find((m) => m.value === cita.modalidad)?.label ?? cita.modalidad;
  const digitos = cita.telefono.replace(/[^\d+]/g, '');

  function abrir(url: string) {
    Linking.openURL(url).catch(() =>
      Alert.alert('No se pudo abrir', 'Este teléfono no tiene una app para esta acción.'),
    );
  }

  function pedirCancelacion() {
    Alert.alert(
      '¿Cancelar esta cita?',
      `El horario quedará libre. ${cita!.nombre} no recibe aviso automático: avísale tú.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancelar cita',
          style: 'destructive',
          onPress: () =>
            cancelar.mutate(cita!.id, {
              onError: (e) => Alert.alert('No se pudo cancelar', e.message),
            }),
        },
      ],
    );
  }

  const filas: [string, string][] = [
    ['Fecha', formato.fechaLarga(inicio)],
    ['Hora', formato.rangoHora(inicio, cita.duracionMin)],
    ['Modalidad', modalidad],
    ['Tema', cita.tema],
    ['Teléfono', cita.telefono],
    ...(cita.email ? ([['Email', cita.email]] as [string, string][]) : []),
    ...(cita.comentario ? ([['Comentario', cita.comentario]] as [string, string][]) : []),
    [
      'Reservada',
      `${formato.fechaLarga(new Date(cita.creadaEn))}, ${formato.hora(new Date(cita.creadaEn))}`,
    ],
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
      <View style={{ alignItems: 'center', gap: 4, paddingTop: 8 }}>
        <Text
          selectable
          style={{ color: colors.label, fontSize: 26, fontWeight: '700', textAlign: 'center' }}>
          {cita.nombre}
        </Text>
        <Text style={{ color: colors.secondaryLabel, fontSize: 16 }}>
          {formato.fechaLarga(inicio)} · {formato.hora(inicio)}
        </Text>
        {cancelada && (
          <Text
            testID="estado-cancelada"
            style={{ color: colors.danger, fontSize: 15, fontWeight: '600' }}>
            Cancelada
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Accion
          label="Llamar"
          icono={{ ios: 'phone.fill', android: 'call' }}
          onPress={() => abrir(`tel:${digitos}`)}
        />
        <Accion
          label="WhatsApp"
          icono={{ ios: 'message.fill', android: 'chat' }}
          onPress={() => abrir(`https://wa.me/${digitos.replace('+', '')}`)}
        />
        {cita.email ? (
          <Accion
            label="Email"
            icono={{ ios: 'envelope.fill', android: 'mail' }}
            onPress={() => abrir(`mailto:${cita.email}`)}
          />
        ) : null}
      </View>

      <View
        style={{
          borderRadius: 16,
          borderCurve: 'continuous',
          backgroundColor: colors.card,
          paddingHorizontal: 16,
        }}>
        {filas.map(([label, valor], i) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              gap: 16,
              paddingVertical: 13,
              borderTopWidth: i === 0 ? 0 : 0.5,
              borderTopColor: colors.separator,
            }}>
            <Text style={{ color: colors.secondaryLabel, fontSize: 16 }}>{label}</Text>
            <Text
              selectable
              style={{ color: colors.label, fontSize: 16, flex: 1, textAlign: 'right' }}>
              {valor}
            </Text>
          </View>
        ))}
      </View>

      {!cancelada && futura && (
        <Pressable
          testID="consultor-cancelar"
          accessibilityRole="button"
          disabled={cancelar.isPending}
          onPress={pedirCancelacion}
          style={({ pressed }) => ({
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: process.env.EXPO_OS === 'ios' ? 14 : 999,
            borderCurve: 'continuous',
            backgroundColor: colors.card,
            opacity: pressed || cancelar.isPending ? 0.6 : 1,
          })}>
          <Text style={{ color: colors.danger, fontSize: 17, fontWeight: '600' }}>
            {cancelar.isPending ? 'Cancelando…' : 'Cancelar cita'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Accion({
  label,
  icono,
  onPress,
}: {
  label: string;
  icono: SymbolViewProps['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 12,
        gap: 6,
        alignItems: 'center',
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: colors.card,
        opacity: pressed ? 0.6 : 1,
      })}>
      <Icon name={icono} size={22} color={colors.accent} />
      <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}
