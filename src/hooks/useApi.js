import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services';

export const useApi = () => {
  const queryClient = useQueryClient();

  // Generic query hook
  const useGenericQuery = (key, queryFn, options = {}) => {
    return useQuery({
      queryKey: key,
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      ...options,
    });
  };

  // Generic mutation hook
  const useGenericMutation = (mutationFn, options = {}) => {
    return useMutation({
      mutationFn,
      onSuccess: (...args) => {
        // Invalidate relevant queries on success
        queryClient.invalidateQueries();
        options.onSuccess?.(...args);
      },
      onError: (error, variables, context) => {
        console.error('Mutation error:', error);
        options.onError?.(error, variables, context);
      },
    });
  };

  // Specific hooks for common operations
  const useCalls = () => {
    return useGenericQuery(
      ['calls'],
      async () => {
        const { data, error } = await supabase
          .from('calls')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
      }
    );
  };

  const useCreateCall = () => {
    return useGenericMutation(async (callData) => {
      const { data, error } = await supabase
        .from('calls')
        .insert([callData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
  };

  const useUpdateCall = () => {
    return useGenericMutation(async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('calls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
  };

  const useDeleteCall = () => {
    return useGenericMutation(async (id) => {
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    });
  };

  return {
    useGenericQuery,
    useGenericMutation,
    useCalls,
    useCreateCall,
    useUpdateCall,
    useDeleteCall,
  };
};