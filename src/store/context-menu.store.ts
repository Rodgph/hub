import { create } from 'zustand';

export interface MenuItem {
  id: string;
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  isSeparator?: boolean;
  isDestructive?: boolean;
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  items: MenuItem[];
  open: (x: number, y: number, items: MenuItem[]) => void;
  close: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  position: { x: 0, y: 0 },
  items: [],
  open: (x, y, items) => set({ isOpen: true, position: { x, y }, items }),
  close: () => set({ isOpen: false, items: [] }),
}));
