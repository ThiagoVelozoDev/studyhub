export function JourneyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="250" cy="45" r="30" fill="#FDE68A" opacity={0.7} />
      <path
        d="M0 170 Q60 100 120 140 Q170 170 220 100 Q260 50 320 70 V200 H0 Z"
        fill="#C7D2FE"
        opacity={0.5}
      />
      <path
        d="M0 185 Q70 130 130 160 Q180 185 230 120 Q270 75 320 95 V200 H0 Z"
        fill="#A5B4FC"
        opacity={0.6}
      />
      <path
        d="M20 200 C 60 140, 90 140, 110 110 C 130 80, 150 80, 170 60 C 190 40, 210 40, 230 25"
        stroke="#E0E7FF"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 200 C 60 140, 90 140, 110 110 C 130 80, 150 80, 170 60 C 190 40, 210 40, 230 25"
        stroke="#818CF8"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
        fill="none"
      />
      <g transform="translate(214, 4) rotate(45)">
        <rect x="-8" y="-20" width="16" height="34" rx="8" fill="#5B5FFB" />
        <circle cx="0" cy="-10" r="4" fill="#E0E7FF" />
        <path d="M-8 8 L-14 22 L-2 14 Z" fill="#7B61FF" />
        <path d="M8 8 L14 22 L2 14 Z" fill="#7B61FF" />
        <path d="M-4 14 L0 26 L4 14 Z" fill="#F59E0B" />
      </g>
    </svg>
  );
}
