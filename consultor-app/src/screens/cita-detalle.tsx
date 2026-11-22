import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Cargando, ErrorCarga } from '@/components/estado';
import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';
import { MODALIDADES } from '@/constants/consultor';
import { emailsAClientes } from '@/lib/supabase';
import { useCancelarCita, useMisCitas } from '@/hooks/use-citas';
import { formato } from '@/utils/agenda';

export function CitaDetalle({ id, nueva }: { id: string; nueva: boolean }) {
  const misCitas = useMisCitas();
  const cancelar = useCancelarCita();
  const cita = misCitas.data?.find((c) => c.id === id);

  if (!cita && misCitas.data === undefined) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingVertical: 32 }}>
        {misCitas.error ? (
          <ErrorCarga error={misCitas.error} onReintentar={() => misCitas.refetch()} />
        ) : (
          <Cargando />
        )}
      </ScrollView>
    );
  }

  if (!cita) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 32, alignItems: 'center' }}>
        <Text style={{ color: colors.secondaryLabel, fontSize: 17 }}>
          No encontramos esta cita.
        </Text>
      </ScrollView>
    );
  }

  const inicio = new Date(cita.inicio);
  const cancelada = cita.estado === 'cancelada';
  const futura = inicio.getTime() > Date.now();
  const modalidad = MODALIDADES.find((m) => m.value === cita.modalidad)?.label ?? cita.modalidad;

  function pedirCancelacion() {
    Alert.alert('¿Cancelar la cita?', 'El horario quedará libre para otra persona.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar cita',
        style: 'destructive',
        onPress: () =>
          cancelar.mutate(cita!.id, {
            onError: (e) => Alert.alert('No se pudo cancelar', e.message),
          }),
      },
    ]);
  }

  const filas: [string, string][] = [
    ['Fecha', formato.fechaLarga(inicio)],
    ['Hora', formato.rangoHora(inicio, cita.duracionMin)],
    ['Modalidad', modalidad],
    ['Tema', cita.tema],
    ['Nombre', cita.nombre],
    ['Teléfono', cita.telefono],
    ...(cita.email ? ([['Email', cita.email]] as [string, string][]) : []),
    ...(cita.comentario ? ([['Comentario', cita.comentario]] as [string, string][]) : []),
  ];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 40 }}>
      {(nueva || cancelada) && (
        <View style={{ alignItems: 'center', gap: 8, paddingTop: 8 }}>
          <Icon
            name={
              cancelada
                ? { ios: 'xmark.circle.fill', android: 'cancel' }
                : { ios: 'checkmark.circle.fill', android: 'check_circle' }
            }
            size={72}
            color={cancelada ? colors.danger : colors.success}
          />
          <Text
            testID="titulo-estado"
            style={{ color: colors.label, fontSize: 28, fontWeight: '700', textAlign: 'center' }}>
            {cancelada ? 'Cita cancelada' : '¡Cita confirmada!'}
          </Text>
          {!cancelada && (
            <Text style={{ color: colors.secondaryLabel, fontSize: 16, textAlign: 'center' }}>
              Te esperamos el {formato.fechaLarga(inicio).toLowerCase()} a las{' '}
              {formato.hora(inicio)}.
            </Text>
          )}
          {cancelada && emailsAClientes && cita.email ? (
            <Text
              testID="aviso-email-cancelacion"
              style={{ color: colors.secondaryLabel, fontSize: 14, textAlign: 'center' }}>
              Te enviamos un email con la cancelación a {cita.email}.
            </Text>
          ) : null}
          {nueva && !cancelada && emailsAClientes && cita.email ? (
            <Text
              testID="aviso-email"
              style={{ color: colors.secondaryLabel, fontSize: 14, textAlign: 'center' }}>
              Te enviamos la confirmación a {cita.email}.
            </Text>
          ) : null}
        </View>
      )}

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

      {!cancelada && (
        <Text style={{ color: colors.secondaryLabel, fontSize: 14, paddingHorizontal: 16 }}>
          {cita.modalidad === 'videollamada'
            ? 'Recibirás el enlace de la videollamada antes de la cita.'
            : 'Te enviaremos la dirección de la oficina por teléfono o email.'}
        </Text>
      )}

      <View style={{ gap: 8 }}>
        <Boton testID="listo" titulo="Listo" onPress={() => router.back()} principal />
        {!cancelada && futura && (
          <Boton
            testID="cancelar-cita"
            titulo={cancelar.isPending ? 'Cancelando…' : 'Cancelar cita'}
            onPress={cancelar.isPending ? () => {} : pedirCancelacion}
            peligro
          />
        )}
      </View>
    </ScrollView>
  );
}

function Boton({
  titulo,
  onPress,
  principal,
  peligro,
  testID,
}: {
  titulo: string;
  onPress: () => void;
  principal?: boolean;
  peligro?: boolean;
  testID?: string;
}) {
  const ios = process.env.EXPO_OS === 'ios';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: ios ? 14 : 999,
        borderCurve: 'continuous',
        backgroundColor: principal ? colors.accent : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: principal ? colors.onAccent : peligro ? colors.danger : colors.accent,
        }}>
        {titulo}
      </Text>
    </Pressable>
  );
}
