import '@/utils/local-storage';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { CONSULTOR } from '@/constants/consultor';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** false si faltan las variables de .env.local (ver README). */
export const supabaseConfigurado = Boolean(url && key);

/**
 * Modo demostración: sin Supabase configurado (o con EXPO_PUBLIC_DEMO=1) la app
 * funciona con datos de ejemplo guardados solo en este teléfono.
 */
export const modoDemo = process.env.EXPO_PUBLIC_DEMO === '1' || !supabaseConfigurado;

/** La app solo menciona emails al cliente si están activados y no es la demostración. */
export const emailsAClientes = CONSULTOR.confirmacionPorEmail && !modoDemo;

export const supabase = createClient(url || 'http://localhost', key || 'sin-configurar', {
  auth: {
    // La sesión anónima de cada teléfono se guarda con expo-sqlite.
    storage: typeof localStorage === 'undefined' ? undefined : localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renueva la sesión solo mientras la app está en primer plano.
if (process.env.EXPO_OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

let sesion: Promise<void> | null = null;

// Al cerrar sesión (el consultor pulsa «Salir»), la próxima acción crea otra anónima.
supabase.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_OUT') sesion = null;
});

/**
 * Cada teléfono entra como usuario anónimo (sin registro). Así Supabase sabe
 * qué citas son de quién, sin pedir contraseña al cliente.
 */
export function asegurarSesion() {
  sesion ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  })().catch((e) => {
    sesion = null; // permite reintentar
    throw e;
  });
  return sesion;
}
