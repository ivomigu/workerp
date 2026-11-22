import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelarCita,
  entrarConsultor,
  obtenerConsultor,
  obtenerTodasLasCitas,
  salirConsultor,
  type Cita,
} from '@/utils/api';

const CLAVES = {
  consultor: ['consultor'] as const,
  todas: ['consultor', 'citas'] as const,
};

/**
 * Al cambiar de usuario, descarta todo lo cargado excepto la consulta del
 * consultor: la pantalla la está observando y la actualizamos a mano.
 */
function limpiarDatosDeOtroUsuario(qc: ReturnType<typeof useQueryClient>) {
  qc.removeQueries({
    predicate: (q) => !(q.queryKey.length === 1 && q.queryKey[0] === CLAVES.consultor[0]),
  });
}

export function useConsultor() {
  return useQuery({ queryKey: CLAVES.consultor, queryFn: obtenerConsultor, staleTime: Infinity });
}

export function useEntrarConsultor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, clave }: { email: string; clave: string }) =>
      entrarConsultor(email, clave),
    onSuccess: (consultor) => {
      limpiarDatosDeOtroUsuario(qc);
      qc.setQueryData(CLAVES.consultor, consultor);
    },
  });
}

export function useSalirConsultor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salirConsultor,
    onSuccess: () => {
      limpiarDatosDeOtroUsuario(qc);
      qc.setQueryData(CLAVES.consultor, null);
    },
  });
}

export function useTodasLasCitas(activo: boolean) {
  return useQuery({
    queryKey: CLAVES.todas,
    queryFn: obtenerTodasLasCitas,
    enabled: activo,
    staleTime: 15_000,
    refetchInterval: activo ? 60_000 : false,
  });
}

export function useCancelarComoConsultor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelarCita,
    onSuccess: (_, id) => {
      qc.setQueryData<Cita[]>(CLAVES.todas, (prev) =>
        prev?.map((c) => (c.id === id ? { ...c, estado: 'cancelada' } : c)),
      );
      qc.invalidateQueries({ queryKey: ['ocupados'] });
    },
  });
}
