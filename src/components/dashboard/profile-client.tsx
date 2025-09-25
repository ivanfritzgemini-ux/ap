"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Edit2, Save, X, User, Mail, IdCard, UserCheck, Phone, MapPin, Calendar, Camera, Upload } from "lucide-react";

interface ProfileUser {
  id: string;
  rut: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string;
  foto_perfil: string;
  sexo: string;
  sexo_id: number | null;
  rol: string;
  rol_id: number | null;
}

interface ProfileClientProps {
  user: ProfileUser;
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    nombres: user.nombres,
    apellidos: user.apellidos,
    rut: user.rut,
    telefono: user.telefono,
    direccion: user.direccion,
    fecha_nacimiento: user.fecha_nacimiento,
    sexo_id: user.sexo_id,
  });

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'administrator':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'student':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'parent':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'administrator':
        return 'Administrador';
      case 'teacher':
        return 'Profesor';
      case 'student':
        return 'Estudiante';
      case 'parent':
        return 'Apoderado';
      default:
        return role || 'Sin rol';
    }
  };

  const getInitials = (nombres: string, apellidos: string) => {
    const n = nombres?.charAt(0)?.toUpperCase() || '';
    const a = apellidos?.charAt(0)?.toUpperCase() || '';
    return (n + a) || 'U';
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const formDataImage = new FormData();
      formDataImage.append('image', file);
      formDataImage.append('userId', user.id);

      const response = await fetch('/api/users/profile/image', {
        method: 'POST',
        body: formDataImage,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Imagen actualizada",
          description: "Tu foto de perfil ha sido actualizada correctamente.",
        });
        // Recargar la página para mostrar la nueva imagen
        window.location.reload();
      } else {
        throw new Error(result.error || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo subir la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: user.id,
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            rut: formData.rut,
            telefono: formData.telefono,
            direccion: formData.direccion,
            fecha_nacimiento: formData.fecha_nacimiento,
            sexo_id: formData.sexo_id,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar el perfil');
        }

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "Perfil actualizado",
            description: "Tus datos han sido actualizados correctamente.",
          });
          setIsEditing(false);
          // Recargar la página para mostrar los datos actualizados
          window.location.reload();
        } else {
          throw new Error(result.error || 'Error al actualizar el perfil');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo actualizar el perfil. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCancel = () => {
    setFormData({
      nombres: user.nombres,
      apellidos: user.apellidos,
      rut: user.rut,
      telefono: user.telefono,
      direccion: user.direccion,
      fecha_nacimiento: user.fecha_nacimiento,
      sexo_id: user.sexo_id,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabecera del perfil */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="w-20 h-20">
                  {user.foto_perfil && (
                    <AvatarImage 
                      src={user.foto_perfil} 
                      alt={`${user.nombres} ${user.apellidos}`}
                    />
                  )}
                  <AvatarFallback className="text-lg font-semibold bg-primary/10">
                    {getInitials(user.nombres, user.apellidos)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <label htmlFor="profile-image" className="cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={isUploadingImage}
                  />
                </div>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold">
                  {user.nombres} {user.apellidos}
                </h3>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
                <Badge className={getRoleColor(user.rol)}>
                  {getRoleLabel(user.rol)}
                </Badge>
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Información personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            {isEditing ? "Edita tus datos personales" : "Tu información personal registrada"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombres */}
            <div className="space-y-2">
              <Label htmlFor="nombres" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombres
              </Label>
              {isEditing ? (
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange('nombres', e.target.value)}
                  placeholder="Ingresa tus nombres"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.nombres || 'Sin información'}
                </p>
              )}
            </div>

            {/* Apellidos */}
            <div className="space-y-2">
              <Label htmlFor="apellidos" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Apellidos
              </Label>
              {isEditing ? (
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange('apellidos', e.target.value)}
                  placeholder="Ingresa tus apellidos"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.apellidos || 'Sin información'}
                </p>
              )}
            </div>

            {/* RUT */}
            <div className="space-y-2">
              <Label htmlFor="rut" className="flex items-center gap-2">
                <IdCard className="w-4 h-4" />
                RUT
              </Label>
              {isEditing ? (
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => handleInputChange('rut', e.target.value)}
                  placeholder="12.345.678-9"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.rut || 'Sin información'}
                </p>
              )}
            </div>

            {/* Sexo */}
            <div className="space-y-2">
              <Label htmlFor="sexo" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Sexo
              </Label>
              {isEditing ? (
                <Select
                  value={formData.sexo_id?.toString() || ''}
                  onValueChange={(value) => handleInputChange('sexo_id', value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Masculino</SelectItem>
                    <SelectItem value="2">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.sexo || 'Sin información'}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono
              </Label>
              {isEditing ? (
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="+56 9 1234 5678"
                  type="tel"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.telefono || 'Sin información'}
                </p>
              )}
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de Nacimiento
              </Label>
              {isEditing ? (
                <Input
                  id="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                  type="date"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.fecha_nacimiento ? new Date(user.fecha_nacimiento).toLocaleDateString('es-CL') : 'Sin información'}
                </p>
              )}
            </div>
          </div>

          {/* Dirección - Campo completo ancho */}
          <div className="space-y-2">
            <Label htmlFor="direccion" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dirección
            </Label>
            {isEditing ? (
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                placeholder="Calle Ejemplo 123, Ciudad"
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">
                {user.direccion || 'Sin información'}
              </p>
            )}
          </div>

          <Separator />

          {/* Email - Solo lectura */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Correo electrónico
            </Label>
            <p className="text-sm py-2 px-3 bg-muted rounded-md">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              El correo electrónico no se puede modificar desde este panel.
            </p>
          </div>

          {/* Acciones */}
          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}