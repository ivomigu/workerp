import { Redirect, useLocalSearchParams } from 'expo-router';

import { Reservar } from '@/screens/reservar';

export default function ReservarScreen() {
  const { inicio } = useLocalSearchParams<{ inicio?: string }>();
  const fecha = inicio ? new Date(inicio) : null;

  // Si alguien abre el enlace sin un horario válido, vuelve a la agenda.
  if (!fecha || Number.isNaN(fecha.getTime())) return <Redirect href="/" />;

  return <Reservar inicio={fecha} />;
}
