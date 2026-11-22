import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';
import { CONSULTOR } from '@/constants/consultor';
import { useCitas } from '@/hooks/use-citas';
import { calcularAgenda, formato } from '@/utils/agenda';

import { ConsultorCard } from './consultor-card';
import { DayStrip } from './day-strip';
import { SlotGrid } from './slot-grid';

export function Agendar() {
  const citas = useCitas();
  const [ahora, setAhora] = useState(() => new Date());
  const [diaElegido, setDiaElegido] = useState<number | null>(null);

  // Al volver a la pantalla, recalcula para ocultar horarios que ya pasaron.
  useFocusEffect(useCallback(() => setAhora(new Date()), []));

  const dias = calcularAgenda(citas, ahora);
  const dia =
    dias.find((d) => d.fecha.getTime() === diaElegido) ??
    dias.find((d) => d.libres.length > 0) ??
    dias[0];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingVertical: 16, gap: 28 }}>
      <ConsultorCard />

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
              dia.libres.length === 1 ? '1 horario libre' : `${dia.libres.length} horarios libres`
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

      <Text
        style={{
          color: colors.secondaryLabel,
          fontSize: 13,
          textAlign: 'center',
          paddingHorizontal: 32,
        }}>
        Sesiones de {CONSULTOR.duracionMin} minutos. Las horas se muestran en tu zona horaria.
      </Text>
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
