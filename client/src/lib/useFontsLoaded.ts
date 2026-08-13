import { useEffect, useState } from "react";

const FAMILIES = ['16px "Market Deco"', '16px "Futura Wizard"', '700 16px "Futura Wizard"', '800 16px "Futura Wizard Condensed"'];

export function useFontsLoaded(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(FAMILIES.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
