import React, { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import styles from "./BrowserView.module.css";

type Props = {
  nodeId: string;
  url: string;
};

export const BrowserView: React.FC<Props> = ({ nodeId, url }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isTauri = !!(window as any).__TAURI_INTERNALS__;

  // Estado interno para controle de fluxo e anti-duplicação
  const createdRef = useRef(false);
  const lastSentRef = useRef<{ x: number; y: number; w: number; h: number; url: string } | null>(null);
  const rafRef = useRef<number | null>(null);
  const aliveRef = useRef(true);

  const canRun = isTauri && !!nodeId;

  const computeAndSend = async () => {
    if (!aliveRef.current || !canRun || !containerRef.current || !url) return;

    const rect = containerRef.current.getBoundingClientRect();
    const appWindow = getCurrentWebviewWindow();
    
    // Pegar posição e escala em paralelo para máxima performance
    const [pos, scale] = await Promise.all([
      appWindow.outerPosition(),
      appWindow.scaleFactor()
    ]);

    // Cálculo pixel-perfect: pos.x já é físico, rect.left é lógico.
    const x = Math.round(pos.x + (rect.left * scale));
    const y = Math.round(pos.y + (rect.top * scale));
    const w = Math.round(rect.width * scale);
    const h = Math.round(rect.height * scale);

    console.log(`[BrowserView] BOUNDS (${nodeId}):`, { x, y, w, h, scale, windowPos: pos });

    // Evita chamadas redundantes ao backend
    const last = lastSentRef.current;
    if (last && last.x === x && last.y === y && last.w === w && last.h === h && last.url === url) {
      return;
    }

    lastSentRef.current = { x, y, w, h, url };

    try {
      // Se a URL mudou ou é a primeira vez, usamos create_browser_webview (que também navega)
      if (!createdRef.current || last?.url !== url) {
        await invoke("create_browser_webview", { nodeId, url, x, y, width: w, height: h });
        createdRef.current = true;
      } else {
        // Se mudou apenas o layout, usamos update_webview_bounds (mais leve)
        await invoke("update_webview_bounds", { nodeId, x, y, width: w, height: h });
      }
    } catch (e) {
      console.warn("[BrowserView] Sync failed:", e);
    }
  };

  const scheduleSync = () => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(async () => {
      rafRef.current = null;
      await computeAndSend();
    });
  };

  useEffect(() => {
    aliveRef.current = true;
    if (!canRun) return;

    // Sincronização inicial
    scheduleSync();

    // 1. Monitorar mudanças de tamanho do painel
    const ro = new ResizeObserver(() => scheduleSync());
    if (containerRef.current) ro.observe(containerRef.current);

    // 2. Monitorar movimento e redimensionamento da janela do app
    const appWindow = getCurrentWebviewWindow();
    let unlistenMoved: (() => void) | null = null;
    let unlistenResized: (() => void) | null = null;

    const bindEvents = async () => {
      try {
        unlistenMoved = await appWindow.onMoved(() => scheduleSync());
        unlistenResized = await appWindow.onResized(() => scheduleSync());
      } catch (e) {
        console.warn("[BrowserView] Failed to bind window events", e);
      }
    };
    bindEvents();

    return () => {
      aliveRef.current = false;
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (unlistenMoved) unlistenMoved();
      if (unlistenResized) unlistenResized();

      // Resetar estado local para remontagens futuras (ex: StrictMode)
      createdRef.current = false;
      lastSentRef.current = null;

      // Destruir WebView no Rust ao fechar o módulo
      invoke("destroy_webview", { nodeId }).catch(() => {});
    };
  }, [canRun, nodeId]);

  // Se a URL mudar, reagenda a sincronização
  useEffect(() => {
    if (canRun) scheduleSync();
  }, [url, canRun]);

  return (
    <div ref={containerRef} className={styles.container}>
      {isTauri ? (
        <div className={styles.nativePlaceholder}>
          <div className={styles.loader}>Acessando site via WebView Nativa...</div>
        </div>
      ) : (
        <div className={styles.nativePlaceholder}>
          <div>Execute no Tauri para usar o navegador nativo</div>
        </div>
      )}
    </div>
  );
};
