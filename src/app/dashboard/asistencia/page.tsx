"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Save, Calendar, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface Curso {
  id: string
  nombre_curso: string
  tipo_ensenanza: string
  profesor_jefe: string
  alumnos: number
}

interface Estudiante {
  id: string
  name: string
  registration_number: string
  enrollment_date: string
  withdrawal_date?: string
}

interface DiaAsistencia {
  dia: number
  fecha: string
  diaSemana: string
  esFeriado: boolean
  esFinDeSemana: boolean
  esHabil: boolean
}

interface AsistenciaEstudiante {
  estudianteId: string
  asistencias: Record<number, boolean> // día -> presente/ausente
}

interface PeriodoAcademico {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
}

// Feriados chilenos por año
const feriadosPorAño: Record<string, Record<string, string>> = {
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
const getFeriadosDelAño = (año: string) => {
  return feriadosPorAño[año] || {}
}

const meses = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' }
]

export default function AsistenciaMensualPage() {
  const { toast } = useToast()
  
  const [cursos, setCursos] = useState<Curso[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [selectedMes, setSelectedMes] = useState<string>('') // No seleccionar mes por defecto
  const [selectedCurso, setSelectedCurso] = useState<string>('') // Inicialmente vacío, debe ser seleccionado por el usuario
  const [selectedAño, setSelectedAño] = useState<string>('2025') // Agregar año por defecto
  const [diasDelMes, setDiasDelMes] = useState<DiaAsistencia[]>([])
  const [asistencias, setAsistencias] = useState<Record<string, AsistenciaEstudiante>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  // Nuevo: estado para seguimiento de días con problemas de guardado
  const [diasConProblemas, setDiasConProblemas] = useState<Record<string, { 
    completitud: number,
    status: 'completo' | 'parcial' | 'incompleto' 
  }>>({})
  // Nuevo: estado para análisis de integridad de datos
  const [analisisIntegridad, setAnalisisIntegridad] = useState<any>(null)
  const [periodosAcademicos, setPeriodosAcademicos] = useState<PeriodoAcademico[]>([])
  
  // Estados para días bloqueados
  const [motivosBloqueos, setMotivosBloqueos] = useState<Record<string, {motivos: string[], resoluciones: string[]}>>({})
  const [loadingBloqueos, setLoadingBloqueos] = useState(false)

  // Función para obtener la fecha actual formateada
  const getFechaActualFormateada = () => {
    const hoy = new Date()
    const dia = hoy.getDate()
    const mes = hoy.getMonth() + 1
    const año = hoy.getFullYear()
    return `${dia} de ${meses.find(m => m.valor === mes)?.nombre || mes} de ${año}`
  }

  // Cargar cursos y periodos académicos al inicializar
  useEffect(() => {
    fetchCursos()
    fetchPeriodosAcademicos()
  }, [])

  // Ya no auto-seleccionamos un curso por defecto
  // El usuario debe seleccionar explícitamente un curso para ver los datos
  useEffect(() => {
    // No hacer nada cuando se cargan los cursos
    // La tabla se mostrará solo cuando el usuario seleccione un curso
    if (cursos.length > 0) {
      console.log('Cursos cargados. Por favor seleccione un curso para ver los datos de asistencia.')
    }
  }, [cursos])

  // Cargar estudiantes cuando se selecciona un curso, mes o año
  useEffect(() => {
    if (selectedCurso && selectedMes && selectedAño) {
      fetchEstudiantes()
      setAsistencias({})
    }
  }, [selectedCurso, selectedMes, selectedAño])

  // Calcular días del mes cuando se selecciona mes, año o curso (para incluir días bloqueados)
  useEffect(() => {
    if (selectedMes && selectedAño) {
      calcularDiasDelMes()
    }
  }, [selectedMes, selectedAño, selectedCurso])

  // Cargar asistencia existente cuando se selecciona curso y mes
  useEffect(() => {
    if (selectedCurso && selectedMes && estudiantes.length > 0) {
      cargarAsistenciaExistente()
    }
  }, [selectedCurso, selectedMes, estudiantes])
  
  // Verificar integridad de datos cuando se cambia de curso o mes
  useEffect(() => {
    if (selectedCurso && selectedMes && diasDelMes.length > 0) {
      // Usar false para no mostrar toast en la verificación automática inicial
      verificarIntegridadDatos(false);
    }
  }, [selectedCurso, selectedMes, diasDelMes.length])

  const fetchCursos = async () => {
    try {
      const response = await fetch('/api/cursos')
      const result = await response.json()
      if (result.data) {
        setCursos(result.data)
      }
    } catch (error) {
      console.error('Error fetching cursos:', error)
    }
  }

  const fetchPeriodosAcademicos = async () => {
    try {
      const response = await fetch('/api/periodos-academicos')
      const result = await response.json()
      if (result.data) {
        setPeriodosAcademicos(result.data)
      }
    } catch (error) {
      console.error('Error fetching periodos academicos:', error)
    }
  }

  const esDiaDeVacaciones = (fechaString: string) => {
    if (periodosAcademicos.length === 0) return false;

    const primerSemestre = periodosAcademicos.find(p => p.nombre.toLowerCase().includes('primer'));
    const segundoSemestre = periodosAcademicos.find(p => p.nombre.toLowerCase().includes('segundo'));

    if (!primerSemestre || !segundoSemestre) return false;

    const inicioPrimer = primerSemestre.fecha_inicio.slice(0, 10);
    const finPrimer = primerSemestre.fecha_fin.slice(0, 10);
    const inicioSegundo = segundoSemestre.fecha_inicio.slice(0, 10);
    const finSegundo = segundoSemestre.fecha_fin.slice(0, 10);

    if (fechaString >= inicioPrimer && fechaString <= finPrimer) return false;
    if (fechaString >= inicioSegundo && fechaString <= finSegundo) return false;

    return true;
  }

  const fetchEstudiantes = async () => {
    if (!selectedCurso) return
    
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/students-by-course?courseId=${selectedCurso}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}`)
      }
      
      if (result.data) {
        // Filtrar estudiantes según fecha de matrícula
        let estudiantesFiltrados = result.data
        
        if (selectedMes && selectedAño) {
          // Crear fecha límite: último día del mes seleccionado
          const añoSeleccionado = parseInt(selectedAño)
          const mesSeleccionado = parseInt(selectedMes)
          const ultimoDiaDelMes = new Date(añoSeleccionado, mesSeleccionado, 0) // día 0 = último día del mes anterior
          ultimoDiaDelMes.setHours(23, 59, 59, 999) // Hasta el final del día
          
          console.log('Fecha límite para filtrar estudiantes:', ultimoDiaDelMes.toISOString())
          
          estudiantesFiltrados = result.data.filter((estudiante: Estudiante) => {
            if (!estudiante.enrollment_date) {
              console.log(`⚠️ Estudiante ${estudiante.name} sin fecha de matrícula, se incluirá`)
              return true // Incluir estudiantes sin fecha de matrícula para evitar perder datos
            }
            
            const fechaMatricula = new Date(estudiante.enrollment_date)
            const estaMatriculadoEnElPeriodo = fechaMatricula <= ultimoDiaDelMes
            
            if (!estaMatriculadoEnElPeriodo) {
              console.log(`🚫 Estudiante ${estudiante.name} matriculado después del mes seleccionado (${fechaMatricula.toLocaleDateString()} > ${ultimoDiaDelMes.toLocaleDateString()})`)
            } else {
              console.log(`✅ Estudiante ${estudiante.name} incluido (matriculado el ${fechaMatricula.toLocaleDateString()})`)
            }
            
            return estaMatriculadoEnElPeriodo
          })
          
          console.log(`Filtro aplicado: ${result.data.length} estudiantes total → ${estudiantesFiltrados.length} estudiantes válidos para ${meses.find(m => m.valor.toString() === selectedMes)?.nombre} ${selectedAño}`)
        }
        
        setEstudiantes(estudiantesFiltrados)
        // Inicializar asistencias vacías
        const initialAsistencias: Record<string, AsistenciaEstudiante> = {}
        estudiantesFiltrados.forEach((estudiante: Estudiante) => {
          initialAsistencias[estudiante.id] = {
            estudianteId: estudiante.id,
            asistencias: {}
          }
        })
        setAsistencias(initialAsistencias)
      } else {
        setEstudiantes([])
        setAsistencias({})
      }
    } catch (error: any) {
      console.error('Error fetching estudiantes:', error)
      setError(`Error al cargar estudiantes: ${error.message}`)
      setEstudiantes([])
      setAsistencias({})
    } finally {
      setLoading(false)
    }
  }

  // Función para verificar si una fecha está dentro de los períodos académicos válidos
  const estaEnPeriodoAcademico = (fechaString: string) => {
    if (periodosAcademicos.length === 0) {
      // Fallback a períodos hardcodeados si no hay datos en la base
      const periodosAcademicos2025 = {
        primerSemestre: {
          inicio: '2025-03-05',
          fin: '2025-06-14'
        },
        segundoSemestre: {
          inicio: '2025-08-01',
          fin: '2025-12-20'
        }
      }
      
      const { primerSemestre, segundoSemestre } = periodosAcademicos2025
      
      return (fechaString >= primerSemestre.inicio && fechaString <= primerSemestre.fin) ||
             (fechaString >= segundoSemestre.inicio && fechaString <= segundoSemestre.fin)
    }

    // Usar períodos académicos de la base de datos
    return periodosAcademicos.some(periodo => 
      fechaString >= periodo.fecha_inicio && fechaString <= periodo.fecha_fin
    )
  }

  // Función para obtener detalles de días bloqueados
  const obtenerMotivosBloqueos = async (año: number, mes: number, diasEnMes: number) => {
    if (!selectedCurso) return {}
    
    setLoadingBloqueos(true)
    
    try {
      // Generar array de fechas del mes
      const fechasDelMes = Array.from({length: diasEnMes}, (_, i) => {
        const d = i + 1
        return `${año}-${mes.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
      })
      
      // Obtener detalles de días bloqueados
      const response = await fetch('/api/dias-bloqueados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_details',
          curso_id: selectedCurso,
          fechas: fechasDelMes
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        return result.detalles || {}
      }
    } catch (error) {
      console.error('Error obteniendo motivos de bloqueos:', error)
    } finally {
      setLoadingBloqueos(false)
    }
    
    return {}
  }

  const calcularDiasDelMes = async () => {
    if (!selectedMes) return

    const año = parseInt(selectedAño) // Usar selectedAño en lugar de hardcodear
    const mes = parseInt(selectedMes)
    const diasEnMes = new Date(año, mes, 0).getDate()
    
    // Obtener días bloqueados para el mes actual
    const primerDia = `${año}-${mes.toString().padStart(2, '0')}-01`
    const ultimoDia = `${año}-${mes.toString().padStart(2, '0')}-${diasEnMes.toString().padStart(2, '0')}`
    
    let diasBloqueados: Set<string> = new Set()
    
    try {
      // Verificar días bloqueados para el curso seleccionado
      if (selectedCurso) {
        const response = await fetch(`/api/dias-bloqueados/validar?cursoId=${selectedCurso}&fechas=${Array.from({length: diasEnMes}, (_, i) => {
          const d = i + 1
          return `${año}-${mes.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
        }).join(',')}`)
        
        if (response.ok) {
          const result = await response.json()
          if (result.validaciones) {
            Object.entries(result.validaciones).forEach(([fecha, validacion]: [string, any]) => {
              if (validacion.bloqueado) {
                diasBloqueados.add(fecha)
              }
            })
          }
        }
        
        // Obtener motivos de los bloqueos
        const motivos = await obtenerMotivosBloqueos(año, mes, diasEnMes)
        setMotivosBloqueos(motivos)
      } else {
        // Limpiar motivos si no hay curso seleccionado
        setMotivosBloqueos({})
      }
    } catch (error) {
      console.error('Error loading dias bloqueados:', error)
    }
    
    const dias: DiaAsistencia[] = []
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes - 1, dia)
      const fechaString = fecha.toISOString().split('T')[0] // YYYY-MM-DD
      const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado
      
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6
      const feriadosDelAño = getFeriadosDelAño(selectedAño)
      const esFeriadoOficial = feriadosDelAño[fechaString] !== undefined
      const esDiaBloqueado = diasBloqueados.has(fechaString)
      
      // NUEVA LÓGICA: Si no está en período académico, marcar como feriado
      const dentroDelPeriodoAcademico = estaEnPeriodoAcademico(fechaString)
      const esFeriado = esFeriadoOficial || !dentroDelPeriodoAcademico || esDiaBloqueado
      
      // Un día es hábil solo si: no es fin de semana, no es feriado oficial, está dentro del período académico, y no está bloqueado
      const esHabil = !esFinDeSemana && !esFeriadoOficial && dentroDelPeriodoAcademico && !esDiaBloqueado
      
      dias.push({
        dia,
        fecha: fechaString,
        diaSemana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemana],
        esFeriado,
        esFinDeSemana,
        esHabil
      })
    }
    
    setDiasDelMes(dias)
  }

  const cargarAsistenciaExistente = async (preservarEstadoActual = false) => {
    if (!selectedCurso || !selectedMes || estudiantes.length === 0) return

    try {
      console.log('Cargando asistencia existente...')
      console.log('Parámetros:', { selectedCurso, selectedMes, selectedAño })
      const response = await fetch(`/api/asistencia?cursoId=${selectedCurso}&mes=${selectedMes}&año=${selectedAño}`)
      const result = await response.json()

      console.log('Respuesta de la API:', result)
      console.log('URL consultada:', `/api/asistencia?cursoId=${selectedCurso}&mes=${selectedMes}&año=${selectedAño}`)
      console.log('Respuesta status:', response.status)
      console.log('Respuesta OK:', response.ok)

      if (!response.ok) {
        console.error('Error en la respuesta:', result)
        throw new Error(result.error || 'Error al cargar asistencia')
      }

      console.log('Datos recibidos:', result.data)
      console.log('Cantidad de registros:', result.data?.length || 0)

      if (result.data && result.data.length > 0) {
        console.log('✅ Datos encontrados:', result.data.length, 'registros')
        console.log('📋 Primer registro:', result.data[0])
        
        setAsistencias(prevAsistencias => {
          // Crear una copia profunda del estado anterior para no mutarlo directamente
          const nuevasAsistencias = JSON.parse(JSON.stringify(prevAsistencias));

          // Asegurarse de que todos los estudiantes tienen una entrada
          estudiantes.forEach(estudiante => {
            if (!nuevasAsistencias[estudiante.id]) {
              nuevasAsistencias[estudiante.id] = {
                estudianteId: estudiante.id,
                asistencias: {}
              };
            }
          });

          // Actualizar con los datos de la API
          result.data.forEach((registro: any) => {
            // Solución: Parsear la fecha como UTC para evitar problemas de zona horaria
            const fechaString = registro.fecha; // p.ej. "2023-09-22T05:00:00.000Z"
            const dia = parseInt(fechaString.split('T')[0].split('-')[2], 10);

            if (nuevasAsistencias[registro.estudiante_id]) {
              nuevasAsistencias[registro.estudiante_id].asistencias[dia] = registro.presente;
            }
          });

          console.log('✅ Asistencia actualizada (fusionada):', nuevasAsistencias);
          return nuevasAsistencias;
        });
        
        // Verificar la integridad de los datos cargados (sin mostrar toast)
        verificarIntegridadDatos(false);
      } else {
        console.log('⚠️ No se encontraron datos de asistencia para:', { selectedCurso, selectedMes, selectedAño })
        console.log('🔍 result.data:', result.data)
        
        // Si no hay datos existentes, inicializar con estructura vacía
        const initialAsistencias: Record<string, AsistenciaEstudiante> = {}
        estudiantes.forEach(estudiante => {
          initialAsistencias[estudiante.id] = {
            estudianteId: estudiante.id,
            asistencias: {}
          }
        })
        setAsistencias(initialAsistencias)
        
        // Limpiar días con problemas ya que no hay datos
        setDiasConProblemas({});
      }
    } catch (error: any) {
      console.error('Error cargando asistencia existente:', error)
      // En caso de error, inicializar con estructura vacía
      const initialAsistencias: Record<string, AsistenciaEstudiante> = {}
      estudiantes.forEach(estudiante => {
        initialAsistencias[estudiante.id] = {
          estudianteId: estudiante.id,
          asistencias: {}
        }
      })
      setAsistencias(initialAsistencias)
      
      // Limpiar días con problemas en caso de error
      setDiasConProblemas({});
    }
  }

  // Función para formatear el nombre del estudiante
  const formatearNombreEstudiante = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ')
    if (partes.length >= 2) {
      // Primer nombre y primer apellido
      return `${partes[0]} ${partes[1]}`
    }
    return nombreCompleto
  }

  // Función para verificar si una fecha está habilitada para marcar asistencia
  const esFechaHabilitada = (dia: number, mes: number) => {
    const fechaDia = new Date(parseInt(selectedAño), mes - 1, dia)
    const hoy = new Date() // Fecha actual del sistema
    hoy.setHours(23, 59, 59, 999) // Hasta el final del día de hoy
    
    // Verificar si la fecha es futura
    if (fechaDia > hoy) return false
    
    // Días específicos cerrados para edición
    const fechaString = `${selectedAño}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`
    
    // Verificar que esté dentro de los períodos académicos válidos
    const dentroDelPeriodoAcademico = estaEnPeriodoAcademico(fechaString)
    
    // Si no está en período académico, no está habilitado
    if (!dentroDelPeriodoAcademico) return false
    
    // 4 de marzo debe estar cerrado (aunque esté en período académico)
    if (fechaString === '2025-03-04') return false
    
    // Agregar más fechas cerradas aquí si es necesario
    const fechasCerradas = [
      '2025-03-04', // 4 de marzo específicamente mencionado
      // Puedes agregar más fechas aquí
    ]
    
    if (fechasCerradas.includes(fechaString)) return false
    
    return true
  }

  // Función para verificar si un estudiante estaba matriculado en una fecha específica
  const estudianteMatriculadoEnFecha = (estudiante: Estudiante, dia: number, mes: number) => {
    const fechaDia = new Date(parseInt(selectedAño), mes - 1, dia)
    
    // Fecha de ingreso
    const fechaIngreso = new Date(estudiante.enrollment_date)
    if (fechaDia < fechaIngreso) {
      return false // No estaba matriculado aún
    }
    
    // Fecha de retiro (si existe)
    if (estudiante.withdrawal_date) {
      const fechaRetiro = new Date(estudiante.withdrawal_date)
      if (fechaDia > fechaRetiro) {
        return false // Ya se había retirado
      }
    }
    
    return true // Estaba matriculado
  }

  // Función para verificar si un estudiante se retiró durante el mes actual o antes
  const estudianteYaRetirado = (estudiante: Estudiante) => {
    if (!estudiante.withdrawal_date) {
      return false; // No tiene fecha de retiro
    }
    
    const fechaRetiro = new Date(estudiante.withdrawal_date);
    const añoRetiro = fechaRetiro.getFullYear();
    const mesRetiro = fechaRetiro.getMonth() + 1; // getMonth() devuelve 0-11
    const añoActual = parseInt(selectedAño);
    const mesActual = parseInt(selectedMes);
    
    // Si se retiró en un año anterior, o en el mismo año pero en un mes anterior o igual
    return (añoRetiro < añoActual) || (añoRetiro === añoActual && mesRetiro <= mesActual);
  }

  const toggleAsistencia = (estudianteId: string, dia: number) => {
    console.log('toggleAsistencia llamado:', { estudianteId, dia, selectedMes, selectedAño })
    
    // Verificar si la fecha está habilitada para edición
    const fechaHabilitada = esFechaHabilitada(dia, parseInt(selectedMes))
    console.log('Fecha habilitada:', fechaHabilitada)
    
    if (!fechaHabilitada) {
      toast({
        title: "Fecha no habilitada",
        description: `Solo puede marcar asistencia hasta el ${getFechaActualFormateada()}`,
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    // Verificar si el estudiante estaba matriculado en esa fecha
    const estudiante = estudiantes.find(est => est.id === estudianteId)
    const matriculado = estudiante ? estudianteMatriculadoEnFecha(estudiante, dia, parseInt(selectedMes)) : false
    console.log('Estudiante matriculado:', matriculado)
    
    if (estudiante && !matriculado) {
      toast({
        title: "Estudiante no matriculado",
        description: "El estudiante no estaba matriculado en esta fecha",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    console.log('Marcando asistencia para:', { estudianteId, dia })
    console.log('Estado actual antes:', asistencias[estudianteId]?.asistencias[dia])

    setAsistencias(prev => {
      const nuevoEstado = {
        ...prev,
        [estudianteId]: {
          estudianteId: estudianteId,
          asistencias: {
            ...prev[estudianteId]?.asistencias,
            [dia]: !prev[estudianteId]?.asistencias[dia]
          }
        }
      }
      console.log('Nuevo estado:', nuevoEstado[estudianteId]?.asistencias[dia])
      return nuevoEstado
    })
  }

  // Función para seleccionar/deseleccionar toda una fila de estudiante
  const toggleFilaCompleta = (estudianteId: string) => {
    const estudiante = estudiantes.find(est => est.id === estudianteId)
    if (!estudiante) return

    // Obtener días hábiles donde el estudiante estuvo matriculado y la fecha está habilitada
    const diasValidosParaEstudiante = diasDelMes.filter(dia => 
      dia.esHabil && 
      esFechaHabilitada(dia.dia, parseInt(selectedMes)) &&
      estudianteMatriculadoEnFecha(estudiante, dia.dia, parseInt(selectedMes))
    )

    if (diasValidosParaEstudiante.length === 0) {
      toast({
        title: "Sin días válidos",
        description: "No hay días hábiles válidos para este estudiante",
        variant: "default",
        duration: 3000,
      })
      return
    }

    // Verificar si todos los días válidos ya están marcados como presentes
    const todosPresentes = diasValidosParaEstudiante.every(dia => 
      asistencias[estudianteId]?.asistencias[dia.dia] === true
    )

    // Si todos están presentes, marcar como ausentes. Si no, marcar todos como presentes
    const nuevoValor = !todosPresentes

    setAsistencias(prev => ({
      ...prev,
      [estudianteId]: {
        estudianteId: estudianteId,
        asistencias: {
          ...prev[estudianteId]?.asistencias,
          ...diasValidosParaEstudiante.reduce((acc, dia) => {
            acc[dia.dia] = nuevoValor
            return acc
          }, {} as Record<number, boolean>)
        }
      }
    }))

    toast({
      title: nuevoValor ? "Marcado como presente" : "Marcado como ausente",
      description: `${estudiante.name} - ${diasValidosParaEstudiante.length} día(s) ${nuevoValor ? 'presentes' : 'ausentes'}`,
      variant: "default",
      duration: 2000,
    })
  }

  // Función para seleccionar/deseleccionar toda una columna
  const toggleColumnaCompleta = (dia: number) => {
    // Verificar si la fecha está habilitada
    if (!esFechaHabilitada(dia, parseInt(selectedMes))) {
      return
    }

    // Obtener estudiantes que estaban matriculados ese día
    const estudiantesValidosParaDia = estudiantes.filter(estudiante => 
      estudianteMatriculadoEnFecha(estudiante, dia, parseInt(selectedMes))
    )

    if (estudiantesValidosParaDia.length === 0) {
      return
    }

    // Verificar si todos los estudiantes válidos ya están marcados como presentes
    const todosPresentes = estudiantesValidosParaDia.every(estudiante => 
      asistencias[estudiante.id]?.asistencias[dia] === true
    )

    // Si todos están presentes, desmarcar todos; si no, marcar todos como presentes
    const nuevoEstado = !todosPresentes

    setAsistencias(prev => {
      const nuevasAsistencias = { ...prev }
      
      estudiantesValidosParaDia.forEach(estudiante => {
        if (!nuevasAsistencias[estudiante.id]) {
          nuevasAsistencias[estudiante.id] = { estudianteId: estudiante.id, asistencias: {} }
        }
        nuevasAsistencias[estudiante.id] = {
          ...nuevasAsistencias[estudiante.id],
          asistencias: {
            ...nuevasAsistencias[estudiante.id].asistencias,
            [dia]: nuevoEstado
          }
        }
      })
      
      return nuevasAsistencias
    })
  }

  // Calcular estadísticas de asistencia
  const calcularEstadisticas = () => {
    const totalEstudiantes = estudiantes.length
    
    // Estadísticas por día
    const estadisticasPorDia = diasDelMes.filter(d => d.esHabil).map(dia => {
      // Solo contar estudiantes que estaban matriculados ese día
      const estudiantesMatriculados = estudiantes.filter(est => 
        estudianteMatriculadoEnFecha(est, dia.dia, parseInt(selectedMes))
      )
      
      const presentes = estudiantesMatriculados.filter(est => 
        asistencias[est.id]?.asistencias[dia.dia] === true
      ).length
      
      const totalMatriculadosDia = estudiantesMatriculados.length
      const ausentes = totalMatriculadosDia - presentes
      const porcentaje = totalMatriculadosDia > 0 ? (presentes / totalMatriculadosDia) * 100 : 0
      
      return {
        dia: dia.dia,
        presentes,
        ausentes,
        totalMatriculados: totalMatriculadosDia,
        porcentaje: Math.round(porcentaje) // Redondear a número entero
      }
    })
    
    // Estadísticas por estudiante
    const estadisticasPorEstudiante = estudiantes.map(estudiante => {
      // Solo considerar días hábiles donde el estudiante estaba matriculado
      const diasValidosParaEstudiante = diasDelMes.filter(d => 
        d.esHabil && estudianteMatriculadoEnFecha(estudiante, d.dia, parseInt(selectedMes))
      )
      
      const diasPresente = diasValidosParaEstudiante.filter(dia => 
        asistencias[estudiante.id]?.asistencias[dia.dia] === true
      ).length
      
      const porcentaje = diasValidosParaEstudiante.length > 0 ? 
        (diasPresente / diasValidosParaEstudiante.length) * 100 : 0
      
      return {
        estudianteId: estudiante.id,
        diasPresente,
        totalDias: diasValidosParaEstudiante.length,
        porcentaje: Math.round(porcentaje)
      }
    })
    
    return { estadisticasPorDia, estadisticasPorEstudiante, totalEstudiantes }
  }

  const handleSave = async () => {
    if (!selectedMes || !selectedCurso) {
      toast({
        title: "Selección Incompleta",
        description: "Debe seleccionar mes y curso",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    setSaving(true)
    try {
      // Preparar los datos de asistencia para enviar - SOLO CAMBIOS EXPLÍCITOS
      const asistenciasParaGuardar = []
      
      // Obtener días hábiles del mes para asegurarnos de registrar todos
      const diasHabiles = diasDelMes.filter(d => d.esHabil);
      console.log(`Analizando asistencia para ${diasHabiles.length} días hábiles del mes ${selectedMes}/${selectedAño}`)

      // Iterar sobre todos los estudiantes y sus asistencias
      for (const [estudianteId, datosEstudiante] of Object.entries(asistencias)) {
        const estudiante = estudiantes.find(est => est.id === estudianteId);
        if (!estudiante) continue;
        
        // SOLO procesar días que tienen valores explícitos en el estado
        if (datosEstudiante?.asistencias) {
          for (const [diaStr, presente] of Object.entries(datosEstudiante.asistencias)) {
            const dia = parseInt(diaStr);
            
            // Verificar que el día está en los días hábiles del mes
            const diaHabil = diasHabiles.find(d => d.dia === dia);
            if (!diaHabil) continue;
            
            // Verificar si el estudiante estaba matriculado ese día
            const matriculado = estudianteMatriculadoEnFecha(estudiante, dia, parseInt(selectedMes))
            if (!matriculado) continue;
            
            // Construir la fecha correctamente con pad
            const diaStrPadded = dia.toString().padStart(2, '0');
            const mesStr = selectedMes.toString().padStart(2, '0');
            const fecha = `${selectedAño}-${mesStr}-${diaStrPadded}`;
            
            // Solo agregar registros que tienen valores explícitos
            asistenciasParaGuardar.push({
              estudiante_id: estudianteId,
              curso_id: selectedCurso,
              fecha,
              presente: Boolean(presente)
            });
          }
        }
      }

      console.log('Guardando asistencias - SOLO CAMBIOS EXPLÍCITOS:', asistenciasParaGuardar)
      console.log('Parámetros actuales:', { selectedCurso, selectedMes, selectedAño })
      console.log('Estado completo de asistencias antes de guardar:', asistencias)

      if (asistenciasParaGuardar.length === 0) {
        toast({
          title: "Sin Cambios",
          description: "No hay registros de asistencia para guardar",
          variant: "default",
          duration: 3000,
        })
        setSaving(false)
        return
      }

      // Enviar a la API
      const totalRegistros = asistenciasParaGuardar.length;
      console.log(`Enviando ${totalRegistros} registros de asistencia al servidor...`);
      
      // Calcular métricas para mostrar al usuario
      const estudiantesAfectados = new Set(asistenciasParaGuardar.map(a => a.estudiante_id)).size;
      const diasAfectados = new Set(asistenciasParaGuardar.map(a => a.fecha)).size;
      
      // Crear un toast persistente que se actualizará con el progreso
      const toastId = toast({
        title: "Guardando asistencia...",
        description: `Preparando ${totalRegistros} registros (${estudiantesAfectados} estudiantes × ${diasAfectados} días)`,
        duration: 60000, // Duración larga para evitar que desaparezca durante el proceso
      });
      
      try {
        // Mostrar un mensaje modal para evitar que el usuario abandone la página
        // Esto es importante para grandes volúmenes de datos
        const modalMessage = document.createElement('div');
        modalMessage.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modalMessage.innerHTML = `
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 class="text-lg font-medium mb-2">Guardando asistencia...</h3>
            <p class="text-muted-foreground mb-4">Por favor no cierre esta página hasta que se complete el proceso.</p>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div id="progress-bar" class="bg-primary h-2.5 rounded-full" style="width: 5%"></div>
            </div>
            <p id="progress-text" class="text-xs text-center mt-2">Iniciando guardado...</p>
          </div>
        `;
        document.body.appendChild(modalMessage);
        
        // Función para actualizar el progreso
        const updateProgress = (percent: number, message: string) => {
          const progressBar = document.getElementById('progress-bar');
          const progressText = document.getElementById('progress-text');
          if (progressBar) progressBar.style.width = `${percent}%`;
          if (progressText) progressText.innerText = message;
          
          // Actualizar también el toast
          toast({
            id: toastId,
            title: "Guardando asistencia...",
            description: message,
            duration: 60000,
          });
        };
        
        // Enviar los datos al servidor
        updateProgress(10, "Enviando datos al servidor...");
        
        const response = await fetch('/api/asistencia/guardar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            asistencias: asistenciasParaGuardar
          })
        });
        
        updateProgress(70, "Procesando respuesta del servidor...");
        const result = await response.json();
        console.log('Respuesta del servidor:', result);

        if (!response.ok) {
          throw new Error(result.error || 'Error al guardar asistencia');
        }
        
        // Verificar si hubo registros fallidos
        if (result.total_fallidos > 0) {
          console.warn('Registros fallidos:', result.registros_fallidos);
          updateProgress(80, `Completado parcialmente. Detectados ${result.total_fallidos} registros fallidos. Reintentando...`);
          
          // NUEVO: Manejo específico de registros fallidos con reintento automático
          const fallidosPorFecha = result.fallidos_por_fecha || {};
          
          // Mostrar los días con problemas
          const diasConProblemas = Object.keys(fallidosPorFecha).sort();
          if (diasConProblemas.length > 0) {
            console.log('Días con problemas:', diasConProblemas);
            
            // Crear una lista de registros para reintentar
            const registrosParaReintentar = [];
            
            // Preparar registros específicos que fallaron para reintentar
            for (const fecha of diasConProblemas) {
              const registrosFecha = fallidosPorFecha[fecha];
              console.log(`Reintentando ${registrosFecha.length} registros para el día ${fecha}...`);
              
              for (const registro of registrosFecha) {
                // Buscar el registro original completo
                const registroOriginal = asistenciasParaGuardar.find(
                  r => r.estudiante_id === registro.estudiante_id && r.fecha === registro.fecha
                );
                
                if (registroOriginal) {
                  registrosParaReintentar.push(registroOriginal);
                }
              }
            }
            
            if (registrosParaReintentar.length > 0) {
              updateProgress(85, `Reintentando guardar ${registrosParaReintentar.length} registros fallidos...`);
              
              try {
                // Reintentar individualmente por día para maximizar probabilidad de éxito
                const fechasUnicas = [...new Set(registrosParaReintentar.map(r => r.fecha))];
                let registrosReintentadosExitosamente = 0;
                
                for (const fecha of fechasUnicas) {
                  const registrosDelDia = registrosParaReintentar.filter(r => r.fecha === fecha);
                  
                  // Reintentar en lotes más pequeños (5-10 registros a la vez)
                  for (let i = 0; i < registrosDelDia.length; i += 5) {
                    const lotePequeño = registrosDelDia.slice(i, i + 5);
                    
                    try {
                      const respuestaReintento = await fetch('/api/asistencia/guardar', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          asistencias: lotePequeño
                        })
                      });
                      
                      const resultadoReintento = await respuestaReintento.json();
                      
                      if (respuestaReintento.ok && resultadoReintento.total_exitosos > 0) {
                        registrosReintentadosExitosamente += resultadoReintento.total_exitosos;
                        updateProgress(
                          85 + (10 * registrosReintentadosExitosamente / registrosParaReintentar.length), 
                          `Recuperados ${registrosReintentadosExitosamente} de ${registrosParaReintentar.length} registros fallidos...`
                        );
                      }
                    } catch (err) {
                      console.error(`Error al reintentar lote para ${fecha}:`, err);
                    }
                    
                    // Breve pausa entre reintentos
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                }
                
                // Mensaje final de reintento
                if (registrosReintentadosExitosamente > 0) {
                  toast({
                    title: "Recuperación exitosa",
                    description: `Se recuperaron ${registrosReintentadosExitosamente} de ${registrosParaReintentar.length} registros fallidos.`,
                    variant: "default",
                    duration: 5000,
                  });
                } else {
                  toast({
                    title: "Recuperación fallida",
                    description: `No se pudieron recuperar los ${registrosParaReintentar.length} registros fallidos.`,
                    variant: "destructive",
                    duration: 5000,
                  });
                }
              } catch (errorReintento: any) {
                console.error('Error en el reintento:', errorReintento);
                toast({
                  title: "Error en recuperación",
                  description: `No se pudieron recuperar todos los registros fallidos: ${errorReintento.message}`,
                  variant: "destructive",
                  duration: 5000,
                });
              }
            }
          }
          
          updateProgress(95, `Guardado finalizado con ${result.total_exitosos} registros exitosos.`);
          
          toast({
            title: "Asistencia guardada parcialmente",
            description: `Se guardaron ${result.total_exitosos} registros de ${totalRegistros} totales.`,
            variant: "default",
            duration: 8000,
          });
        } else {
          // Todo el proceso fue exitoso
          updateProgress(100, "¡Guardado completado con éxito!");
          
          toast({
            title: "¡Asistencia Guardada!",
            description: `Se guardaron ${totalRegistros} registros correctamente.`,
            variant: "default",
            duration: 4000,
          });

          // Recargar la página después de un guardado exitoso
          setTimeout(() => {
            window.location.reload();
          }, 1500); // 1.5 segundos de retardo
        }
        
        // Eliminar el mensaje modal después de un momento
        setTimeout(() => {
          document.body.removeChild(modalMessage);
        }, 1500);
        
      } catch (error: any) {
        // Mostrar errores pero mantener el estado actual
        console.error('Error al guardar asistencia:', error);
        
        toast({
          title: "Error al Guardar",
          description: error.message || 'Error al guardar asistencia',
          variant: "destructive",
          duration: 8000,
        });
        
        // Eliminar el mensaje modal en caso de error
        const modalElement = document.querySelector('.fixed.inset-0.bg-black\\/50');
        if (modalElement) {
          document.body.removeChild(modalElement);
        }
        
        // No lanzar el error para permitir que el código continúe
        // y el usuario pueda intentar guardar nuevamente
        return;
      }
      
      // Esperar un momento para mostrar un feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));

      // CAMBIO: En lugar de recargar todo, solo verificar integridad
      // Esto evita sobrescribir el estado actual que puede estar correcto
      console.log('Verificando integridad de datos en lugar de recargar...');
      
      // NUEVO: Verificar integridad de datos después del guardado
      await verificarIntegridadDatos(false); // Sin mostrar toast para no spam al usuario
    } catch (error: any) {
      console.error('Error al guardar asistencia:', error)
      toast({
        title: "Error al Guardar",
        description: error.message || 'Error al guardar asistencia',
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }
  
  // NUEVA FUNCIÓN: Guardar solo días específicos (útil para corregir días con problemas)
  const guardarDiasEspecificos = async (fechas: string[]) => {
    if (!selectedMes || !selectedCurso || fechas.length === 0) {
      toast({
        title: "Error",
        description: "No se especificaron fechas para guardar o faltan datos de curso/mes",
        variant: "destructive",
        duration: 3000,
      })
      return;
    }
    
    setSaving(true);
    try {
      toast({
        title: "Guardando días específicos",
        description: `Preparando para guardar ${fechas.length} días con datos incompletos...`,
        duration: 5000,
      });
      
      // Preparar los datos de asistencia para enviar, filtrando solo para las fechas especificadas
      const asistenciasParaGuardar = [];
      
      // Para cada día específico, generar registros para todos los estudiantes matriculados
      for (const fechaCompleta of fechas) {
        // Convertir la fecha al formato que usa el componente
        const fecha = new Date(fechaCompleta);
        const dia = fecha.getDate();
        
        // Iterar sobre todos los estudiantes para este día específico
        for (const [estudianteId, datosEstudiante] of Object.entries(asistencias)) {
          const estudiante = estudiantes.find(est => est.id === estudianteId);
          if (!estudiante) continue;
          
          // Verificar si el estudiante estaba matriculado ese día
          const matriculado = estudianteMatriculadoEnFecha(estudiante, dia, parseInt(selectedMes));
          if (!matriculado) continue;
          
          // Obtener el valor de asistencia para este día (o false por defecto)
          const presente = datosEstudiante?.asistencias[dia] ?? false;
          
          // Agregar registro para guardar
          asistenciasParaGuardar.push({
            estudiante_id: estudianteId,
            curso_id: selectedCurso,
            fecha: fechaCompleta,
            presente: Boolean(presente)
          });
        }
      }
      
      console.log(`Guardando ${asistenciasParaGuardar.length} registros para ${fechas.length} días específicos:`);
      console.log('Días:', fechas);
      
      if (asistenciasParaGuardar.length === 0) {
        toast({
          title: "Sin datos para guardar",
          description: "No hay registros válidos para guardar en las fechas especificadas",
          variant: "default",
          duration: 3000,
        });
        setSaving(false);
        return;
      }
      
      // Mostrar un modal de progreso
      const modalMessage = document.createElement('div');
      modalMessage.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      modalMessage.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 class="text-lg font-medium mb-2">Guardando días específicos...</h3>
          <p class="text-muted-foreground mb-4">Guardando datos para ${fechas.length} días con un total de ${asistenciasParaGuardar.length} registros.</p>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div id="progress-bar" class="bg-primary h-2.5 rounded-full" style="width: 10%"></div>
          </div>
          <p id="progress-text" class="text-xs text-center mt-2">Enviando datos al servidor...</p>
        </div>
      `;
      document.body.appendChild(modalMessage);
      
      // Función para actualizar el progreso
      const updateProgress = (percent: number, message: string) => {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) progressText.innerText = message;
      };
      
      try {
        // Enviar los datos al servidor
        updateProgress(30, "Guardando registros...");
        
        const response = await fetch('/api/asistencia/guardar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            asistencias: asistenciasParaGuardar
          })
        });
        
        updateProgress(70, "Procesando respuesta...");
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Error al guardar asistencia');
        }
        
        // Verificar resultados
        updateProgress(90, "Verificando integridad de datos...");
        
        if (result.total_fallidos > 0) {
          updateProgress(95, `Completado con ${result.total_fallidos} errores.`);
          
          toast({
            title: "Guardado parcial",
            description: `Se guardaron ${result.total_exitosos} de ${asistenciasParaGuardar.length} registros.`,
            variant: "default",
            duration: 5000,
          });
        } else {
          updateProgress(100, "¡Guardado completado con éxito!");
          
          toast({
            title: "¡Días corregidos!",
            description: `Se guardaron correctamente ${result.total_exitosos} registros para ${fechas.length} días.`,
            variant: "default",
            duration: 4000,
          });
        }
        
        // Recargar asistencia y verificar integridad
        await cargarAsistenciaExistente();
        await verificarIntegridadDatos(false);
        
      } catch (error: any) {
        console.error("Error guardando días específicos:", error);
        
        toast({
          title: "Error al guardar",
          description: error.message || "Error al guardar los días específicos",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        // Cerrar el modal de progreso
        setTimeout(() => {
          document.body.removeChild(modalMessage);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error al guardar días específicos:', error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar los días para guardar",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // FUNCIÓN: Verificar la integridad de los datos después del guardado
  const verificarIntegridadDatos = async (mostrarToast = true) => {
    if (!selectedCurso || !selectedMes || !selectedAño) return null;
    
    try {
      console.log('Verificando integridad de datos después del guardado...');
      
      // Consultar el endpoint de análisis para verificar completitud
      const response = await fetch(
        `/api/asistencia/analisis?cursoId=${selectedCurso}&mes=${selectedMes}&año=${selectedAño}`
      );
      
      if (!response.ok) {
        throw new Error("Error al verificar integridad de datos");
      }
      
      const result = await response.json();
      console.log('Análisis de completitud post-guardado:', result);
      
      // Actualizar el estado de análisis de integridad
      setAnalisisIntegridad(result);
      
      // Crear un mapa de días con problemas para la interfaz
      const nuevosDiasConProblemas = {};
      result.completitudPorDia.forEach(dia => {
        if (dia.status !== 'completo') {
          nuevosDiasConProblemas[dia.fecha] = {
            completitud: dia.completitud,
            status: dia.status
          };
        }
      });
      
      // Actualizar el estado de días con problemas
      setDiasConProblemas(nuevosDiasConProblemas);
      
      // Identificar días con problemas
      const diasFaltantes = result.completitudPorDia.filter(d => d.status !== 'completo');
      
      if (diasFaltantes.length > 0 && mostrarToast) {
        console.warn('Después del guardado aún hay días incompletos:', diasFaltantes);
        
        // Solo mostrar una notificación si hay días con menos del 70% de completitud
        const diasCriticos = diasFaltantes.filter(d => d.completitud < 70);
        if (diasCriticos.length > 0) {
          const fechasCriticas = diasCriticos.map(d => d.fecha).join(', ');
          
          toast({
            title: "Atención: Datos incompletos",
            description: `Hay ${diasCriticos.length} días con registros incompletos: ${fechasCriticas}`,
            variant: "destructive",
            duration: 8000,
          });
        }
      } else {
        console.log('Integridad de datos verificada: Todos los días están completos.');
      }
      
      // Verificar días específicos que tienen problemas históricos (viernes)
      const viernes = result.completitudPorDia.filter(d => 
        new Date(d.fecha).getDay() === 5 // Viernes es 5
      );
      
      if (viernes.length > 0 && mostrarToast) {
        // Verificar si todos los viernes tienen buena completitud
        const viernesIncompletos = viernes.filter(v => v.completitud < 95);
        if (viernesIncompletos.length > 0) {
          console.warn('Hay viernes con datos incompletos:', viernesIncompletos);
          
          // Solo alertar si hay varios viernes con problemas
          if (viernesIncompletos.length >= 2 && viernesIncompletos.length === viernes.length) {
            toast({
              title: "Atención: Problema con viernes",
              description: `Todos los viernes del mes tienen datos incompletos. Revise estos días específicamente.`,
              variant: "destructive",
              duration: 8000,
            });
          }
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('Error verificando integridad post-guardado:', error);
      return null;
    }
  }

  // Solo mostrar tabla cuando se haya seleccionado un curso y esté cargada la información
  const canShowTable = selectedMes && selectedCurso && estudiantes.length > 0 && diasDelMes.length > 0

  return (
    <div className="w-full max-w-none py-6 space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asistencia Mensual</h1>
          <p className="text-muted-foreground">
            Registro de asistencia diaria por curso y mes
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Selectores */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Mes y Curso</CardTitle>
            <CardDescription>
              Elija el mes y curso para gestionar la asistencia. Solo se mostrarán estudiantes matriculados hasta el mes seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Año</label>
                <Select value={selectedAño} onValueChange={setSelectedAño}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mes</label>
                <Select value={selectedMes} onValueChange={setSelectedMes}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.valor} value={mes.valor.toString()}>
                        {mes.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Curso</label>
                <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.nombre_curso} - {curso.tipo_ensenanza}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del filtro aplicado */}
        {canShowTable && selectedMes && selectedAño && (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <strong>Filtro activo:</strong> Se muestran solo estudiantes matriculados hasta {meses.find(m => m.valor.toString() === selectedMes)?.nombre} {selectedAño}. 
              Los estudiantes matriculados después de esta fecha no aparecerán en el listado.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabla de Asistencia */}
        {canShowTable && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  Asistencia - {meses.find(m => m.valor.toString() === selectedMes)?.nombre} {selectedAño}
                </CardTitle>
                <CardDescription>
                  {estudiantes.length} estudiantes matriculados hasta {meses.find(m => m.valor.toString() === selectedMes)?.nombre} {selectedAño} - {diasDelMes.filter(d => d.esHabil).length} días hábiles
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="ml-4 bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Asistencia Completa'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table className="w-full min-w-fit">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 lg:w-32 sticky left-0 bg-background text-2xs">
                        Alumno
                      </TableHead>
                      {diasDelMes.map((dia) => {
                        // Obtener información de integridad para este día
                        const diaStr = dia.dia.toString().padStart(2, '0');
                        const mesStr = selectedMes.toString().padStart(2, '0');
                        const fechaFormateada = `${selectedAño}-${mesStr}-${diaStr}`;
                        
                        return (
                          <TableHead 
                            key={dia.dia} 
                            className={`text-center ${!dia.esHabil ? 'w-1.5' : 'w-2'} p-1 cursor-pointer hover:bg-muted/50 transition-colors duration-200 ${
                              !dia.esHabil ? 'bg-red-50 dark:bg-red-950' : ''
                            } ${
                              !esFechaHabilitada(dia.dia, parseInt(selectedMes)) && dia.esHabil 
                                ? 'bg-muted/50' 
                                : ''
                            }`}
                            onClick={() => dia.esHabil && esFechaHabilitada(dia.dia, parseInt(selectedMes)) && toggleColumnaCompleta(dia.dia)}
                            title={(dia.esHabil && esFechaHabilitada(dia.dia, parseInt(selectedMes)) 
                              ? `Marcar/desmarcar todos para el día ${dia.dia}` 
                              : undefined)
                            }
                          >
                            <div className="flex flex-col items-center space-y-0.5">
                              <span className="text-2xs">{dia.diaSemana.charAt(0)}</span>
                              <span className={`font-bold text-2xs ${
                                !esFechaHabilitada(dia.dia, parseInt(selectedMes)) && dia.esHabil 
                                  ? 'opacity-50' 
                                  : ''
                              }`}>
                                {dia.dia}
                              </span>
                              {!dia.esHabil && (
                                <X 
                                  className="h-2.5 w-2.5 text-red-500" 
                                  title={(() => {
                                    const fechaKey = `${selectedAño}-${selectedMes.toString().padStart(2, '0')}-${dia.dia.toString().padStart(2, '0')}`
                                    const motivoInfo = motivosBloqueos[fechaKey]
                                    if (motivoInfo) {
                                      return `Día bloqueado:\nMotivo: ${motivoInfo.motivos.join(', ')}\nResolución: ${motivoInfo.resoluciones.join(', ')}`
                                    }
                                    if (dia.esFeriado) {
                                      return 'Feriado nacional'
                                    }
                                    if (dia.esFinDeSemana) {
                                      return 'Fin de semana'
                                    }
                                    return 'Día no hábil'
                                  })()}
                                />
                              )}
                              {esFechaHabilitada(dia.dia, parseInt(selectedMes)) && dia.esHabil && (
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" 
                                title="Día hábil para asistencia"></div>
                              )}
                            </div>
                          </TableHead>
                        );
                      })}
                      <TableHead className="text-center w-10 p-1 bg-accent/20">
                        <div className="flex flex-col items-center">
                          <span className="text-2xs font-bold text-accent-foreground">%</span>
                          <span className="text-2xs text-accent-foreground">Asist.</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudiantes.map((estudiante, indice) => {
                      const { estadisticasPorEstudiante } = calcularEstadisticas()
                      const estadisticaEstudiante = estadisticasPorEstudiante.find(
                        est => est.estudianteId === estudiante.id
                      )
                      
                      return (
                        <TableRow key={estudiante.id} className="h-12">
                          <TableCell className="sticky left-0 bg-background border-r p-2">
                            <div className="flex items-center space-x-2">
                              <span 
                                className="text-2xs font-bold text-muted-foreground min-w-[1.5rem] cursor-pointer hover:text-primary hover:bg-muted/50 rounded px-1 py-0.5 transition-colors duration-200" 
                                onClick={() => toggleFilaCompleta(estudiante.id)}
                                title="Clic para marcar/desmarcar toda la fila"
                              >
                                {indice + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-2xs truncate" title={estudiante.name}>
                                  {/* Nombre completo en pantallas grandes, nombre corto en pequeñas */}
                                  <span className="hidden lg:inline">{estudiante.name}</span>
                                  <span className="lg:hidden">{formatearNombreEstudiante(estudiante.name)}</span>
                                  {estudianteYaRetirado(estudiante) && (
                                    <span className="ml-1 text-2xs text-red-500 font-bold">(Retirado)</span>
                                  )}
                                </div>
                                {estudianteYaRetirado(estudiante) && (
                                  <div className="text-2xs text-muted-foreground">
                                    {estudiante.withdrawal_date ? new Date(estudiante.withdrawal_date).toLocaleDateString() : 'Fecha no disponible'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          {diasDelMes.map((dia) => {
                            const estudianteMatriculado = estudianteMatriculadoEnFecha(estudiante, dia.dia, parseInt(selectedMes))
                            const fechaHabilitada = esFechaHabilitada(dia.dia, parseInt(selectedMes))
                            
                            return (
                              <TableCell 
                                key={dia.dia} 
                                className={`text-center p-1 ${!dia.esHabil ? 'w-1.5' : 'w-2'} ${
                                  !dia.esHabil ? 'bg-red-50 dark:bg-red-950' : ''
                                } ${
                                  !fechaHabilitada && dia.esHabil 
                                    ? 'bg-muted/30' 
                                    : ''
                                } ${
                                  !estudianteMatriculado && dia.esHabil
                                    ? 'bg-gray-100 dark:bg-gray-800'
                                    : ''
                                }`}
                              >
                                {dia.esHabil ? (
                                  estudianteMatriculado ? (
                                    <Checkbox
                                      checked={(() => {
                                        const valor = asistencias[estudiante.id]?.asistencias[dia.dia] || false
                                        if (dia.dia <= 5) { // Solo log para los primeros 5 días para evitar spam
                                          console.log(`🔍 Checkbox día ${dia.dia}, estudiante ${estudiante.name}: ${valor}`)
                                        }
                                        return valor
                                      })()}
                                      onCheckedChange={() => toggleAsistencia(estudiante.id, dia.dia)}
                                      disabled={!fechaHabilitada}
                                      className={`mx-auto h-3.5 w-3.5 ${
                                        !fechaHabilitada 
                                          ? 'opacity-50 cursor-not-allowed' 
                                          : ''
                                      }`}
                                    />
                                  ) : (
                                    <X className="h-3 w-3 text-blue-500 mx-auto" />
                                  )
                                ) : (
                                  <X className="h-3 w-3 text-red-500 mx-auto" />
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center p-1 bg-accent/10 font-medium text-2xs">
                            <Badge 
                              variant={estadisticaEstudiante && estadisticaEstudiante.porcentaje >= 85 ? 'default' : 'destructive'}
                              className="text-2xs px-1 py-0.5"
                            >
                              {Math.round(estadisticaEstudiante?.porcentaje || 0)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Filas de estadísticas */}
                    {(() => {
                      const { estadisticasPorDia, totalEstudiantes } = calcularEstadisticas()
                      const totalPresentes = estadisticasPorDia.reduce((sum, dia) => sum + dia.presentes, 0)
                      const totalAusentes = estadisticasPorDia.reduce((sum, dia) => sum + dia.ausentes, 0)
                      const totalDiasHabiles = estadisticasPorDia.length
                      
                      // Calcular el total esperado considerando solo estudiantes matriculados por día
                      const totalEsperado = estadisticasPorDia.reduce((sum, dia) => sum + dia.totalMatriculados, 0)
                      
                      // El promedio debe calcularse sobre el total esperado, no sobre todos los estudiantes
                      const promedioAsistencia = totalEsperado > 0 ? 
                        Math.round((totalPresentes / totalEsperado) * 1000) / 10 : 0

                      return (
                        <>
                          {/* Separador */}
                          <TableRow>
                            <TableCell colSpan={diasDelMes.length + 2} className="h-2 p-0 border-t-2 border-border"></TableCell>
                          </TableRow>

                          {/* Fila: Presentes */}
                          <TableRow className="bg-muted/50 font-medium">
                            <TableCell className="sticky left-0 bg-muted border-r text-2xs text-muted-foreground">
                              Presentes
                            </TableCell>
                            {diasDelMes.map((dia) => {
                              const estadisticaDia = estadisticasPorDia.find(est => est.dia === dia.dia)
                              return (
                                <TableCell 
                                  key={dia.dia} 
                                  className={`text-center text-2xs font-medium ${!dia.esHabil ? 'w-1.5' : 'w-2'} ${
                                    !dia.esHabil ? 'bg-red-50 dark:bg-red-950 text-muted-foreground' : 'text-foreground'
                                  }`}
                                >
                                  {dia.esHabil ? (estadisticaDia?.presentes || 0) : '-'}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center bg-muted font-semibold text-2xs">
                              {totalPresentes}
                            </TableCell>
                          </TableRow>

                          {/* Fila: Ausentes */}
                          <TableRow className="bg-muted/30 font-medium">
                            <TableCell className="sticky left-0 bg-muted/80 border-r text-2xs text-muted-foreground">
                              Ausentes
                            </TableCell>
                            {diasDelMes.map((dia) => {
                              const estadisticaDia = estadisticasPorDia.find(est => est.dia === dia.dia)
                              return (
                                <TableCell 
                                  key={dia.dia} 
                                  className={`text-center text-2xs font-medium ${!dia.esHabil ? 'w-1.5' : 'w-2'} ${
                                    !dia.esHabil ? 'bg-red-50 dark:bg-red-950 text-muted-foreground' : 'text-foreground'
                                  }`}
                                >
                                  {dia.esHabil ? (estadisticaDia?.ausentes || 0) : '-'}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center bg-muted/80 font-semibold text-2xs">
                              {totalAusentes}
                            </TableCell>
                          </TableRow>

                          {/* Fila: Total Matriculados */}
                          <TableRow className="bg-accent/20 font-medium">
                            <TableCell className="sticky left-0 bg-accent/30 border-r text-2xs text-accent-foreground">
                              Matriculados
                            </TableCell>
                            {diasDelMes.map((dia) => (
                              <TableCell 
                                key={dia.dia} 
                                className={`text-center text-2xs font-medium ${!dia.esHabil ? 'w-1.5' : 'w-2'} ${
                                  !dia.esHabil ? 'bg-red-50 dark:bg-red-950 text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {dia.esHabil ? (
                                  estadisticasPorDia.find(est => est.dia === dia.dia)?.totalMatriculados || 0
                                ) : '-'}
                              </TableCell>
                            ))}
                            <TableCell className="text-center bg-accent/30 font-semibold text-2xs">
                              {totalEstudiantes}
                            </TableCell>
                          </TableRow>

                          {/* Fila: Porcentaje de Asistencia */}
                          <TableRow className="bg-primary/5 font-medium border-b-2 border-border">
                            <TableCell className="sticky left-0 bg-primary/10 border-r text-2xs text-primary">
                              % Asistencia
                            </TableCell>
                            {diasDelMes.map((dia) => {
                              const estadisticaDia = estadisticasPorDia.find(est => est.dia === dia.dia)
                              return (
                                <TableCell 
                                  key={dia.dia} 
                                  className={`text-center text-2xs font-medium ${!dia.esHabil ? 'w-1.5' : 'w-2'} ${
                                    !dia.esHabil ? 'bg-red-50 dark:bg-red-950 text-muted-foreground' : 'text-primary'
                                  }`}
                                >
                                  {dia.esHabil ? `${Math.round(estadisticaDia?.porcentaje || 0)}` : '-'}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center bg-primary/10 font-bold text-2xs text-primary">
                              {Math.round(promedioAsistencia)}%
                            </TableCell>
                          </TableRow>
                        </>
                      )
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando estudiantes...</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}