import { Button, FieldGroup, Host, Picker, Row, Spacer, Text, TextInput } from '@expo/ui';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { CONSULTOR, MODALIDADES, TEMAS, type Modalidad } from '@/constants/consultor';
import { emailsAClientes } from '@/lib/supabase';
import { useCrearCita } from '@/hooks/use-citas';
import { formato } from '@/utils/agenda';
import { HorarioOcupadoError, ReglaError } from '@/utils/api';
import { prefijoDelTelefono } from '@/utils/codigo-pais';
import { leerCliente } from '@/utils/storage';
import { normalizarTelefono, telefonoValido } from '@/utils/telefono';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Formulario nativo (SwiftUI Form en iOS, Compose en Android) donde el
 * cliente revisa el horario, deja sus datos y confirma la cita.
 */
export function Reservar({ inicio }: { inicio: Date }) {
  const [cliente] = useState(leerCliente);
  const crear = useCrearCita();
  const [nombre, setNombre] = useState(cliente.nombre);
  const [telefono, setTelefono] = useState(cliente.telefono);
  const [prefijo] = useState(prefijoDelTelefono);
  const [email, setEmail] = useState(cliente.email);
  const [comentario, setComentario] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad>('videollamada');
  const [tema, setTema] = useState<string>(TEMAS[0]);

  function confirmar() {
    if (crear.isPending) return;
    const faltan: string[] = [];
    // Añade el código de país si el cliente no lo escribió.
    const telefonoIntl = normalizarTelefono(telefono, prefijo);
    if (nombre.trim().length < 2) faltan.push('tu nombre');
    if (!telefonoValido(telefonoIntl) || telefono.replace(/\D/g, '').length < 6) {
      faltan.push('un teléfono válido');
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) faltan.push('un email válido');
    if (faltan.length) {
      Alert.alert('Faltan datos', `Por favor escribe ${faltan.join(', ')}.`);
      return;
    }

    crear.mutate(
      {
        inicio: inicio.toISOString(),
        duracionMin: CONSULTOR.duracionMin,
        modalidad,
        tema,
        nombre: nombre.trim(),
        telefono: telefonoIntl,
        email: email.trim(),
        comentario: comentario.trim(),
      },
      {
        onSuccess: (cita) =>
          router.replace({ pathname: '/cita/[id]', params: { id: cita.id, nueva: '1' } }),
        onError: (e) => {
          if (e instanceof HorarioOcupadoError) {
            Alert.alert(
              'Horario no disponible',
              'Alguien reservó esta hora hace un momento. Elige otra.',
              [{ text: 'Ver horarios', onPress: () => router.back() }],
            );
          } else if (e instanceof ReglaError) {
            Alert.alert('No se pudo reservar', e.message);
          } else {
            // Los datos escritos se conservan para reintentar.
            Alert.alert('No se pudo confirmar', e.message);
          }
        },
      },
    );
  }

  return (
    <>
      {process.env.EXPO_OS === 'ios' && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button onPress={() => router.back()}>Cancelar</Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}

      <Host style={{ flex: 1 }}>
        <FieldGroup>
          <FieldGroup.Section title="Tu cita">
            <Row spacing={8}>
              <Text>Fecha</Text>
              <Spacer />
              <Text>{formato.fechaLarga(inicio)}</Text>
            </Row>
            <Row spacing={8}>
              <Text>Hora</Text>
              <Spacer />
              <Text>{formato.rangoHora(inicio, CONSULTOR.duracionMin)}</Text>
            </Row>
            <Row spacing={8}>
              <Text>Modalidad</Text>
              <Spacer />
              <Picker
                accessibilityLabel="Modalidad"
                selectedValue={modalidad}
                onValueChange={(v) => setModalidad(v as Modalidad)}>
                {MODALIDADES.map((m) => (
                  <Picker.Item key={m.value} label={m.label} value={m.value} />
                ))}
              </Picker>
            </Row>
            <Row spacing={8}>
              <Text>Tema</Text>
              <Spacer />
              <Picker accessibilityLabel="Tema" selectedValue={tema} onValueChange={setTema}>
                {TEMAS.map((t) => (
                  <Picker.Item key={t} label={t} value={t} />
                ))}
              </Picker>
            </Row>
          </FieldGroup.Section>

          <FieldGroup.Section title="Tus datos">
            <TextInput
              testID="input-nombre"
              placeholder="Nombre y apellido"
              defaultValue={cliente.nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              autoComplete="name"
            />
            <TextInput
              testID="input-telefono"
              placeholder="Teléfono"
              defaultValue={cliente.telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <TextInput
              testID="input-email"
              placeholder={
                emailsAClientes ? 'Email (para recibir la confirmación)' : 'Email (opcional)'
              }
              defaultValue={cliente.email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
            <FieldGroup.SectionFooter>
              <Text>{`Si no escribes el código de país, añadiremos ${prefijo}.`}</Text>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Comentario">
            <TextInput
              placeholder="¿Algo que deba saber antes de la cita? (opcional)"
              onChangeText={setComentario}
              multiline
              numberOfLines={3}
            />
            <FieldGroup.SectionFooter>
              <Text>
                Tu cita queda confirmada al instante. Puedes cancelarla desde «Mis citas».
              </Text>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section>
            <Button
              testID="confirmar"
              variant="filled"
              onPress={confirmar}
              disabled={crear.isPending}
              label={crear.isPending ? 'Confirmando…' : 'Confirmar cita'}
            />
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </>
  );
}
