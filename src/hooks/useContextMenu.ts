import { useContextMenuStore, MenuItem } from '@/store/context-menu.store';

export function useContextMenu() {
  const { open, close } = useContextMenuStore();

  const openContextMenu = (e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    open(e.clientX, e.clientY, items);
  };

  return { openContextMenu, closeContextMenu: close };
}
