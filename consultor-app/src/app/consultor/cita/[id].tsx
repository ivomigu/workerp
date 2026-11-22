import { useLocalSearchParams } from 'expo-router';

import { CitaConsultor } from '@/screens/consultor/cita';

export default function CitaConsultorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CitaConsultor id={id} />;
}
