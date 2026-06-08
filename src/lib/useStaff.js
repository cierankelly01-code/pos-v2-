import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export const STAFF_COLOURS = [
  '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444',
  '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export function useStaff({ role = null, activeOnly = true } = {}) {
  return useQuery({
    queryKey: ['staff', role, activeOnly],
    queryFn: async () => {
      let query = supabase.from('staff').select('*').order('name');
      if (activeOnly) query = query.eq('active', true);
      if (role) query = query.eq('role', role);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });
}

export function useStaffMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['staff'] });

  const createStaff = useMutation({
    mutationFn: async (staff) => {
      const { data, error } = await supabase.from('staff').insert(staff).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateStaff = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from('staff').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteStaff = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createStaff, updateStaff, deleteStaff };
}

export function getSessionStaff() {
  try {
    const raw = sessionStorage.getItem('pos_staff');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSessionStaff(staff) {
  sessionStorage.setItem('pos_staff', JSON.stringify(staff));
}

export function clearSessionStaff() {
  sessionStorage.removeItem('pos_staff');
}
