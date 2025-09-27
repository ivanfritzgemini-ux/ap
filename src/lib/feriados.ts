// Feriados chilenos por año
export const feriadosPorAño: Record<string, Record<string, string>> = {
  '2024': {
    '2024-01-01': 'Año Nuevo',
    '2024-03-29': 'Viernes Santo',
    '2024-03-30': 'Sábado Santo',
    '2024-05-01': 'Día del Trabajador',
    '2024-05-21': 'Día de las Glorias Navales',
    '2024-06-29': 'San Pedro y San Pablo',
    '2024-07-16': 'Día de la Virgen del Carmen',
    '2024-08-15': 'Asunción de la Virgen',
    '2024-09-18': 'Fiestas Patrias',
    '2024-09-19': 'Glorias del Ejército',
    '2024-10-12': 'Encuentro de Dos Mundos',
    '2024-10-31': 'Día de las Iglesias Evangélicas',
    '2024-11-01': 'Día de Todos los Santos',
    '2024-12-08': 'Inmaculada Concepción',
    '2024-12-25': 'Navidad'
  },
  '2025': {
    '2025-01-01': 'Año Nuevo',
    '2025-04-18': 'Viernes Santo',
    '2025-04-19': 'Sábado Santo',
    '2025-05-01': 'Día del Trabajador',
    '2025-05-21': 'Día de las Glorias Navales',
    '2025-06-29': 'San Pedro y San Pablo',
    '2025-07-16': 'Día de la Virgen del Carmen',
    '2025-08-15': 'Asunción de la Virgen',
    '2025-09-18': 'Fiestas Patrias',
    '2025-09-19': 'Glorias del Ejército',
    '2025-10-12': 'Encuentro de Dos Mundos',
    '2025-10-31': 'Día de las Iglesias Evangélicas',
    '2025-11-01': 'Día de Todos los Santos',
    '2025-12-08': 'Inmaculada Concepción',
    '2025-12-25': 'Navidad'
  },
  '2026': {
    '2026-01-01': 'Año Nuevo',
    '2026-04-03': 'Viernes Santo',
    '2026-04-04': 'Sábado Santo',
    '2026-05-01': 'Día del Trabajador',
    '2026-05-21': 'Día de las Glorias Navales',
    '2026-06-29': 'San Pedro y San Pablo',
    '2026-07-16': 'Día de la Virgen del Carmen',
    '2026-08-15': 'Asunción de la Virgen',
    '2026-09-18': 'Fiestas Patrias',
    '2026-09-19': 'Glorias del Ejército',
    '2026-10-12': 'Encuentro de Dos Mundos',
    '2026-10-31': 'Día de las Iglesias Evangélicas',
    '2026-11-01': 'Día de Todos los Santos',
    '2026-12-08': 'Inmaculada Concepción',
    '2026-12-25': 'Navidad'
  }
}

// Función para obtener feriados del año seleccionado
export const getFeriadosDelAño = (año: string) => {
  return feriadosPorAño[año] || {}
}
