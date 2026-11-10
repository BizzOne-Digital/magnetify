type Props = { className?: string };

export function FacebookIcon({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.4 19.5v-6.2h2.1l.3-2.5h-2.4V9.3c0-.7.2-1.2 1.2-1.2h1.3V5.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.8H8.7v2.5h2.1v6.2h2.6z"
      />
    </svg>
  );
}

export function TikTokIcon({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#000" />
      <path
        fill="#25F4EE"
        d="M10.2 10.6v-.8a5.4 5.4 0 0 0-.7 0 4.4 4.4 0 1 0 3.1 7.5 4.4 4.4 0 0 0 1.3-3.1V9.9a5.6 5.6 0 0 0 3.3 1V9.3a3.4 3.4 0 0 1-2.6-3.1h-1.6v8.2a2 2 0 1 1-2.8-1.8z"
        transform="translate(-0.6 -0.4)"
      />
      <path
        fill="#FE2C55"
        d="M10.2 10.6v-.8a5.4 5.4 0 0 0-.7 0 4.4 4.4 0 1 0 3.1 7.5 4.4 4.4 0 0 0 1.3-3.1V9.9a5.6 5.6 0 0 0 3.3 1V9.3a3.4 3.4 0 0 1-2.6-3.1h-1.6v8.2a2 2 0 1 1-2.8-1.8z"
        transform="translate(0.6 0.4)"
      />
      <path
        fill="#fff"
        d="M10.2 10.6v-.8a5.4 5.4 0 0 0-.7 0 4.4 4.4 0 1 0 3.1 7.5 4.4 4.4 0 0 0 1.3-3.1V9.9a5.6 5.6 0 0 0 3.3 1V9.3a3.4 3.4 0 0 1-2.6-3.1h-1.6v8.2a2 2 0 1 1-2.8-1.8z"
      />
    </svg>
  );
}

export function InstagramIcon({ className = "h-5 w-5" }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ig-grad" cx="0.3" cy="1.05" r="1.2">
          <stop offset="0" stopColor="#FFD776" />
          <stop offset="0.25" stopColor="#F3A554" />
          <stop offset="0.5" stopColor="#E1306C" />
          <stop offset="0.8" stopColor="#B32DB8" />
          <stop offset="1" stopColor="#5B4FE9" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
      <rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.2" cy="7.8" r="1" fill="#fff" />
    </svg>
  );
}
