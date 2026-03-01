GLOBAL_SEARCH.md — Janela Flutuante do Sistema

ATENÇÃO PARA A IA:
O Global Search é uma janela independente da main window.
NUNCA renderizar dentro de AppLayout.
NUNCA usar React Router.
NUNCA criar dinamicamente ao apertar atalho.
Ele deve existir desde o boot do app, apenas oculto.

1. ARQUITETURA

O Global Search é uma janela Tauri separada, com label: "search".

Ele não faz parte do layout tree, não pertence à main window e não é um overlay React.

Ele é um widget flutuante do sistema.

2. CRIAÇÃO DA JANELA
tauri.conf.json

A janela deve existir desde o startup.

{
  "label": "search",
  "title": "",
  "width": 680,
  "height": 500,
  "resizable": false,
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": false,
  "visible": false,
  "skipTaskbar": true,
  "shadow": true,
  "center": true
}
Regras obrigatórias

visible: false

skipTaskbar: true

decorations: false

transparent: true

alwaysOnTop: false no boot

3. INICIALIZAÇÃO NO BOOT

A janela search deve ser criada junto com o app.

Ela NÃO deve ser criada dinamicamente ao pressionar o atalho.

No setup() do Tauri:

Aplicar Mica/Acrylic

Não dar foco

Não mostrar

4. ESTRUTURA DO FRONTEND

A janela search deve renderizar exclusivamente:

src/layouts/SearchOverlay/SearchOverlay.tsx
src/components/shared/GlobalSearch/GlobalSearch.tsx

Estrutura:

<SearchOverlay>
  <GlobalSearch />
</SearchOverlay>

Nunca usar React Router.

5. STORE GLOBAL

Criar:

src/store/search.store.ts
src/hooks/useSearch.ts

O store controla:

query

resultados

loading

histórico recente

A UI do search vive apenas na window search.

6. ATALHO GLOBAL

Atalho obrigatório:

Ctrl + Alt + Space

Registrado via tauri-plugin-global-shortcut.

7. COMPORTAMENTO DO TOGGLE
Ao abrir

show()

unminimize()

set_always_on_top(true)

set_focus()

posicionar horizontalmente centralizado

posicionar top: 20px

focar automaticamente o input

Ao fechar

hide()

set_always_on_top(false)

8. POSICIONAMENTO

A janela deve abrir:

Centralizada horizontalmente

20px abaixo do topo da tela

Exemplo lógico:

x = (screen_width - window_width) / 2
y = 20

Nunca usar CSS para posicionamento da window.

Posicionamento é responsabilidade do backend.

9. FECHAMENTO AUTOMÁTICO

A janela deve fechar quando:

Usuário pressiona ESC

Usuário clica fora

Usuário troca de foco para outra janela

10. PROIBIDO

❌ Renderizar dentro de AppLayout
❌ Usar React Router para /search
❌ Criar dinamicamente via WebviewWindow::new no atalho
❌ Deixar alwaysOnTop ativo permanentemente
❌ Mostrar no boot
❌ Aparecer na taskbar
❌ Depender do layout tree

11. FASE DO PROJETO

O Global Search faz parte da FASE 0 — Fundação do Projeto.

Ele é infraestrutura do sistema, não feature de produto.

12. MOTIVO ARQUITETURAL

O Global Search é um componente de sistema:

Funciona independente do módulo ativo

Funciona mesmo se layout estiver quebrado

Funciona mesmo se usuário estiver offline

É equivalente ao Spotlight (macOS) ou PowerToys Run (Windows)

Por isso ele não pertence à main window.

13. RESUMO DEFINITIVO

✔ Janela separada
✔ Criada no boot
✔ Inicia oculta
✔ Toggle via atalho global
✔ Foco automático
✔ Top 20px
✔ Não usa router
✔ Não é overlay React
✔ Parte da Fase 0