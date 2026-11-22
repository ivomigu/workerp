import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CONSULTOR } from '@/constants/consultor';
import { cancelarCita, crearCita, obtenerMisCitas, obtenerOcupados, type Cita } from '@/utils/api';
import { guardarCliente } from '@/utils/storage';

const CLAVES = {
  misCitas: ['mis-citas'] as const,
  ocupados: ['ocupados'] as const,
};

/** Horas ocupadas en los próximos días visibles. */
export function useOcupados() {
  return useQuery({
    queryKey: CLAVES.ocupados,
    queryFn: () => {
      const desde = new Date();
      const hasta = new Date(desde.getTime() + (CONSULTOR.diasVisibles + 1) * 86_400_000);
      return obtenerOcupados(desde, hasta);
    },
    staleTime: 30_000,
  });
}

export function useMisCitas() {
  return useQuery({ queryKey: CLAVES.misCitas, queryFn: obtenerMisCitas, staleTime: 30_000 });
}

export function useCrearCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crearCita,
    onSuccess: (cita) => {
      guardarCliente({ nombre: cita.nombre, telefono: cita.telefono, email: cita.email });
      qc.setQueryData<Cita[]>(CLAVES.misCitas, (prev) =>
        prev ? [...prev, cita].sort((a, b) => a.inicio.localeCompare(b.inicio)) : [cita],
      );
    },
    // Tanto si sale bien como si el horario ya estaba tomado, refresca la agenda.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CLAVES.ocupados });
      qc.invalidateQueries({ queryKey: CLAVES.misCitas });
    },
  });
}

export function useCancelarCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelarCita,
    onSuccess: (_, id) => {
      qc.setQueryData<Cita[]>(CLAVES.misCitas, (prev) =>
        prev?.map((c) => (c.id === id ? { ...c, estado: 'cancelada' } : c)),
      );
      qc.invalidateQueries({ queryKey: CLAVES.ocupados });
    },
  });
}
