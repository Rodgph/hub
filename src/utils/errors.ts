export interface AppError {
  type: 'network' | 'auth' | 'permission' | 'not_found' | 'validation' | 'server' | 'unknown'
  message: string
  technical?: string
}

export function mapSupabaseError(error: any): AppError {
  if (!error) return { type: 'unknown', message: 'Erro desconhecido' };

  if (error.code === 'PGRST301' || error.code === '401') {
    return { type: 'auth', message: 'Sessão expirada. Faça login novamente.', technical: error.message }
  }
  if (error.code === '42501') {
    return { type: 'permission', message: 'Você não tem permissão para esta ação.', technical: error.message }
  }
  if (error.message === 'Failed to fetch') {
    return { type: 'network', message: 'Sem conexão com o servidor.' }
  }
  return { type: 'unknown', message: 'Algo deu errado.', technical: error.message }
}
