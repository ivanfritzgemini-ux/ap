import { EstablecimientoManagementClient } from '../../../../components/dashboard/admin/establecimiento-client'
import { DiasBloqueadosManagement } from '../../../../components/dashboard/admin/dias-bloqueados-management'
import { createServerClient } from '@/lib/supabase/server'

export default async function EstablecimientoPage() {
  const supabase = await createServerClient()

  let estabData = null
  let periodos: any[] = []
  let tipos: { id: string; codigo?: string; nombre: string }[] = []
  let diasBloqueados: any[] = []
  
  try {
    const estabRes = await supabase.from('establecimientos').select('*').limit(1).single()
    estabData = estabRes.data ?? null
  } catch (e) {
    estabData = null
  }

  try {
    const p = await supabase.from('periodos_academicos').select('*').order('fecha_inicio')
    periodos = p.data ?? []
  } catch (e) { periodos = [] }

  try {
    const t = await supabase.from('tipo_educacion').select('id,codigo,nombre').order('nombre')
    tipos = t.data ?? []
  } catch (e) { tipos = [] }

  try {
    const d = await supabase.from('dias_bloqueados').select('*').order('fecha', { ascending: false })
    diasBloqueados = d.data ?? []
  } catch (e) { diasBloqueados = [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Establecimiento</h1>
        <p className="text-muted-foreground text-sm md:text-base">Información del establecimiento, periodos académicos, tipos de enseñanza y gestión de días bloqueados.</p>
      </div>
      <EstablecimientoManagementClient establecimiento={estabData ?? null} periodos={periodos ?? []} tipos={tipos ?? []} />
      <DiasBloqueadosManagement diasBloqueados={diasBloqueados ?? []} />
    </div>
  )
}
