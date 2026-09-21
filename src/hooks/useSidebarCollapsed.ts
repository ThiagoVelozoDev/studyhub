import { useCallback, useState } from "react";

const STORAGE_KEY = "studyhub:sidebarCollapsed";

export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  const setCollapsed = useCallback((next: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(next));
    setCollapsedState(next);
  }, []);

  return {
    collapsed,
    toggleCollapsed: () => setCollapsed(!collapsed),
  };
}
