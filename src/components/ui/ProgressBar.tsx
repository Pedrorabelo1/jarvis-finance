interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
}

export function ProgressBar({ value, color }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value));
  const autoColor = !color
    ? value > 90
      ? '#fb7185'
      : value > 70
      ? '#f59e0b'
      : '#34d399'
    : color;

  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${v}%`, backgroundColor: autoColor }}
      />
    </div>
  );
}
