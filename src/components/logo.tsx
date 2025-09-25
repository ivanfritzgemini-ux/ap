export default function Logo({ className = '', alt = 'Polivalente Digital' }: { className?: string; alt?: string }) {
  const base = 'object-contain w-auto';
  return (
    <img src="/uploads/logos/polivalente-logo-c.png" alt={alt} className={`${base} ${className}`} />
  );
}
