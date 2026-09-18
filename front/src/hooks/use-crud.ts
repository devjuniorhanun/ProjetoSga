import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CrudService<T> {
  getAll: () => Promise<T[]>;
  getById: (id: string) => Promise<T>;
  create: (payload: Omit<T, 'id'>) => Promise<T>;
  update: (id: string, payload: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export function useCrud<T extends { id: string }>(key: string, service: CrudService<T>) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [key],
    queryFn: service.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Omit<T, 'id'>) => service.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> }) => service.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    create: createMutation,
    update: updateMutation,
    remove: deleteMutation,
  };
}
