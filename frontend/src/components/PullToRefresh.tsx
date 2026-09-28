import React, { useState, useEffect, useRef } from "react";

interface Props {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: Props) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if we are at the top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || isRefreshing) return;

      const y = e.touches[0].clientY;
      const dy = y - startY.current;

      // Only care about pulling down
      if (dy > 0 && window.scrollY === 0) {
        // Prevent default scroll behavior while pulling down
        if (e.cancelable) e.preventDefault();
        
        // Add resistance (e.g. logarithmic)
        const resistance = Math.min(dy * 0.4, 80);
        setPullY(resistance);
      } else {
        pulling.current = false;
        setPullY(0);
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;

      // Trigger refresh if pulled far enough
      if (pullY > 60 && !isRefreshing) {
        setIsRefreshing(true);
        setPullY(50); // Hold it at a visible height while refreshing
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullY(0);
        }
      } else {
        // Snap back
        setPullY(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullY, isRefreshing, onRefresh]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        className="ptr-indicator"
        style={{
          height: `${pullY}px`,
          opacity: pullY > 10 ? 1 : 0,
        }}
      >
        <div className={`ptr-spinner ${isRefreshing ? "spin" : ""}`}>
          ↻
        </div>
        <div className="ptr-text">
          {isRefreshing ? "Syncing..." : pullY > 60 ? "Release to sync" : "Pull down to sync"}
        </div>
      </div>
      <div 
        className="ptr-content" 
        style={{ transform: `translateY(${pullY}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
