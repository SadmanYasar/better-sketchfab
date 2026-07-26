import type React from 'react';
import { useCallback, useRef } from 'react';
import { cn } from '#/lib/utils';

interface DualRangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  className?: string;
}

export const Slider: React.FC<DualRangeSliderProps> = ({
  min = 1,
  max = 500000,
  step = 1000,
  value = [1, 500000],
  onValueChange,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<'min' | 'max' | null>(null);

  const minVal = value[0] ?? min;
  const maxVal = value[1] ?? max;

  const minPercent = Math.min(100, Math.max(0, ((minVal - min) / (max - min)) * 100));
  const maxPercent = Math.min(100, Math.max(0, ((maxVal - min) / (max - min)) * 100));

  const getValueFromX = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return min;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const rawValue = min + percent * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.min(max, Math.max(min, steppedValue));
    },
    [min, max, step],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;

    containerRef.current.setPointerCapture(e.pointerId);

    const clickValue = getValueFromX(e.clientX);
    const distToMin = Math.abs(clickValue - minVal);
    const distToMax = Math.abs(clickValue - maxVal);

    // Pick closest thumb, default to min if equal or minVal is higher
    const targetThumb = distToMin <= distToMax ? 'min' : 'max';
    activeThumbRef.current = targetThumb;

    if (targetThumb === 'min') {
      const newMin = Math.min(clickValue, maxVal - step);
      onValueChange?.([newMin, maxVal]);
    } else {
      const newMax = Math.max(clickValue, minVal + step);
      onValueChange?.([minVal, newMax]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeThumbRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const currentValue = getValueFromX(e.clientX);

    if (activeThumbRef.current === 'min') {
      const newMin = Math.min(currentValue, maxVal - step);
      onValueChange?.([newMin, maxVal]);
    } else if (activeThumbRef.current === 'max') {
      const newMax = Math.max(currentValue, minVal + step);
      onValueChange?.([minVal, newMax]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activeThumbRef.current = null;
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        'relative w-full h-8 flex items-center select-none cursor-pointer touch-none',
        className,
      )}
    >
      {/* Track Background */}
      <div className="absolute w-full h-2 rounded-full bg-secondary overflow-hidden pointer-events-none">
        {/* Active Range Highlight Line */}
        <div
          className="absolute h-full bg-primary transition-all duration-75"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
      </div>

      {/* Min Thumb handle */}
      <div
        className="absolute size-4.5 rounded-full border-2 border-primary bg-background shadow-md pointer-events-none transition-all duration-75 -translate-x-1/2 z-20 hover:scale-110"
        style={{ left: `${minPercent}%` }}
      />

      {/* Max Thumb handle */}
      <div
        className="absolute size-4.5 rounded-full border-2 border-primary bg-background shadow-md pointer-events-none transition-all duration-75 -translate-x-1/2 z-20 hover:scale-110"
        style={{ left: `${maxPercent}%` }}
      />
    </div>
  );
};
