# ANIMATIONS.md — Sistema de Animações

> **ATENÇÃO PARA A IA:** Todas as animações do app usam CSS puro (transitions e keyframes). NUNCA usar framer-motion, react-spring, anime.js ou qualquer lib de animação JS. NUNCA animar com JavaScript setInterval/setTimeout manipulando estilos diretamente. Todo valor de duração e easing deve vir das variáveis CSS definidas aqui.

---

## VARIÁVEIS CSS — adicionar em tokens.css

```css
/* src/styles/tokens.css */

/* Durações */
--duration-instant:  100ms;   /* Feedback imediato: hover de botão, toggle */
--duration-fast:     150ms;   /* Micro-interações: drag handle reveal, badges */
--duration-normal:   200ms;   /* Padrão: abrir menus, trocar telas */
--duration-slow:     300ms;   /* Elementos maiores: modais, painéis laterais */
--duration-skeleton: 1500ms;  /* Pulse do skeleton — sempre este valor */

/* Easings */
--ease-out:   cubic-bezier(0.0, 0.0, 0.2, 1);  /* Elementos entrando na tela */
--ease-in:    cubic-bezier(0.4, 0.0, 1.0, 1);  /* Elementos saindo da tela */
--ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1);  /* Elementos que mudam de estado */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Efeito "mola" sutil — usar com moderação */
```

---

## O QUE ANIMA E O QUE NÃO ANIMA

### SEMPRE animar
- Drag handle reveal/hide → `height`, `opacity`, `transform`
- Abrir/fechar context menu → `opacity`, `transform: scale`
- Abrir/fechar toast → `transform: translateY`, `opacity`
- Hover em botões e cards → `background-color`, `opacity`
- Badge de não lidas aparecendo → `transform: scale`
- Trocar de tema → `background-color`, `color` (via transition no `:root`)
- Status de presença mudando → `background-color`
- Skeleton pulse → `opacity` (via keyframe)
- OfflineBanner aparecendo → `transform: translateY`
- FAB expandindo → `transform: rotate` no ícone, `opacity` nos itens
- Resize handle sendo arrastado → sem animação (deve ser instantâneo)
- Conteúdo do módulo quando handle revela → `transform: translateY`

### NUNCA animar
- Troca de módulo em painel (instantâneo — o usuário iniciou a ação)
- Scroll (nunca override de scroll behavior)
- Carregamento de imagens (fade-in opcional, mas nunca obrigatório)
- Resize de painel (instantâneo — segue o cursor)
- Texto digitado no input (nunca animar caracteres)
- Mensagens novas aparecendo no chat (só scroll, sem animação de entrada)

---

## ANIMAÇÕES ESPECÍFICAS

### Drag Handle Reveal
```css
/* DragHandle.module.css */
.handle {
  height: var(--drag-handle-height, 5px); /* usa constante do tokens */
  opacity: 0;
  transition:
    height var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.handle.revealed {
  height: 20px;
  opacity: 1;
}

/* Conteúdo do módulo desloca para baixo */
.moduleContent {
  transition: transform var(--duration-fast) var(--ease-out);
}

.moduleContent.shifted {
  transform: translateY(15px);
}
```

### Context Menu
```css
/* ContextMenu.module.css */
.menu {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
  transform-origin: top left; /* ou top right, depende da posição */
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
  pointer-events: none;
}

.menu.visible {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: all;
}
```

### Toast Notification
```css
/* Toast.module.css */
.toast {
  transform: translateY(100%);
  opacity: 0;
  transition:
    transform var(--duration-normal) var(--ease-out),
    opacity var(--duration-normal) var(--ease-out);
}

.toast.visible {
  transform: translateY(0);
  opacity: 1;
}

.toast.leaving {
  transform: translateX(110%);
  opacity: 0;
  transition:
    transform var(--duration-fast) var(--ease-in),
    opacity var(--duration-fast) var(--ease-in);
}
```

### Skeleton Pulse
```css
/* Skeleton.module.css */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.skeleton {
  background: var(--bg-module);
  animation: skeleton-pulse var(--duration-skeleton) ease-in-out infinite;
}
```

### FAB (Floating Action Button) expandindo
```css
/* FloatingActions.module.css */
.fab-icon {
  transition: transform var(--duration-fast) var(--ease-inout);
}

.fab-icon.open {
  transform: rotate(45deg);
}

.fab-item {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

/* Cada item tem delay diferente para efeito cascata */
.fab-item:nth-child(1) { transition-delay: 0ms; }
.fab-item:nth-child(2) { transition-delay: 40ms; }
.fab-item:nth-child(3) { transition-delay: 80ms; }

.fab-item.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

### Trocar de Tema (Dark ↔ Light)
```css
/* global.module.css */
/* Aplicar no :root para que TODOS os elementos herdem a transição */
:root {
  transition:
    background-color var(--duration-slow) var(--ease-inout),
    color var(--duration-slow) var(--ease-inout);
}
```

### OfflineBanner
```css
/* OfflineBanner.module.css */
.banner {
  transform: translateY(-100%);
  transition: transform var(--duration-normal) var(--ease-out);
}

.banner.visible {
  transform: translateY(0);
}
```

### Badge de não lidas (aparece/desaparece)
```css
/* Badge.module.css */
.badge {
  transform: scale(0);
  opacity: 0;
  transition:
    transform var(--duration-fast) var(--ease-spring),
    opacity var(--duration-fast) var(--ease-out);
}

.badge.visible {
  transform: scale(1);
  opacity: 1;
}
```

### Hover em botões
```css
/* Button.module.css */
.button {
  /* Apenas background — nunca animar transform em botões */
  transition: background-color var(--duration-instant) var(--ease-out);
}

.button:hover {
  background-color: rgba(var(--bg-module-rgb), 0.8);
}

.button:active {
  /* Active é instantâneo — sem transition */
  opacity: 0.7;
}
```

---

## REGRAS ABSOLUTAS

1. **Nunca usar `all` em transition** — especificar propriedades individuais
   ```css
   /* ❌ Errado */
   transition: all 0.2s ease;

   /* ✅ Correto */
   transition: opacity 0.2s ease, transform 0.2s ease;
   ```

2. **Nunca animar `width` ou `height` diretamente** — causa reflow, usar `transform: scaleX/Y` ou `max-height` com limitação
   ```css
   /* ❌ Evitar */
   transition: height 0.2s ease;

   /* ✅ Preferir */
   transition: transform 0.2s ease;
   ```

3. **Sempre animar `opacity` e `transform` juntos quando possível** — GPU-accelerated, sem reflow

4. **Duração máxima de qualquer animação de interação: 300ms** — acima disso o app parece lento

5. **Respeitar `prefers-reduced-motion`**
   ```css
   /* Em global.module.css */
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
