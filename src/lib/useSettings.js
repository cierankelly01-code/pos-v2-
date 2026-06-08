import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { isSchemaMissingError } from '@/components/DatabaseSetupNotice';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (isSchemaMissingError(error)) {
        const err = new Error('DATABASE_NOT_SETUP');
        err.cause = error;
        throw err;
      }
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates) => {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('settings')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('settings')
        .insert(updates)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}
