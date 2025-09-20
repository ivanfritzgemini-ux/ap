"use client"
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { z } from 'zod'

type Establecimiento = {
  id?: string
  nombre?: string
  rol?: string
  direccion?: string
  telefono?: string
  correo?: string
  sitio_web?: string
  logo?: string
  director_id?: string
}

const establecimientoSchema = z.object({
  nombre: z.string().min(3, 'Ingrese el nombre del establecimiento'),
  rol: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email('Email inválido').optional(),
  sitio_web: z.string().optional(),
  director_id: z.string().optional(),
  logo: z.string().optional(),
})

const periodoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(3, 'Nombre corto'),
  fecha_inicio: z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Fecha inicio inválida' }),
  fecha_fin: z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Fecha fin inválida' }),
})

export function EstablecimientoManagementClient({ establecimiento, periodos: initialPeriodos, tipos: initialTipos }: { establecimiento: Establecimiento | null, periodos: any[], tipos: any[] }) {
  const { toast } = useToast()
  const [form, setForm] = React.useState<Establecimiento>({})
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [docentes, setDocentes] = React.useState<Array<{id:string,name:string}>>([])

  const [periodos, setPeriodos] = React.useState<any[]>(initialPeriodos ?? [])
  const [periodoModalOpen, setPeriodoModalOpen] = React.useState(false)
  const [editingPeriodo, setEditingPeriodo] = React.useState<any | null>(null)

  const [tipos, setTipos] = React.useState<any[]>(initialTipos ?? [])
  const [tipoModalOpen, setTipoModalOpen] = React.useState(false)
  const [editingTipo, setEditingTipo] = React.useState<any | null>(null)

  React.useEffect(() => {
    setForm(establecimiento ?? {})
    setLogoPreview(establecimiento?.logo ?? null)
  }, [establecimiento])

  // confirmation dialog state
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmTarget, setConfirmTarget] = React.useState<{ kind: 'periodo'|'tipo', id: string, label?: string } | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    let mounted = true
    fetch('/api/users')
      .then(r => r.json())
      .then((json) => {
        if (!mounted) return
        const list = Array.isArray(json.data) ? json.data : []
        const docs = list.filter((u:any) => (u.role || '').toLowerCase().includes('docent'))
          .map((u:any) => ({ id: u.id, name: u.name }))
        setDocentes(docs)
      }).catch(() => {})
    return () => { mounted = false }
  }, [])

  async function uploadFile(file: File) {
    const fd = new FormData(); fd.append('file', file)
    setUploading(true)
    try {
      const res = await fetch('/api/establecimiento/upload-logo', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Upload failed')
      return json
    } finally { setUploading(false) }
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    try {
      const json = await uploadFile(file)
      setForm(prev => ({ ...prev, logo: json.path }))
      setLogoPreview(json.publicUrl || json.path)
      toast({ title: 'Logo subido', description: 'Se ha subido el logo correctamente.' })
    } catch (err: any) { toast({ title: 'Error al subir', description: err.message || 'No se pudo subir el archivo.' }) }
  }

  const validateAndSave = async () => {
    const parsed = establecimientoSchema.safeParse(form)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      toast({ title: 'Validación', description: first.message })
      return
    }
    try {
      const res = await fetch('/api/establecimiento', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Save failed')
      toast({ title: 'Guardado', description: 'Información del establecimiento guardada.' })
    } catch (err: any) { toast({ title: 'Error', description: err.message || 'No se pudo guardar.' }) }
  }

  // Periodos CRUD
  const openNewPeriodo = () => { setEditingPeriodo(null); setPeriodoModalOpen(true) }
  const openEditPeriodo = (p:any) => { setEditingPeriodo(p); setPeriodoModalOpen(true) }
  const savePeriodo = async (payload: any) => {
    const parsed = periodoSchema.safeParse(payload)
    if (!parsed.success) { toast({ title: 'Validación', description: parsed.error.errors[0].message }); return }
    try {
      const method = payload.id ? 'PUT' : 'POST'
      const url = '/api/periodos-academicos'
      const res = await fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error saving periodo')
      // refresh list
      const listRes = await fetch('/api/periodos-academicos')
      const listJson = await listRes.json()
      setPeriodos(listJson.data || [])
      setPeriodoModalOpen(false)
      toast({ title: 'Periodo guardado' })
    } catch (err:any) { toast({ title: 'Error', description: err.message || 'No se pudo guardar periodo' }) }
  }
  const deletePeriodo = async (id:string) => {
    try {
      const res = await fetch(`/api/periodos-academicos?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error deleting')
      setPeriodos(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Periodo eliminado', description: 'El periodo fue eliminado correctamente.' })
    } catch (err:any) { toast({ title: 'Error', description: err.message || 'No se pudo eliminar periodo' }) }
  }

  // Tipos CRUD
  const openNewTipo = () => { setEditingTipo(null); setTipoModalOpen(true) }
  const openEditTipo = (t:any) => { setEditingTipo(t); setTipoModalOpen(true) }
  const saveTipo = async (payload:any) => {
    if (!payload.codigo || !String(payload.codigo).trim()) { toast({ title: 'Validación', description: 'Ingrese código' }); return }
    if (!payload.nombre || !payload.nombre.trim()) { toast({ title: 'Validación', description: 'Ingrese nombre' }); return }
    try {
      const method = payload.id ? 'PUT' : 'POST'
      const res = await fetch('/api/tipo-educacion', { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error saving tipo')
      const listRes = await fetch('/api/tipo-educacion')
      const listJson = await listRes.json()
      setTipos(listJson.data || [])
      setTipoModalOpen(false)
      toast({ title: 'Tipo guardado' })
    } catch (err:any) { toast({ title: 'Error', description: err.message || 'No se pudo guardar tipo' }) }
  }
  const deleteTipo = async (id:string) => {
    try {
      const res = await fetch(`/api/tipo-educacion?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error deleting')
      setTipos(prev => prev.filter(t => t.id !== id))
      toast({ title: 'Tipo eliminado', description: 'El tipo de enseñanza fue eliminado.' })
    } catch (err:any) { toast({ title: 'Error', description: err.message || 'No se pudo eliminar tipo' }) }
  }

  const openConfirmDelete = (kind: 'periodo'|'tipo', id: string, label?: string) => {
    setConfirmTarget({ kind, id, label })
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!confirmTarget) return
    const { kind, id } = confirmTarget
    setConfirmOpen(false)
    if (kind === 'periodo') await deletePeriodo(id)
    if (kind === 'tipo') await deleteTipo(id)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className='flex flex-col md:flex-row items-start justify-between gap-4 w-full'>
            <div>
              <CardTitle className='text-lg md:text-xl'>Datos Generales</CardTitle>
              <p className='text-sm text-muted-foreground'>Mantenga la información del establecimiento actualizada.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Nombre del Establecimiento</Label>
                <Input value={form.nombre || ''} onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))} />
              </div>
              <div>
                <Label>ROL</Label>
                <Input value={form.rol || ''} onChange={(e) => setForm(prev => ({ ...prev, rol: e.target.value }))} />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input value={form.direccion || ''} onChange={(e) => setForm(prev => ({ ...prev, direccion: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Teléfono</Label>
                  <Input value={form.telefono || ''} onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))} />
                </div>
                <div>
                  <Label>Correo</Label>
                  <Input value={form.correo || ''} onChange={(e) => setForm(prev => ({ ...prev, correo: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Sitio web</Label>
                <Input value={form.sitio_web || ''} onChange={(e) => setForm(prev => ({ ...prev, sitio_web: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Director(a)</Label>
                <select className="w-full rounded-md border bg-background p-2" value={form.director_id || ''} onChange={(e) => setForm(prev => ({ ...prev, director_id: e.target.value }))}>
                  <option value="">-- Seleccione --</option>
                  {docentes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                  <Label>Logo</Label>
                  <div className='mt-2 flex items-center gap-3'>
                    <Button variant='outline' size='sm' onClick={() => fileInputRef.current?.click()}>Seleccionar archivo</Button>
                    <div className='text-sm text-muted-foreground'>{form.logo ? 'Archivo seleccionado' : 'Ningún archivo'}</div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className='hidden' onChange={(e) => handleFile(e.target.files?.[0])} />
                  {logoPreview && <img src={logoPreview} alt="logo" className="mt-3 h-28 object-contain rounded-md border" />}
                </div>
              <div className="flex justify-end">
                <Button onClick={validateAndSave} disabled={uploading} variant='default' size='default'>Guardar Cambios</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex flex-col md:flex-row items-start justify-between gap-4 w-full'>
            <div>
              <CardTitle className='text-lg md:text-xl'>Calendario Académico</CardTitle>
              <p className='text-sm text-muted-foreground'>Estas fechas definen los períodos habilitados para el registro de asistencia.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {periodos.map((p: any) => (
              <div key={p.id} className="p-4 bg-muted rounded-md flex flex-col gap-2">
                <div className="font-semibold">{p.nombre}</div>
                <div className="text-sm">Inicio: {new Date(p.fecha_inicio).toLocaleDateString()}</div>
                <div className="text-sm">Fin: {new Date(p.fecha_fin).toLocaleDateString()}</div>
                <div className='flex gap-2 mt-2'>
                  <Button size='sm' variant='outline' onClick={() => openEditPeriodo(p)}>Editar</Button>
                  <Button size='sm' variant='destructive' onClick={() => openConfirmDelete('periodo', p.id, p.nombre)}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex flex-col md:flex-row items-start justify-between gap-4 w-full'>
            <div>
              <CardTitle className='text-lg md:text-xl'>Tipos de Enseñanza</CardTitle>
              <p className='text-sm text-muted-foreground'>Gestiona los tipos de enseñanza ofrecidos por la institución.</p>
            </div>
            <div className='self-start ml-auto'>
              <Button size='sm' variant='outline' onClick={openNewTipo} className='inline-flex items-center gap-2'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span>Agregar Tipo</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-md border'>
            <div className='grid grid-cols-12 gap-4 p-4 bg-muted/50 text-muted-foreground font-medium'>
              <div className='col-span-2'>Código</div>
              <div className='col-span-8'>Tipo de Enseñanza</div>
              <div className='col-span-2 text-right'>Acciones</div>
            </div>
            <div className='divide-y'>
              {tipos.map(t => (
                <div key={t.id} className='grid grid-cols-12 gap-4 p-4 items-center'>
                  <div className='col-span-2 font-semibold'>{t.codigo}</div>
                  <div className='col-span-8 text-sm'>{t.nombre}</div>
                  <div className='col-span-2 text-right flex justify-end gap-2'>
                    <Button size='sm' variant='outline' onClick={() => openEditTipo(t)}>Editar</Button>
                    <Button size='sm' variant='destructive' onClick={() => openConfirmDelete('tipo', t.id, t.nombre)}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Periodo Modal */}
      <Dialog open={periodoModalOpen} onOpenChange={setPeriodoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPeriodo ? 'Editar Periodo' : 'Nuevo Periodo'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Label>Nombre</Label>
            <Input defaultValue={editingPeriodo?.nombre || ''} id='periodo_nombre' />
            <Label>Fecha Inicio</Label>
            <Input defaultValue={editingPeriodo?.fecha_inicio?.slice(0,10) || ''} id='periodo_inicio' type='date' />
            <Label>Fecha Fin</Label>
            <Input defaultValue={editingPeriodo?.fecha_fin?.slice(0,10) || ''} id='periodo_fin' type='date' />
            <div className='flex justify-end gap-2'>
              <Button onClick={() => {
                const payload = {
                  id: editingPeriodo?.id,
                  nombre: (document.getElementById('periodo_nombre') as HTMLInputElement).value,
                  fecha_inicio: (document.getElementById('periodo_inicio') as HTMLInputElement).value,
                  fecha_fin: (document.getElementById('periodo_fin') as HTMLInputElement).value,
                }
                savePeriodo(payload)
              }}>Guardar</Button>
              <Button variant='outline' onClick={() => setPeriodoModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tipo Modal */}
      <Dialog open={tipoModalOpen} onOpenChange={setTipoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTipo ? 'Editar Tipo' : 'Nuevo Tipo'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Label>Código</Label>
            <Input defaultValue={editingTipo?.codigo || ''} id='tipo_codigo' />
            <Label>Nombre</Label>
            <Input defaultValue={editingTipo?.nombre || ''} id='tipo_nombre' />
            <div className='flex justify-end gap-2'>
              <Button onClick={() => {
                const payload = { id: editingTipo?.id, codigo: (document.getElementById('tipo_codigo') as HTMLInputElement).value, nombre: (document.getElementById('tipo_nombre') as HTMLInputElement).value }
                saveTipo(payload)
              }}>Guardar</Button>
              <Button variant='outline' onClick={() => setTipoModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro que deseas eliminar {confirmTarget?.label ?? 'este elemento'}? Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
