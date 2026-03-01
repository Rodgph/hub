# ERROR_HANDLING.md — Estratégia de Erros

> **ATENÇÃO PARA A IA:** Todo erro no app deve ser tratado. NUNCA deixar um `catch` vazio. NUNCA deixar um erro sem feedback para o usuário. NUNCA usar `console.error` como substituto de tratamento. Este documento define exatamente o que fazer com cada tipo de erro.

---

## PRINCÍPIOS

1. **Todo erro tem um dono** — cada camada trata o que é sua responsabilidade
2. **Erros de UI não derrubam o app** — Error Boundaries por módulo
3. **Erros de rede têm retry** — via offline queue (ver PATTERNS.md)
4. **Erros mostram feedback útil** — mensagem que o usuário entende, não stack trace
5. **Erros são logados** — para debugging, mas nunca expostos ao usuário

---

## CAMADAS DE TRATAMENTO

```
Erro acontece
    ↓
1. Service Layer (supabase/R2) → trata erros de rede e auth
    ↓
2. Store Layer (Zustand) → trata erros de negócio, optimistic rollback
    ↓
3. Hook Layer → transforma erros em estado
    ↓
4. Component Layer → exibe feedback (toast, empty state, erro inline)
    ↓
5. Error Boundary → captura erros inesperados que passaram por tudo acima
```

---

## 1. SERVICE LAYER — Erros do Supabase

```ts
// Em: src/services/message.service.ts
// Padrão para TODOS os services

import { supabase } from '@/config/supabase'
import type { Message } from '@/types/message.types'

// Tipo de retorno padronizado — NUNCA lançar exceções nos services
// Sempre retornar { data, error }
type ServiceResult<T> = { data: T; error: null } | { data: null; error: AppError }

export const messageService = {
  async send(
    conversationId: string,
    content: string
  ): Promise<ServiceResult<Message>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, content, sender_id: supabase.auth.getUser() })
        .select()
        .single()

      if (error) {
        return { data: null, error: mapSupabaseError(error) }
      }

      return { data, error: null }

    } catch (err) {
      // Erro de rede (sem conexão, timeout)
      return { data: null, error: { type: 'network', message: 'Sem conexão com o servidor' } }
    }
  }
}
```

### Mapeamento de erros do Supabase para mensagens do usuário

```ts
// Em: src/utils/errors.ts

export interface AppError {
  type: 'network' | 'auth' | 'permission' | 'not_found' | 'validation' | 'server' | 'unknown'
  message: string        // Mensagem para o usuário (em português)
  technical?: string     // Detalhes técnicos (para log, não para o usuário)
}

export function mapSupabaseError(error: { code?: string; message: string }): AppError {
  // Erros de autenticação
  if (error.code === 'PGRST301' || error.code === '401') {
    return { type: 'auth', message: 'Sessão expirada. Faça login novamente.', technical: error.message }
  }

  // Sem permissão (RLS bloqueou)
  if (error.code === '42501' || error.code === 'PGRST116') {
    return { type: 'permission', message: 'Você não tem permissão para esta ação.', technical: error.message }
  }

  // Registro não encontrado
  if (error.code === 'PGRST116') {
    return { type: 'not_found', message: 'Conteúdo não encontrado.', technical: error.message }
  }

  // Violação de constraint (único, FK)
  if (error.code === '23505') {
    return { type: 'validation', message: 'Este item já existe.', technical: error.message }
  }

  // Erro genérico do servidor
  return { type: 'server', message: 'Algo deu errado. Tente novamente.', technical: error.message }
}

// Log de erros (nunca expor ao usuário)
export function logError(context: string, error: AppError | Error): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error)
  }
  // Em produção: enviar para serviço de monitoramento (Sentry, etc.)
  // Por enquanto apenas suprimir em produção
}
```

---

## 2. STORE LAYER — Erros de negócio

```ts
// Em: src/store/modules/chat.store.ts
// Padrão de tratamento de erro no store

sendMessage: async (conversationId, content) => {
  const tempId = `temp_${crypto.randomUUID()}`

  // Optimistic update (ver PATTERNS.md)
  set(state => ({
    messages: [...state.messages, { id: tempId, content, status: 'sending' }]
  }))

  const { data, error } = await messageService.send(conversationId, content)

  if (error) {
    // Rollback do optimistic update
    set(state => ({
      messages: state.messages.map(m =>
        m.id === tempId ? { ...m, status: 'failed' } : m
      )
    }))

    // Log técnico
    logError('chat.store.sendMessage', error)

    // Se for erro de rede, adicionar à fila offline
    if (error.type === 'network') {
      useOfflineStore.getState().addToQueue({
        type: 'send_message',
        payload: { conversationId, content }
      })
      toast.warning('Sem conexão — mensagem será enviada quando reconectar')
      return
    }

    // Se for erro de auth, redirecionar para login
    if (error.type === 'auth') {
      useAuthStore.getState().logout()
      return
    }

    // Outros erros: mostrar toast
    toast.error(error.message)
    return
  }

  // Sucesso: substituir temp pelo real
  set(state => ({
    messages: state.messages.map(m =>
      m.id === tempId ? { ...data, status: 'sent' } : m
    )
  }))
}
```

---

## 3. ERROR BOUNDARIES — Erros de renderização React

```tsx
// Em: src/components/shared/ModuleErrorBoundary/ModuleErrorBoundary.tsx
// Envolve cada módulo para isolar crashes

import { Component, ReactNode, ErrorInfo } from 'react'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { logError } from '@/utils/errors'

interface Props {
  moduleId: string
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(`ModuleErrorBoundary[${this.props.moduleId}]`, error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyState
          icon="⚠️"
          title="Este módulo encontrou um erro"
          description="O resto do app continua funcionando normalmente"
          action={{ label: 'Tentar novamente', onClick: this.handleRetry }}
        />
      )
    }

    return this.props.children
  }
}
```

```tsx
// Usar em LayoutNode.tsx ao renderizar cada módulo
// NUNCA colocar apenas um Error Boundary para o app inteiro

<ModuleErrorBoundary moduleId={node.moduleId}>
  <ModuleWrapper moduleId={node.moduleId}>
    <DynamicModule moduleId={node.moduleId} />
  </ModuleWrapper>
</ModuleErrorBoundary>
```

---

## 4. TAURI COMMAND ERRORS — Erros do Rust

```ts
// Em: src/hooks/useHardware.ts
// Padrão para invoke() do Tauri

import { invoke } from '@tauri-apps/api/core'

export function useHardware() {
  const { setCpu, setGpu, setRam, setNetwork } = useHardwareStore()

  useEffect(() => {
    const poll = async () => {
      // Cada command tem seu próprio try/catch
      // Falha em um NÃO impede os outros de rodar

      try {
        const cpu = await invoke<number>('get_cpu_usage')
        setCpu(cpu)
      } catch (err) {
        // Hardware command falhou — manter último valor conhecido
        // NÃO mostrar toast (polling falha às vezes, não é crítico)
        logError('useHardware.getCpu', err as Error)
      }

      try {
        const gpu = await invoke<number>('get_gpu_usage')
        setGpu(gpu)
      } catch (err) {
        logError('useHardware.getGpu', err as Error)
      }

      // ... demais commands
    }

    const interval = setInterval(poll, HARDWARE_POLL_INTERVAL_MS)
    poll() // Primeira chamada imediata

    return () => clearInterval(interval)
  }, [])
}
```

```rust
// Padrão no Rust — todos os commands retornam Result<T, String>
// NUNCA usar unwrap() em commands — pode causar panic e matar o processo

#[tauri::command]
pub fn get_cpu_usage() -> Result<f32, String> {
    let mut system = sysinfo::System::new();
    system.refresh_cpu_all();

    let usage = system.global_cpu_usage();
    Ok(usage)
    // Se algo falhar internamente, retornar Err("mensagem descritiva")
    // O frontend receberá o Err como exception no invoke()
}
```

---

## 5. ERROS DE AUTH — Sessão expirada

```ts
// Em: src/config/supabase.ts
// Interceptor global para erros de auth

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Limpar estado e redirecionar para login
    useAuthStore.getState().clearSession()
    toast.info('Sua sessão expirou. Faça login novamente.')
  }
})
```

---

## 6. ERROS DE REDE — Estratégia completa

| Situação | Ação |
|---|---|
| Mutation offline (enviar msg, reagir) | Adicionar à fila offline + toast warning |
| Query offline (carregar msgs, feed) | Servir cache local + banner offline |
| Reconexão | Flush da fila + recarregar dados desatualizados |
| Ação na fila falha 3x | Descartar + toast error explicando |
| Ação na fila com 24h+ | Descartar silenciosamente |

---

## 7. ERROS DE UPLOAD (R2)

```ts
// Em: src/services/storage.service.ts

export async function uploadFile(
  path: string,
  file: File
): Promise<ServiceResult<string>> {
  // Validar tamanho antes de tentar upload
  const maxSize = getMaxSizeForPath(path)
  if (file.size > maxSize) {
    return {
      data: null,
      error: {
        type: 'validation',
        message: `Arquivo muito grande. Máximo: ${formatBytes(maxSize)}`
      }
    }
  }

  try {
    // Tentar upload
    const url = await uploadToR2(path, file, file.type)
    return { data: url, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        type: 'network',
        message: 'Falha ao enviar arquivo. Verifique sua conexão.',
        technical: String(err)
      }
    }
  }
}
```

---

## TABELA DE ERROS — O que mostrar para o usuário

| Tipo de erro | Toast | Ação automática |
|---|---|---|
| Rede (sem conexão) | "Sem conexão — ação salva para depois" (warning) | Adicionar à fila offline |
| Auth expirada | "Sessão expirada. Faça login novamente." (info) | Redirecionar para login |
| Sem permissão | "Você não tem permissão para esta ação." (error) | Nenhuma |
| Não encontrado | "Conteúdo não encontrado." (error) | Nenhuma |
| Validação (arquivo grande) | "Arquivo muito grande. Máximo: X MB." (error) | Nenhuma |
| Erro do servidor (5xx) | "Algo deu errado. Tente novamente." (error) | Nenhuma |
| Módulo crashou (React) | EmptyState com botão "Tentar novamente" | Nenhuma |
| Command Rust falhou | Nenhum (silencioso para hardware polling) | Manter último valor |

---

## O QUE NUNCA FAZER

```ts
// ❌ catch vazio
try {
  await sendMessage()
} catch {}

// ❌ console.error como tratamento
try {
  await sendMessage()
} catch (err) {
  console.error(err) // Isso não é tratamento
}

// ❌ Expor mensagem técnica ao usuário
toast.error(error.message) // error.message pode ser "violates foreign key constraint"

// ❌ Deixar estado inconsistente após erro
set({ messages: [...messages, tempMessage] })
await sendMessage() // se falhar, tempMessage fica para sempre no estado

// ❌ Múltiplos toasts para o mesmo erro
// (acontece quando o mesmo erro dispara em vários lugares)
// Solução: tratar no store, não nos componentes
```
