import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  className?: string;
  children: ReactNode;
}

/**
 * A horizontally-scrolling container that also scrolls on a plain vertical mouse wheel while
 * hovered — native `overflow-x: auto` only responds to shift+wheel or a trackpad's horizontal
 * gesture. React's onWheel is passive by default, so preventDefault has to happen on a real DOM
 * listener instead.
 */
export function HScrollStrip({ className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (e.deltaY === 0 || el!.scrollWidth <= el!.clientWidth) return;
      el!.scrollLeft += e.deltaY;
      e.preventDefault();
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
