"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DiagnosticoAsistencia() {
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<any>(null)

  const ejecutarPruebas = async () => {
    setLoading(true)
    setResultados(null)

    try {
      const pruebas = {
        conexion: null,
        muestra: null,
        tablas: null,
        cursos: null,
        estudiantes: null
      }

      // Prueba 1: Conexión básica
      try {
        const response = await fetch('/api/asistencia/test?test=connection')
        pruebas.conexion = await response.json()
      } catch (error) {
        pruebas.conexion = { success: false, error: error.message }
      }

      // Prueba 2: Muestra de datos
      try {
        const response = await fetch('/api/asistencia/test?test=sample')
        pruebas.muestra = await response.json()
      } catch (error) {
        pruebas.muestra = { success: false, error: error.message }
      }

      // Prueba 3: Verificar tablas
      try {
        const response = await fetch('/api/asistencia/test?test=tables')
        pruebas.tablas = await response.json()
      } catch (error) {
        pruebas.tablas = { success: false, error: error.message }
      }

      // Prueba 4: Cursos disponibles
      try {
        const response = await fetch('/api/cursos')
        pruebas.cursos = await response.json()
      } catch (error) {
        pruebas.cursos = { success: false, error: error.message }
      }

      // Prueba 5: Estudiantes (del primer curso si existe)
      try {
        if (pruebas.cursos?.data?.length > 0) {
          const cursoId = pruebas.cursos.data[0].id
          const response = await fetch(`/api/students-by-course?courseId=${cursoId}`)
          pruebas.estudiantes = await response.json()
        }
      } catch (error) {
        pruebas.estudiantes = { success: false, error: error.message }
      }

      setResultados(pruebas)
    } catch (error) {
      console.error('Error ejecutando pruebas:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderEstado = (prueba: any) => {
    if (!prueba) return <Badge variant="secondary">No ejecutado</Badge>
    if (prueba.success === false) return <Badge variant="destructive">Error</Badge>
    return <Badge variant="default">Éxito</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico del Sistema de Asistencia</CardTitle>
          <CardDescription>
            Esta página permite verificar la conectividad y datos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={ejecutarPruebas} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Ejecutando Pruebas...' : 'Ejecutar Diagnóstico'}
          </Button>

          {resultados && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Prueba de Conexión */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Conexión a Base de Datos</CardTitle>
                      {renderEstado(resultados.conexion)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(resultados.conexion, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                {/* Muestra de Datos */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Datos de Asistencia</CardTitle>
                      {renderEstado(resultados.muestra)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(resultados.muestra, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                {/* Tablas */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Verificación de Tablas</CardTitle>
                      {renderEstado(resultados.tablas)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(resultados.tablas, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                {/* Cursos */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Cursos Disponibles</CardTitle>
                      {renderEstado(resultados.cursos)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <div className="space-y-1">
                      {resultados.cursos?.data?.length > 0 ? (
                        <p>Encontrados: {resultados.cursos.data.length} cursos</p>
                      ) : (
                        <p>No se encontraron cursos</p>
                      )}
                      <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(resultados.cursos?.data?.slice(0, 3), null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Estudiantes */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Estudiantes del Primer Curso</CardTitle>
                      {renderEstado(resultados.estudiantes)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs">
                    <div className="space-y-1">
                      {resultados.estudiantes?.data?.length > 0 ? (
                        <p>Encontrados: {resultados.estudiantes.data.length} estudiantes</p>
                      ) : (
                        <p>No se encontraron estudiantes</p>
                      )}
                      <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(resultados.estudiantes?.data?.slice(0, 3), null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}