import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, SectionList, Text, View } from 'react-native';

import { AvisoDemo } from '@/components/aviso-demo';
import { AvisoDesactualizado, Cargando, ErrorCarga } from '@/components/estado';
import { Icon } from '@/components/icon';
import { colors } from '@/constants/colors';
import { MODALIDADES } from '@/constants/consultor';
import { useSalirConsultor, useTodasLasCitas } from '@/hooks/use-consultor';
import { claveDia, esMismoDia, formato, sumarDias } from '@/utils/agenda';
import type { Cita } from '@/utils/api';

type Vista = 'proximas' | 'pasadas';
const DIA = 86_400_000;

function tituloDia(fecha: Date, hoy: Date) {
  const manana = sumarDias(hoy, 1);
  const ayer = sumarDias(hoy, -1);
  const larga = formato.fechaLarga(fecha);
  if (esMismoDia(fecha, hoy)) return `Hoy · ${larga}`;
  if (esMismoDia(fecha, manana)) return `Mañana · ${larga}`;
  if (esMismoDia(fecha, ayer)) return `Ayer · ${larga}`;
  return larga;
}

/** Agrupa las citas por día, en el orden en que llegan. */
function agruparPorDia(citas: Cita[], hoy: Date) {
  const secciones: { title: string; data: Cita[] }[] = [];
  let clave = '';
  for (const c of citas) {
    const d = new Date(c.inicio);
    const k = claveDia(d);
    if (k !== clave) {
      secciones.push({ title: tituloDia(d, hoy), data: [] });
      clave = k;
    }
    secciones.at(-1)!.data.push(c);
  }
  return secciones;
}

export function PanelConsultor({ email }: { email: string }) {
  const citas = useTodasLasCitas(true);
  const salir = useSalirConsultor();
  const [vista, setVista] = useState<Vista>('proximas');
  const [refrescando, setRefrescando] = useState(false);

  const ahora = new Date();
  const todas = citas.data ?? [];
  // Una cita sigue en «Próximas» hasta que termina.
  const finDe = (c: Cita) => new Date(c.inicio).getTime() + c.duracionMin * 60_000;
  const proximas = todas.filter((c) => finDe(c) > ahora.getTime());
  const pasadas = todas
    .filter((c) => finDe(c) <= ahora.getTime() && finDe(c) > ahora.getTime() - 60 * DIA)
    .reverse();

  const confirmadas = proximas.filter((c) => c.estado === 'confirmada');
  const hoy = confirmadas.filter((c) => esMismoDia(new Date(c.inicio), ahora)).length;
  const semana = confirmadas.filter(
    (c) => new Date(c.inicio).getTime() < ahora.getTime() + 7 * DIA,
  ).length;

  const secciones = agruparPorDia(vista === 'proximas' ? proximas : pasadas, ahora);

  return (
    <SectionList
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
      sections={secciones}
      keyExtractor={(c) => c.id}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={async () => {
            setRefrescando(true);
            await citas.refetch();
            setRefrescando(false);
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 16, paddingBottom: 4 }}>
          <View style={{ marginHorizontal: -16 }}>
            <AvisoDemo />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Resumen titulo="Hoy" valor={citas.data ? hoy : null} />
            <Resumen titulo="Próximos 7 días" valor={citas.data ? semana : null} />
          </View>
          <Segmentos
            valor={vista}
            onChange={setVista}
            opciones={[
              { valor: 'proximas', label: 'Próximas' },
              { valor: 'pasadas', label: 'Pasadas' },
            ]}
          />
          {citas.data && citas.error && (
            <AvisoDesactualizado onReintentar={() => citas.refetch()} />
          )}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text
          style={{
            color: colors.secondaryLabel,
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
            paddingHorizontal: 4,
            paddingTop: 14,
          }}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => <FilaCita cita={item} />}
      ListEmptyComponent={
        citas.data === undefined ? (
          citas.error ? (
            <ErrorCarga error={citas.error} onReintentar={() => citas.refetch()} />
          ) : (
            <Cargando texto="Cargando la agenda…" />
          )
        ) : (
          <View style={{ alignItems: 'center', gap: 8, padding: 32 }}>
            <Icon
              name={{ ios: 'calendar', android: 'calendar_month' }}
              size={40}
              color={colors.secondaryLabel}
            />
            <Text style={{ color: colors.secondaryLabel, fontSize: 16, textAlign: 'center' }}>
              {vista === 'proximas'
                ? 'No hay citas próximas.'
                : 'No hubo citas en los últimos 60 días.'}
            </Text>
          </View>
        )
      }
      ListFooterComponent={
        <View style={{ alignItems: 'center', gap: 4, paddingTop: 32 }}>
          <Text style={{ color: colors.secondaryLabel, fontSize: 13 }}>{email}</Text>
          <Pressable
            testID="salir"
            accessibilityRole="button"
            disabled={salir.isPending}
            onPress={() => salir.mutate(undefined, { onSuccess: () => router.back() })}
            style={({ pressed }) => ({ padding: 10, opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ color: colors.danger, fontSize: 17 }}>
              {salir.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </Text>
          </Pressable>
        </View>
      }
    />
  );
}

function Resumen({ titulo, valor }: { titulo: string; valor: number | null }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        gap: 2,
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: colors.card,
      }}>
      <Text style={{ color: colors.secondaryLabel, fontSize: 14 }}>{titulo}</Text>
      <Text
        style={{
          color: colors.label,
          fontSize: 30,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
        }}>
        {valor ?? '–'}
      </Text>
    </View>
  );
}

function Segmentos<T extends string>({
  valor,
  onChange,
  opciones,
}: {
  valor: T;
  onChange: (v: T) => void;
  opciones: { valor: T; label: string }[];
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        padding: 2,
        borderRadius: 10,
        borderCurve: 'continuous',
        backgroundColor: colors.fill,
      }}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            testID={`vista-${o.valor}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            onPress={() => onChange(o.valor)}
            style={{
              flex: 1,
              paddingVertical: 7,
              alignItems: 'center',
              borderRadius: 8,
              borderCurve: 'continuous',
              backgroundColor: activo ? colors.card : 'transparent',
              boxShadow: activo ? '0 1px 3px rgba(0,0,0,0.12)' : undefined,
            }}>
            <Text style={{ color: colors.label, fontSize: 14, fontWeight: activo ? '600' : '400' }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FilaCita({ cita }: { cita: Cita }) {
  const inicio = new Date(cita.inicio);
  const cancelada = cita.estado === 'cancelada';
  const modalidad = MODALIDADES.find((m) => m.value === cita.modalidad)?.label;

  return (
    <Pressable
      testID={`panel-cita-${cita.id}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/consultor/cita/[id]', params: { id: cita.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 16,
        borderCurve: 'continuous',
        backgroundColor: colors.card,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View style={{ width: 58 }}>
        <Text
          style={{
            color: cancelada ? colors.secondaryLabel : colors.label,
            fontSize: 17,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
            textDecorationLine: cancelada ? 'line-through' : 'none',
          }}>
          {formato.hora(inicio)}
        </Text>
        <Text style={{ color: colors.secondaryLabel, fontSize: 12 }}>{cita.duracionMin} min</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          numberOfLines={1}
          style={{
            color: cancelada ? colors.secondaryLabel : colors.label,
            fontSize: 17,
            fontWeight: '600',
          }}>
          {cita.nombre}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.secondaryLabel, fontSize: 14 }}>
          {cita.tema} · {modalidad}
        </Text>
        {cancelada && <Text style={{ color: colors.danger, fontSize: 13 }}>Cancelada</Text>}
      </View>
      {process.env.EXPO_OS === 'ios' && (
        <Icon name="chevron.right" size={14} color={colors.secondaryLabel} />
      )}
    </Pressable>
  );
}
