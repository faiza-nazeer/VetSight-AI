import { Link } from 'react-router-dom';

export function BrandMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#0F4C3A" />
      <path d="M8 32c7-12 15-18 24-18s17 6 24 18c-7 12-15 18-24 18S15 44 8 32z" fill="#F3F6F0" />
      <circle cx="32" cy="32" r="11" fill="#E0A526" />
      <path d="M32 40c0-6 1-9 5-12-1 5-1 8-5 12z" fill="#0F4C3A" />
      <path d="M32 40c0-5-1-8-5-10 1 4 1 7 5 10z" fill="#17624A" />
    </svg>
  );
}

export default function Brand({ to = '/', light, size }) {
  return (
    <Link to={to} aria-label="VetSight AI" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: light ? '#fff' : 'var(--green-900)' }}>
      {/* <BrandMark size={size} /> */}
      <span style={{ fontFamily: "'Bricolage Grotesque', 'Source Sans 3', sans-serif", fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.01em', direction: 'ltr' }}>VetSight AI</span>
    </Link>
  );
}
