import { useLocalSearchParams } from 'expo-router';

import { CitaDetalle } from '@/screens/cita-detalle';

export default function CitaScreen() {
  const { id, nueva } = useLocalSearchParams<{ id: string; nueva?: string }>();
  return <CitaDetalle id={id} nueva={nueva === '1'} />;
}
