interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * JARVIS Finance brand logo — cascade of white ellipses arranged diagonally,
 * replicating the butterfly/petal bubble design.
 */
export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Large oval — top left */}
      <ellipse
        cx="35"
        cy="32"
        rx="17"
        ry="25"
        fill="white"
        fillOpacity="0.92"
        transform="rotate(-28 35 32)"
        filter="url(#glow)"
      />
      {/* Medium oval — top right */}
      <ellipse
        cx="62"
        cy="36"
        rx="10"
        ry="16"
        fill="white"
        fillOpacity="0.88"
        transform="rotate(-20 62 36)"
        filter="url(#glow)"
      />
      {/* Medium oval — middle left */}
      <ellipse
        cx="31"
        cy="60"
        rx="15"
        ry="21"
        fill="white"
        fillOpacity="0.88"
        transform="rotate(-25 31 60)"
        filter="url(#glow)"
      />
      {/* Small oval — middle center */}
      <ellipse
        cx="54"
        cy="57"
        rx="8"
        ry="12"
        fill="white"
        fillOpacity="0.84"
        transform="rotate(-20 54 57)"
        filter="url(#glow)"
      />
      {/* Smaller oval — middle right */}
      <ellipse
        cx="68"
        cy="52"
        rx="5.5"
        ry="8.5"
        fill="white"
        fillOpacity="0.80"
        transform="rotate(-15 68 52)"
        filter="url(#glow)"
      />
      {/* Small oval — bottom left */}
      <ellipse
        cx="45"
        cy="72"
        rx="7"
        ry="10"
        fill="white"
        fillOpacity="0.78"
        transform="rotate(-22 45 72)"
        filter="url(#glow)"
      />
      {/* Tiny oval — bottom center */}
      <ellipse
        cx="60"
        cy="67"
        rx="4.5"
        ry="7"
        fill="white"
        fillOpacity="0.72"
        transform="rotate(-15 60 67)"
        filter="url(#glow)"
      />
      {/* Tinier oval — bottom right */}
      <ellipse
        cx="70"
        cy="63"
        rx="3"
        ry="5"
        fill="white"
        fillOpacity="0.65"
        transform="rotate(-10 70 63)"
        filter="url(#glow)"
      />

      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
