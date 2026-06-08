import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { isSchemaMissingError } from '@/components/DatabaseSetupNotice';

const DEFAULT_SETTINGS = {
  venue_name: 'Stratford Bar',
  table_count: 40,
  admin_pin: '1234',
  setup_complete: false,
  floor_map: [],
  menu_items: [],
};

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (isSchemaMissingError(error)) {
        const err = new Error('DATABASE_NOT_SETUP');
        err.cause = error;
        throw err;
      }
      if (error) throw error;

      if (!data) {
        const { data: created, error: insertError } = await supabase
          .from('settings')
          .insert(DEFAULT_SETTINGS)
          .select()
          .single();
        if (insertError) throw insertError;
        return created;
      }

      if (!data.admin_pin) {
        const { data: updated, error: updateError } = await supabase
          .from('settings')
          .update({ admin_pin: '1234' })
          .eq('id', data.id)
          .select()
          .single();
        if (updateError) throw updateError;
        return { ...updated, setup_complete: updated.setup_complete ?? false };
      }

      return { ...data, setup_complete: data.setup_complete ?? false };
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
