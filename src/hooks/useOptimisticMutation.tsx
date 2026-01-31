import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface OptimisticMutationOptions<T, R = void> {
  onMutate: (data: T) => Promise<R>;
  onSuccess?: (result: R, data: T) => void;
  onError?: (error: Error, data: T, rollback: () => void) => void;
  onSettled?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

interface MutationState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook for optimistic UI updates with automatic rollback on failure.
 * 
 * Usage:
 * ```tsx
 * const { mutate, isPending } = useOptimisticMutation({
 *   onMutate: async (data) => {
 *     // API call here
 *     await supabase.from('table').update(data);
 *   },
 *   successMessage: "Changes saved!",
 *   errorMessage: "Failed to save changes",
 * });
 * 
 * // For optimistic updates with rollback:
 * const handleUpdate = (newValue: string) => {
 *   const previousValue = currentValue;
 *   setCurrentValue(newValue); // Optimistic update
 *   
 *   mutate(newValue, {
 *     rollback: () => setCurrentValue(previousValue),
 *   });
 * };
 * ```
 */
export function useOptimisticMutation<T, R = void>(options: OptimisticMutationOptions<T, R>) {
  const { toast } = useToast();
  const [state, setState] = useState<MutationState>({
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  });
  
  // Store rollback function for the current mutation
  const rollbackRef = useRef<(() => void) | null>(null);
  
  const mutate = useCallback(
    async (data: T, mutationOptions?: { rollback?: () => void }) => {
      setState({ isPending: true, isSuccess: false, isError: false, error: null });
      rollbackRef.current = mutationOptions?.rollback || null;
      
      try {
        const result = await options.onMutate(data);
        
        setState({ isPending: false, isSuccess: true, isError: false, error: null });
        
        if (options.successMessage) {
          toast({ title: options.successMessage });
        }
        
        options.onSuccess?.(result, data);
        options.onSettled?.();
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        setState({ isPending: false, isSuccess: false, isError: true, error });
        
        // Execute rollback if provided
        const rollback = () => rollbackRef.current?.();
        rollback();
        
        if (options.errorMessage) {
          toast({
            title: options.errorMessage,
            description: error.message,
            variant: "destructive",
          });
        }
        
        options.onError?.(error, data, rollback);
        options.onSettled?.();
        
        throw error;
      }
    },
    [options, toast]
  );
  
  const reset = useCallback(() => {
    setState({ isPending: false, isSuccess: false, isError: false, error: null });
  }, []);
  
  return {
    mutate,
    mutateAsync: mutate,
    reset,
    ...state,
  };
}

/**
 * Simplified hook for optimistic list operations (add, update, delete)
 */
export function useOptimisticList<T extends { id: string }>(
  initialItems: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>
) {
  const { toast } = useToast();
  
  const optimisticAdd = useCallback(
    async (
      newItem: T,
      mutationFn: () => Promise<void>,
      options?: { successMessage?: string; errorMessage?: string }
    ) => {
      // Optimistic add
      setItems((prev) => [newItem, ...prev]);
      
      try {
        await mutationFn();
        if (options?.successMessage) {
          toast({ title: options.successMessage });
        }
      } catch (error) {
        // Rollback
        setItems((prev) => prev.filter((item) => item.id !== newItem.id));
        if (options?.errorMessage) {
          toast({
            title: options.errorMessage,
            description: error instanceof Error ? error.message : "An error occurred",
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    [setItems, toast]
  );
  
  const optimisticUpdate = useCallback(
    async (
      itemId: string,
      updates: Partial<T>,
      mutationFn: () => Promise<void>,
      options?: { successMessage?: string; errorMessage?: string }
    ) => {
      // Store previous state for rollback
      let previousItem: T | undefined;
      
      // Optimistic update
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            previousItem = item;
            return { ...item, ...updates };
          }
          return item;
        })
      );
      
      try {
        await mutationFn();
        if (options?.successMessage) {
          toast({ title: options.successMessage });
        }
      } catch (error) {
        // Rollback
        if (previousItem) {
          setItems((prev) =>
            prev.map((item) => (item.id === itemId ? previousItem! : item))
          );
        }
        if (options?.errorMessage) {
          toast({
            title: options.errorMessage,
            description: error instanceof Error ? error.message : "An error occurred",
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    [setItems, toast]
  );
  
  const optimisticDelete = useCallback(
    async (
      itemId: string,
      mutationFn: () => Promise<void>,
      options?: { successMessage?: string; errorMessage?: string }
    ) => {
      // Store for rollback
      let deletedItem: T | undefined;
      let deletedIndex: number = -1;
      
      // Optimistic delete
      setItems((prev) => {
        deletedIndex = prev.findIndex((item) => item.id === itemId);
        if (deletedIndex !== -1) {
          deletedItem = prev[deletedIndex];
        }
        return prev.filter((item) => item.id !== itemId);
      });
      
      try {
        await mutationFn();
        if (options?.successMessage) {
          toast({ title: options.successMessage });
        }
      } catch (error) {
        // Rollback
        if (deletedItem && deletedIndex !== -1) {
          setItems((prev) => {
            const newItems = [...prev];
            newItems.splice(deletedIndex, 0, deletedItem!);
            return newItems;
          });
        }
        if (options?.errorMessage) {
          toast({
            title: options.errorMessage,
            description: error instanceof Error ? error.message : "An error occurred",
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    [setItems, toast]
  );
  
  return {
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete,
  };
}
