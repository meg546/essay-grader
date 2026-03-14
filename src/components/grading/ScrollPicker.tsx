import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 36;

interface ScrollPickerProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function ScrollPicker({
  value,
  onChange,
  min = 1,
  max = 120,
  disabled = false,
}: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrollingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scrollToValue(v: number, behavior: ScrollBehavior = "smooth") {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: (v - min) * ITEM_HEIGHT, behavior });
  }

  // Sync scroll when value changes from outside (only if user is not scrolling)
  useEffect(() => {
    if (!userScrollingRef.current) {
      scrollToValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Initial scroll without animation
  useEffect(() => {
    scrollToValue(value, "instant" as ScrollBehavior);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;

    userScrollingRef.current = true;

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 150);

    const index = Math.round(el.scrollTop / ITEM_HEIGHT);
    const clamped = Math.min(max, Math.max(min, index + min));
    onChange(clamped);
  }

  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: ITEM_HEIGHT * 3,
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        overscrollBehavior: "none",
      }}
      className={cn(
        "relative w-full",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      {/* Top spacer */}
      <div style={{ height: ITEM_HEIGHT }} />

      {items.map((v) => {
        const isCenter = v === value;
        return (
          <div
            key={v}
            onClick={() => {
              if (!disabled) {
                onChange(v);
                scrollToValue(v);
              }
            }}
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: disabled ? "default" : "pointer",
              transition: "transform 150ms, opacity 150ms",
              transform: isCenter ? "scale(1.1)" : "scale(0.9)",
            }}
            className={cn(
              "text-sm select-none",
              isCenter
                ? "font-semibold text-foreground"
                : "text-muted-foreground/50"
            )}
          >
            {isCenter ? `${v} min` : v}
          </div>
        );
      })}

      {/* Bottom spacer */}
      <div style={{ height: ITEM_HEIGHT }} />
    </div>
  );
}
