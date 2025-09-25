"use client";

import { useState, useEffect } from 'react';

interface EstablishmentLogoProps {
  className?: string;
  alt?: string;
  fallbackSrc?: string;
}

export function EstablishmentLogo({ 
  className = '', 
  alt = 'Logo del establecimiento',
  fallbackSrc = '/uploads/logos/polivalente-logo-c.png'
}: EstablishmentLogoProps) {
  const [logoSrc, setLogoSrc] = useState<string>(fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener el logo del establecimiento desde la API
    const fetchEstablishmentLogo = async () => {
      try {
        const response = await fetch('/api/establecimiento');
        if (response.ok) {
          const data = await response.json();
          if (data?.data?.logo) {
            setLogoSrc(data.data.logo);
          }
        }
      } catch (error) {
        console.error('Error fetching establishment logo:', error);
        // Usar el fallback si hay error
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstablishmentLogo();
  }, []);

  const handleError = () => {
    // Si falla cargar el logo, usar el fallback
    if (logoSrc !== fallbackSrc) {
      setLogoSrc(fallbackSrc);
    }
  };

  const base = 'object-contain w-auto transition-opacity duration-200';
  const loadingClass = isLoading ? 'opacity-50' : 'opacity-100';

  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={`${base} ${loadingClass} ${className}`}
      onError={handleError}
    />
  );
}

// Componente estático como fallback (para SSR y casos donde no necesitamos dinámico)
export default function Logo({ className = '', alt = 'Polivalente Digital' }: { className?: string; alt?: string }) {
  const base = 'object-contain w-auto';
  return (
    <img 
      src="/uploads/logos/polivalente-logo-c.png" 
      alt={alt} 
      className={`${base} ${className}`}
      onError={(e) => {
        // Si el archivo no existe, ocultar la imagen
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}