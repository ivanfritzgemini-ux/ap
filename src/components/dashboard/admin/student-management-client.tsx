"use client";
import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, ArrowUpDown, Trash2, Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2, Download, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { parseISO, format as formatDateFn } from 'date-fns'
import { formatRut } from "@/lib/utils"

type SortKey = keyof Student;

const months = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

const initialNewStudentState = {
    registration_number: "",
    rut: "",
    apellidos: "",
    nombres: "",
    sexo: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    enrollment_date: "",
    curso: "",
    email: "",
    phone: "",
    address: ""
};

interface StudentManagementClientProps {
  students: Student[];
}

export function StudentManagementClient({ students: initialStudents }: StudentManagementClientProps) {
    const { toast } = useToast();
    const [students, setStudents] = React.useState<Student[]>(initialStudents);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({
        key: 'registration_number',
        direction: 'ascending'
    });
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;
    
    // Estado para el importador CSV
    const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
    const [csvFile, setCsvFile] = React.useState<File | null>(null);
    const [isImporting, setIsImporting] = React.useState(false);
    const [importResults, setImportResults] = React.useState<any | null>(null);
    const [importProgress, setImportProgress] = React.useState(0);
    const [importStatus, setImportStatus] = React.useState<string>('');
    const [isDragOver, setIsDragOver] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [newStudent, setNewStudent] = React.useState(initialNewStudentState);
    const [editingStudentId, setEditingStudentId] = React.useState<string | null>(null);
  const [sexos, setSexos] = React.useState<Array<{id: string, nombre: string}>>([]);
  const [cursos, setCursos] = React.useState<Array<Record<string, any>>>([]);
  const rutRef = React.useRef<HTMLInputElement | null>(null);

  const buildCursoLabel = (c: Record<string, any>) => {
    if (!c) return ''
    // prefer tipo_educacion.nombre if available
    const tipoNombre = c?.tipo_educacion?.nombre ?? c.tipo_educacion ?? null
    let tipoLabel = tipoNombre ?? null
    if (typeof tipoLabel === 'string' && tipoLabel.includes('Media')) tipoLabel = 'Medio'

    const nivel = c.nivel ?? c.level ?? c.grade
    const letra = c.letra ?? c.letter

    if (nivel && tipoLabel && letra) return `${nivel}º ${tipoLabel} ${letra}`
    if (nivel && letra) return `${nivel}º ${letra}`
    // fallback to name fields
    const name = c.nombre_curso ?? c.nombre ?? c.name
    if (name && nivel && letra) return `${nivel}º ${letra} - ${name}`
    if (name) return name
    return String(c.id ?? '')
  }

     React.useEffect(() => {
        if (!isDialogOpen) {
            setNewStudent(initialNewStudentState);
            setEditingStudentId(null);
            return;
        }

        // when opening the dialog: if we're creating (not editing) fetch next registry
        if (!editingStudentId) {
          fetchLastRegistry();
        }

        (async () => {
          try {
            const [sexRes, cursosRes] = await Promise.all([fetch('/api/sexos'), fetch('/api/cursos')])
            const sexJson = await sexRes.json();
            const cursosJson = await cursosRes.json();
            setSexos(Array.isArray(sexJson.data) ? sexJson.data : [])
            setCursos(Array.isArray(cursosJson.data) ? cursosJson.data : [])
          } catch (e) {
            // ignore
          }
        })()
        // focus the RUT input after the dialog opens and elements mount
        requestAnimationFrame(() => rutRef.current?.focus());
    }, [isDialogOpen, editingStudentId]);

  const fetchLastRegistry = async () => {
    try {
      const res = await fetch('/api/students/last-registry');
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Error fetching last registry');
      }

      const last = json.last;
      let nextNumber = 1;

      if (last) {
        // Parse the last registration number and increment
        const lastNumber = parseInt(String(last), 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      // Ensure the generated number doesn't conflict with existing ones
      let attempts = 0;
      while (attempts < 100) { // Safety limit
        const candidateNumber = String(nextNumber);
        
        // Check if this number already exists in current student list
        const exists = students.some(s => s.registration_number === candidateNumber);
        
        if (!exists) {
          setNewStudent(prev => ({ ...prev, registration_number: candidateNumber }));
          return;
        }
        
        nextNumber++;
        attempts++;
      }

      // If we couldn't find a unique number, fallback
      setNewStudent(prev => ({ ...prev, registration_number: String(Date.now()) }));
      
    } catch (e) {
      console.error('Error fetching last registry:', e);
      // Fallback: use timestamp-based number to ensure uniqueness
      setNewStudent(prev => ({ ...prev, registration_number: String(Date.now()) }));
    }
  }

    const fetchList = async () => {
      try {
        const res = await fetch('/api/students/list')
        const json = await res.json()
        if (res.ok && Array.isArray(json.data)) setStudents(json.data)
      } catch (e) { /* ignore */ }
    }

    const startEditingStudent = async (id: string) => {
      try {
        const res = await fetch(`/api/students/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error fetching student')
        const d = json.data
        const u = d.usuarios
        setNewStudent(prev => ({
          ...prev,
          registration_number: d.nro_registro ?? prev.registration_number,
          rut: u?.rut ?? prev.rut,
          nombres: u?.nombres ?? prev.nombres,
          apellidos: u?.apellidos ?? prev.apellidos,
          email: u?.email ?? prev.email,
          phone: u?.telefono ?? prev.phone,
          address: u?.direccion ?? prev.address,
          enrollment_date: d.fecha_matricula ?? prev.enrollment_date,
          curso: d.curso_id ?? prev.curso,
          // parse fecha_nacimiento without timezone shift
          birthYear: ((): string => { const m = String(u?.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? m[1] : prev.birthYear })(),
          birthMonth: ((): string => { const m = String(u?.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? String(Number(m[2])) : prev.birthMonth })(),
          birthDay: ((): string => { const m = String(u?.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? String(Number(m[3])) : prev.birthDay })(),
          sexo: u?.sexo_id ?? prev.sexo
        }))
        setEditingStudentId(id)
        setIsDialogOpen(true)
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'No se pudo cargar el estudiante.' })
      }
    }

    const handleCreateStudent = async () => {
    if (!newStudent.nombres.trim() || !newStudent.apellidos.trim()) {
      toast({ title: 'Campos requeridos', description: 'Nombres y apellidos son obligatorios.'});
      return;
    }

    // Validate registration number for new students
    if (!editingStudentId) {
      if (!newStudent.registration_number.trim()) {
        toast({ title: 'Número de registro requerido', description: 'El número de registro es obligatorio.' });
        return;
      }

      // Check for duplicate registration numbers in current list
      const isDuplicate = students.some(s => 
        s.registration_number === newStudent.registration_number.trim()
      );

      if (isDuplicate) {
        toast({ 
          title: 'Número duplicado', 
          description: 'Este número de registro ya existe. Se generará uno nuevo automáticamente.' 
        });
        // Regenerate registration number
        await fetchLastRegistry();
        return;
      }
    }

    try {
      const payload = {
        rut: newStudent.rut,
        nombres: newStudent.nombres,
        apellidos: newStudent.apellidos,
        sexo_id: newStudent.sexo,
        email: newStudent.email,
        telefono: newStudent.phone,
        direccion: newStudent.address,
        fecha_nacimiento: newStudent.birthYear && newStudent.birthMonth && newStudent.birthDay ? `${newStudent.birthYear}-${String(newStudent.birthMonth).padStart(2,'0')}-${String(newStudent.birthDay).padStart(2,'0')}` : null,
        curso_id: newStudent.curso,
        nro_registro: newStudent.registration_number,
        fecha_matricula: newStudent.enrollment_date
      };

      if (editingStudentId) {
        // update
        const res = await fetch('/api/students/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingStudentId, ...payload }) })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error updating student')
        toast({ title: 'Estudiante Actualizado', description: `${newStudent.nombres} ha sido actualizado.` })
        await fetchList()
        setIsDialogOpen(false)
        setEditingStudentId(null)
        return
      }

      const res = await fetch('/api/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error creating student');

      toast({ title: 'Estudiante Matriculado', description: `${newStudent.nombres} ha sido añadido exitosamente.` });
      // refresh list from server (server returns ordered list)
      await fetchList()
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo matricular el estudiante.' });
    }
  };

    const handleDeleteStudent = async (studentId: string) => {
        try {
          const res = await fetch('/api/students/delete', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id: studentId }) })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || 'Error deleting')
          await fetchList()
          toast({ title: 'Estudiante Eliminado', description: 'El estudiante ha sido eliminado exitosamente.' })
        } catch (e: any) {
          toast({ title: 'Error', description: e.message || 'No se pudo eliminar el estudiante.' })
        }
    };

        // --- Retiro (withdraw) flow ---
        const [withdrawDialogOpen, setWithdrawDialogOpen] = React.useState(false);
        const [withdrawStudentId, setWithdrawStudentId] = React.useState<string | null>(null);
        const [withdrawDate, setWithdrawDate] = React.useState<string>('');
        const [withdrawReason, setWithdrawReason] = React.useState<string>('');

        const openWithdrawFor = (id: string) => {
          setWithdrawStudentId(id);
          setWithdrawDate('');
          setWithdrawReason('');
          setWithdrawDialogOpen(true);
        }

        const submitWithdraw = async () => {
          if (!withdrawStudentId) return;
          if (!withdrawDate) {
            toast({ title: 'Fecha requerida', description: 'Por favor ingrese la fecha de retiro.' })
            return;
          }
          try {
            // optimistic update: mark student as retired locally so UI updates immediately
            setStudents(prev => prev.map(s => s.id === withdrawStudentId ? { ...s, fecha_retiro: withdrawDate, motivo_retiro: withdrawReason } : s));
            const res = await fetch('/api/students/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: withdrawStudentId, fecha_retiro: withdrawDate, motivo_retiro: withdrawReason }) })
            const json = await res.json();
            if (!res.ok) {
              // rollback optimistic update on error
              setStudents(prev => prev.map(s => s.id === withdrawStudentId ? { ...s, fecha_retiro: undefined, motivo_retiro: undefined } : s));
              throw new Error(json.error || 'Error al registrar retiro')
            }
            toast({ title: 'Estudiante Retirado', description: 'Se registró la fecha de retiro correctamente.' })
            setWithdrawDialogOpen(false);
            setWithdrawStudentId(null);
            // refresh list to ensure server-state consistency
            await fetchList();
          } catch (e: any) {
            toast({ title: 'Error', description: e.message || 'No se pudo retirar el estudiante.' })
          }
        }

    const filteredStudents = students.filter(student =>
        student.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollment_date?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedStudents = React.useMemo(() => {
        let sortableStudents = [...filteredStudents];
        if (sortConfig !== null) {
            sortableStudents.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                // Special handling for registration_number to sort numerically
                if (sortConfig.key === 'registration_number') {
                    const aNum = parseInt(String(aValue), 10);
                    const bNum = parseInt(String(bValue), 10);
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return sortConfig.direction === 'ascending' ? aNum - bNum : bNum - aNum;
                    }
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableStudents;
    }, [filteredStudents, sortConfig]);

    const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);

    const handlePrevPage = () => {
      setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleNextPage = () => {
      setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const formatDate = (d?: string | null) => {
      if (!d) return '-'
      try {
        // parseISO can throw if invalid; format to dd/MM/yyyy
        const dt = parseISO(d)
        return formatDateFn(dt, 'dd/MM/yyyy')
      } catch (e) {
        return d
      }
    }
    
    // Funciones para manejar la importación CSV
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (!file.name.endsWith('.csv')) {
          toast({
            title: 'Formato no válido',
            description: 'Por favor seleccione un archivo CSV',
            variant: 'destructive'
          });
          e.target.value = '';
          return;
        }
        setCsvFile(file);
      }
    };

    const validateFile = (file: File): boolean => {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Formato no válido',
          description: 'Por favor seleccione un archivo CSV',
          variant: 'destructive'
        });
        return false;
      }
      return true;
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          setCsvFile(file);
        }
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const downloadSampleCSV = () => {
      const sampleData = [
        ['rut', 'nombres', 'apellidos', 'sexo', 'fecha_nacimiento', 'email', 'curso', 'fecha_matricula', 'nro_registro'],
        ['12345678-9', 'Juan', 'Pérez', 'masculino', '15/03/2010', 'juan.perez@ejemplo.com', '8A', '15/03/2024', '1001'],
        ['98765432-1', 'María', 'González', 'femenino', '22/07/2009', 'maria.gonzalez@ejemplo.com', '1 Medio A', '15/03/2024', '1002']
      ];
      
      const csvContent = sampleData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_estudiantes.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    };
    
    const handleImportCSV = async () => {
      if (!csvFile) {
        toast({
          title: 'No se seleccionó archivo',
          description: 'Por favor seleccione un archivo CSV para importar',
          variant: 'destructive'
        });
        return;
      }
      
      setIsImporting(true);
      setImportResults(null);
      setImportProgress(0);
      setImportStatus('Iniciando importación...');
      
      try {
        // Estimate file size for progress tracking
        const fileSizeKB = csvFile.size / 1024;
        setImportStatus(`Procesando archivo (${fileSizeKB.toFixed(1)} KB)...`);
        setImportProgress(10);
        
        const formData = new FormData();
        formData.append('file', csvFile);
        
        setImportStatus('Validando datos y creando usuarios...');
        setImportProgress(30);
        
        const response = await fetch('/api/students/import-csv', {
          method: 'POST',
          body: formData
        });
        
        setImportProgress(80);
        setImportStatus('Procesando respuesta...');
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al importar estudiantes');
        }
        
        const results = await response.json();
        setImportProgress(95);
        setImportStatus('Finalizando...');
        
        setImportResults(results);
        
        // Actualizar la lista de estudiantes si hubo éxito
        if (results.success > 0) {
          setImportStatus('Actualizando lista de estudiantes...');
          await fetchList();
        }
        
        setImportProgress(100);
        setImportStatus('¡Importación completada!');
        
        toast({
          title: 'Importación completada',
          description: `${results.success} estudiantes importados, ${results.failed} fallidos`,
        });
        
      } catch (error: any) {
        setImportProgress(0);
        setImportStatus('Error en la importación');
        toast({
          title: 'Error al importar',
          description: error.message || 'Ocurrió un error durante la importación',
          variant: 'destructive'
        });
      } finally {
        setIsImporting(false);
      }
    };
    
    const resetImportDialog = () => {
      setCsvFile(null);
      setImportResults(null);
      setImportProgress(0);
      setImportStatus('');
      setIsDragOver(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewStudent(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string) => (value: string) => {
        setNewStudent(prev => ({ ...prev, [id]: value }));
    };

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, RUT..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
            setIsImportDialogOpen(open);
            if (!open) resetImportDialog();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 shrink-0">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Importar Estudiantes desde CSV</DialogTitle>
                <DialogDescription>
                  Sube un archivo CSV con los datos de estudiantes para importar en masa.
                </DialogDescription>
              </DialogHeader>
              
              {!importResults ? (
                <div className="grid gap-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="csv-file">Archivo CSV</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={downloadSampleCSV}
                        className="text-xs gap-1 h-auto px-2 py-1"
                      >
                        <Download className="h-3 w-3" />
                        Descargar plantilla
                      </Button>
                    </div>
                    
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                        isDragOver 
                          ? 'border-primary bg-primary/5' 
                          : csvFile 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      } ${isImporting ? 'pointer-events-none opacity-50' : ''}`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        disabled={isImporting}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      <div className="flex flex-col items-center justify-center text-center">
                        {csvFile ? (
                          <>
                            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                            <p className="font-medium text-green-700">{csvFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(csvFile.size / 1024).toFixed(1)} KB
                            </p>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className={`h-8 w-8 mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className="font-medium mb-1">
                              {isDragOver ? 'Suelta el archivo aquí' : 'Arrastra tu archivo CSV aquí'}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              o haz clic para seleccionar
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Columnas requeridas:</strong> rut, nombres, apellidos, sexo, nro_registro</p>
                      <p><strong>Columnas opcionales:</strong> fecha_nacimiento (DD/MM/YYYY), email, curso, fecha_matricula</p>
                      <p><strong>Formatos aceptados:</strong> .csv</p>
                    </div>
                  </div>
                  
                  {isImporting && (
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        {importStatus}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsImportDialogOpen(false)} 
                      disabled={isImporting}
                      className="order-2 sm:order-1"
                    >
                      Cancelar
                    </Button>
                    <div className="flex gap-2 order-1 sm:order-2">
                      {csvFile && !isImporting && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCsvFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                      <Button onClick={handleImportCSV} disabled={!csvFile || isImporting}>
                        {isImporting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Estudiantes importados: {importResults.success}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <span className="font-medium">Fallidos: {importResults.failed}</span>
                      </div>
                    </div>
                    
                    {importResults.failed > 0 && (
                      <div className="bg-muted p-2 rounded-md max-h-48 overflow-auto">
                        <p className="font-medium mb-2">Errores:</p>
                        <ul className="text-sm space-y-1 pl-5 list-disc">
                          {importResults.errors.map((error: any, idx: number) => (
                            <li key={idx} className="text-red-500">
                              Fila {error.row}: {error.rut} - {error.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {importResults.success > 0 && (
                      <div className="bg-muted p-2 rounded-md max-h-48 overflow-auto">
                        <p className="font-medium mb-2">Estudiantes procesados:</p>
                        <ul className="text-sm space-y-1 pl-5 list-disc">
                          {importResults.created.map((student: any, idx: number) => (
                            <li key={idx} className="text-green-600">
                              {student.nombre} ({student.rut}) - {student.status === 'creado' ? 'Creado' : 'Actualizado'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={resetImportDialog}>
                      Importar otro archivo
                    </Button>
                    <Button onClick={() => setIsImportDialogOpen(false)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 shrink-0 w-full md:w-auto">
                <PlusCircle className="h-3.5 w-3.5" />
                Añadir Estudiante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingStudentId ? 'Editar Estudiante' : 'Matricular Estudiante'}</DialogTitle>
              <DialogDescription>
                {editingStudentId ? 'Modifique los detalles del estudiante.' : 'Rellene los detalles para matricular un nuevo estudiante.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="registration-number">Número de Registro</Label>
                        <Input 
                          id="registration_number"
                          value={newStudent.registration_number}
                          onChange={handleInputChange}
                          placeholder="Sugerido automáticamente, puedes modificarlo"
                          title="El número de registro se sugiere automáticamente, pero puedes modificarlo si es necesario"
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="rut">RUT</Label>
                        <div className="flex gap-2">
                        <Input id="rut" value={newStudent.rut} onChange={handleInputChange} ref={rutRef} />
            <Button variant="outline" size="icon" className="shrink-0" onClick={async () => {
              if (!newStudent.rut) return;
              try {
                const res = await fetch(`/api/students/by-rut?rut=${encodeURIComponent(newStudent.rut)}`)
                const json = await res.json();
                if (json.user) {
                  const u = json.user;
                  setNewStudent(prev => ({
                    ...prev,
                    nombres: u.nombres || prev.nombres,
                    apellidos: u.apellidos || prev.apellidos,
                    email: u.email || prev.email,
                    phone: u.telefono || prev.phone,
                    address: u.direccion || prev.address,
                    // fecha_nacimiento may be stored as YYYY-MM-DD; parse without using Date to avoid timezone shifts
                    birthYear: ((): string => {
                      const m = String(u.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/)
                      return m ? m[1] : prev.birthYear
                    })(),
                    birthMonth: ((): string => {
                      const m = String(u.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/)
                      return m ? String(Number(m[2])) : prev.birthMonth
                    })(),
                    birthDay: ((): string => {
                      const m = String(u.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/)
                      return m ? String(Number(m[3])) : prev.birthDay
                    })(),
                    sexo: u.sexo_id || prev.sexo
                  }))
                  toast({ title: 'Datos precargados', description: 'Se cargaron los datos desde la base de usuarios.' })
                } else {
                  toast({ title: 'No encontrado', description: 'No se encontró usuario con ese RUT. Complete los datos manualmente.' })
                }
              } catch (e) {
                toast({ title: 'Error', description: 'No se pudo buscar el RUT.' })
              }
            }}>
              <Search className="h-4 w-4" />
            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="last-name">Apellidos</Label>
                            <Input id="apellidos" placeholder="Ej: Pérez Díaz" value={newStudent.apellidos} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombres</Label>
                            <Input id="nombres" placeholder="Ej: Juan" value={newStudent.nombres} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="sex">Sexo</Label>
              <Select onValueChange={handleSelectChange('sexo')} value={newStudent.sexo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el sexo" />
                </SelectTrigger>
                <SelectContent>
                  {sexos.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Fecha de Nacimiento</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Select onValueChange={handleSelectChange('birthDay')} value={newStudent.birthDay}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Día" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {days.map(day => <SelectItem key={day} value={String(day)}>{day}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={handleSelectChange('birthMonth')} value={newStudent.birthMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Mes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(month => <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={handleSelectChange('birthYear')} value={newStudent.birthYear}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Año" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="enrollment-date">Fecha de Matrícula</Label>
                             <Input type="date" id="enrollment_date" value={newStudent.enrollment_date} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="course">Curso</Label>
              <Select onValueChange={handleSelectChange('curso')} value={newStudent.curso}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map(c => <SelectItem key={c.id} value={c.id}>{buildCursoLabel(c)}</SelectItem>)}
                </SelectContent>
              </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="ejemplo@email.com" value={newStudent.email} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" placeholder="555-123-4567" value={newStudent.phone} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" placeholder="123 Calle Falsa, Ciudad" value={newStudent.address} onChange={handleInputChange} />
                    </div>
                </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateStudent}>{editingStudentId ? 'Actualizar Estudiante' : 'Matricular Estudiante'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retirar Estudiante</DialogTitle>
              <DialogDescription>Registre la fecha de retiro y el motivo. Esto marcará al estudiante como retirado.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="withdraw-date">Fecha de Retiro</Label>
                <Input id="withdraw-date" type="date" value={withdrawDate} onChange={(e) => setWithdrawDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="withdraw-reason">Motivo de Retiro</Label>
                <Textarea id="withdraw-reason" value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setWithdrawDialogOpen(false)}>Cancelar</Button>
              <Button onClick={submitWithdraw}>Registrar Retiro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      <div className="border rounded-lg mt-4 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell w-24 px-2">
                <Button variant="ghost" onClick={() => requestSort('registration_number')}>
                    N° Reg.
                    {getSortIndicator('registration_number')}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell px-2">
                <Button variant="ghost" onClick={() => requestSort('rut')}>
                    RUT
                    {getSortIndicator('rut')}
                </Button>
              </TableHead>
              <TableHead className="px-2">
                <Button variant="ghost" onClick={() => requestSort('apellidos')}>
                    Alumno
                    {getSortIndicator('apellidos')}
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell px-2">
                 <Button variant="ghost" onClick={() => requestSort('sexo')}>
                    Sexo
                    {getSortIndicator('sexo')}
                </Button>
              </TableHead>
              <TableHead className="px-2">
                <Button variant="ghost" onClick={() => requestSort('curso')}>
                    Curso
                    {getSortIndicator('curso')}
                </Button>
              </TableHead>
              <TableHead className="px-2">
                <Button variant="ghost" onClick={() => requestSort('enrollment_date')}>
                    F. Matrícula
                    {getSortIndicator('enrollment_date')}
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell px-2">
                <Button variant="ghost" onClick={() => requestSort('fecha_retiro' as keyof Student)}>
                  F. Retiro
                  {/* No sort indicator by default for optional field */}
                </Button>
              </TableHead>
              <TableHead className="px-2">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="hidden md:table-cell px-2">{student.registration_number}</TableCell>
                <TableCell className="hidden md:table-cell px-2">{formatRut(student.rut)}</TableCell>
                <TableCell className="font-medium px-2">
                  <div className="flex items-center gap-2 h-full py-2">
                    <span className={student.fecha_retiro ? 'line-through opacity-60' : ''}>{`${student.apellidos} ${student.nombres}`}</span>
                    {student.fecha_retiro ? <Badge variant="destructive">Retirado</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell px-2">{student.sexo}</TableCell>
                <TableCell className="px-2">{student.curso}</TableCell>
                <TableCell className="px-2">{formatDate(student.enrollment_date)}</TableCell>
                <TableCell className="hidden lg:table-cell px-2">{formatDate(student.fecha_retiro)}</TableCell>
                <TableCell className="px-2">
                  <div className="flex justify-end">
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => startEditingStudent(student.id)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openWithdrawFor(student.id)} className="text-amber-600">Retirar</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-500 hover:text-red-500 focus:text-red-500">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al estudiante y sus datos de nuestros servidores.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <div className="grid gap-4 md:hidden mt-4">
        {currentStudents.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="text-base flex items-center gap-2 py-1">
                  <span className={student.fecha_retiro ? 'line-through opacity-60' : ''}>{`${student.apellidos} ${student.nombres}`}</span>
                  {student.fecha_retiro ? <Badge variant="destructive">Retirado</Badge> : null}
                </div>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => startEditingStudent(student.id)}>Editar</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openWithdrawFor(student.id)} className="text-amber-600">Retirar</DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-500 hover:text-red-500 focus:text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente al estudiante y sus datos de nuestros servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">N° de Registro:</span> {student.registration_number}</p>
              <p><span className="font-semibold">RUT:</span> {formatRut(student.rut)}</p>
              <p><span className="font-semibold">Curso:</span> {student.curso}</p>
              <p><span className="font-semibold">Fecha de Matrícula:</span> {formatDate(student.enrollment_date)}</p>
              <p><span className="font-semibold">Fecha de Retiro:</span> {formatDate(student.fecha_retiro)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedStudents.length)} de {sortedStudents.length} estudiantes
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </>
  );
}