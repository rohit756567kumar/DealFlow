// src/hooks/useIsMobile.js
// ─────────────────────────────────────────────────────────────────────────────
// Detects if the user is on a mobile screen (< 768px).
// Updates automatically when screen resizes or orientation changes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, [breakpoint]);

  return isMobile;
}
