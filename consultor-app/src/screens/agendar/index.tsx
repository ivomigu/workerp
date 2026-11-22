import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { AvisoDesactualizado, Cargando, ErrorCarga } from '@/components/estado';
import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';
import { CONSULTOR } from '@/constants/consultor';
import { useOcupados } from '@/hooks/use-citas';
import { useConsultor } from '@/hooks/use-consultor';
import { calcularAgenda, formato } from '@/utils/agenda';

import { ConsultorCard } from './consultor-card';
import { DayStrip } from './day-strip';
import { SlotGrid } from './slot-grid';

export function Agendar() {
  const ocupados = useOcupados();
  const consultor = useConsultor();
  const { refetch } = ocupados;
  const [ahora, setAhora] = useState(() => new Date());
  const [diaElegido, setDiaElegido] = useState<number | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  // Al volver a la pantalla, oculta horas que ya pasaron y pide las reservas nuevas.
  useFocusEffect(
    useCallback(() => {
      setAhora(new Date());
      refetch();
    }, [refetch]),
  );

  async function refrescar() {
    setRefrescando(true);
    setAhora(new Date());
    await refetch();
    setRefrescando(false);
  }

  const dias = calcularAgenda(ocupados.data ?? [], ahora);
  const dia =
    dias.find((d) => d.fecha.getTime() === diaElegido) ??
    dias.find((d) => d.libres.length > 0) ??
    dias[0];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingVertical: 16, gap: 28 }}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}>
      <ConsultorCard />

      {ocupados.data === undefined ? (
        ocupados.error ? (
          <ErrorCarga error={ocupados.error} onReintentar={() => refetch()} />
        ) : (
          <Cargando texto="Buscando horarios libres…" />
        )
      ) : (
        <>
          {ocupados.error && <AvisoDesactualizado onReintentar={() => refetch()} />}
          <View style={{ gap: 12 }}>
            <SectionTitle>Elige un día</SectionTitle>
            <DayStrip
              dias={dias}
              seleccionado={dia?.fecha}
              onSelect={(d) => setDiaElegido(d.fecha.getTime())}
            />
          </View>

          {dia && (
            <View style={{ gap: 12 }}>
              <SectionTitle
                detalle={
                  dia.libres.length === 1
                    ? '1 horario libre'
                    : `${dia.libres.length} horarios libres`
                }>
                {formato.fechaLarga(dia.fecha)}
              </SectionTitle>

              {dia.libres.length > 0 ? (
                <SlotGrid
                  libres={dia.libres}
                  onSelect={(inicio) =>
                    router.push({ pathname: '/reservar', params: { inicio: inicio.toISOString() } })
                  }
                />
              ) : (
                <SinHorarios />
              )}
            </View>
          )}
        </>
      )}

      <Text
        style={{
          color: colors.secondaryLabel,
          fontSize: 13,
          textAlign: 'center',
          paddingHorizontal: 32,
        }}>
        Sesiones de {CONSULTOR.duracionMin} minutos. Todas las horas están en {CONSULTOR.nombreZona}
        .
      </Text>

      <Pressable
        testID="acceso-consultor"
        accessibilityRole="button"
        onPress={() => router.push('/consultor')}
        style={({ pressed }) => ({ alignSelf: 'center', padding: 8, opacity: pressed ? 0.5 : 1 })}>
        <Text
          style={{ color: colors.secondaryLabel, fontSize: 13, textDecorationLine: 'underline' }}>
          {consultor.data ? 'Panel del consultor' : 'Acceso consultor'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function SectionTitle({ children, detalle }: { children: string; detalle?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        gap: 8,
      }}>
      <Text style={{ color: colors.label, fontSize: 20, fontWeight: '700', flexShrink: 1 }}>
        {children}
      </Text>
      {detalle && <Text style={{ color: colors.secondaryLabel, fontSize: 14 }}>{detalle}</Text>}
    </View>
  );
}

function SinHorarios() {
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
        name={{ ios: 'calendar.badge.exclamationmark', android: 'event_busy' }}
        size={32}
        color={colors.secondaryLabel}
      />
      <Text style={{ color: colors.secondaryLabel, fontSize: 15, textAlign: 'center' }}>
        No quedan horarios libres este día.{'\n'}Prueba con otro día.
      </Text>
    </View>
  );
}
