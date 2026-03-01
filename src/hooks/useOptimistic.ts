import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar estados otimistas.
 * Permite atualizar a UI instantaneamente e reverter caso a chamada ao servidor falhe.
 */
export function useOptimistic<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [pending, setPending] = useState(false);

  const applyUpdate = useCallback(async (
    updateFn: (current: T) => T,
    serverFn: () => Promise<any>
  ) => {
    const previousData = data;
    
    // 1. Atualização otimista imediata
    setData(current => updateFn(current));
    setPending(true);

    try {
      // 2. Tenta sincronizar com o servidor
      await serverFn();
    } catch (error) {
      // 3. Reverte em caso de erro
      setData(previousData);
      console.error('[Optimistic] Revertido devido a erro:', error);
    } finally {
      setPending(false);
    }
  }, [data]);

  return { data, applyUpdate, pending };
}
