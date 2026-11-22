import { ScrollView } from 'react-native';

import { Cargando, ErrorCarga } from '@/components/estado';
import { colors } from '@/constants/colors';
import { useConsultor } from '@/hooks/use-consultor';

import { LoginConsultor } from './login';
import { PanelConsultor } from './panel';

/** Muestra el acceso o el panel, según haya sesión de consultor en este teléfono. */
export function Consultor() {
  const consultor = useConsultor();

  if (consultor.data === undefined) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingVertical: 32 }}>
        {consultor.error ? (
          <ErrorCarga error={consultor.error} onReintentar={() => consultor.refetch()} />
        ) : (
          <Cargando />
        )}
      </ScrollView>
    );
  }

  return consultor.data ? <PanelConsultor email={consultor.data.email} /> : <LoginConsultor />;
}
