import { router, Stack } from 'expo-router';

import { Consultor } from '@/screens/consultor';

export default function ConsultorScreen() {
  return (
    <>
      {process.env.EXPO_OS === 'ios' && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button onPress={() => router.back()}>Cerrar</Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
      <Consultor />
    </>
  );
}
