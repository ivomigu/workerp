import { Button, FieldGroup, Host, Text, TextInput } from '@expo/ui';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useEntrarConsultor } from '@/hooks/use-consultor';
import { modoDemo } from '@/lib/supabase';
import { DEMO_CLAVE, DEMO_EMAIL } from '@/utils/demo';

/** Formulario nativo para que el consultor entre con su email y contraseña. */
export function LoginConsultor() {
  // En el modo demostración, los datos de acceso de prueba ya vienen escritos.
  const [email, setEmail] = useState(modoDemo ? DEMO_EMAIL : '');
  const [clave, setClave] = useState(modoDemo ? DEMO_CLAVE : '');
  const entrar = useEntrarConsultor();

  function enviar() {
    if (entrar.isPending) return;
    if (!email.trim() || !clave) {
      Alert.alert('Faltan datos', 'Escribe tu email y tu contraseña.');
      return;
    }
    entrar.mutate(
      { email: email.trim(), clave },
      { onError: (e) => Alert.alert('No se pudo entrar', e.message) },
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <FieldGroup>
        <FieldGroup.Section title="Acceso para el consultor">
          <TextInput
            testID="login-email"
            placeholder="Email"
            defaultValue={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <TextInput
            testID="login-clave"
            placeholder="Contraseña"
            defaultValue={clave}
            onChangeText={setClave}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            onSubmitEditing={enviar}
          />
          <FieldGroup.SectionFooter>
            <Text>
              {modoDemo
                ? `Modo demostración: entra con ${DEMO_EMAIL} y la contraseña ${DEMO_CLAVE} (ya están escritos).`
                : 'Usa el email y la contraseña del usuario que creaste en Supabase. Los clientes no necesitan entrar aquí.'}
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
        <FieldGroup.Section>
          <Button
            testID="login-entrar"
            variant="filled"
            onPress={enviar}
            disabled={entrar.isPending}
            label={entrar.isPending ? 'Entrando…' : 'Entrar'}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
