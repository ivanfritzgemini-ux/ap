import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, BookOpen, CalendarCheck, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ParentOverviewPage() {
  const child = {
    name: "Alex Doe",
    grade: "Grado 10",
    avatar: "https://i.pravatar.cc/150?u=alexdoe",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={child.avatar} alt={child.name} />
          <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-headline font-semibold">{child.name}</h1>
          <p className="text-muted-foreground">{child.grade}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calificaciones Recientes</CardTitle>
            <CardDescription>Último rendimiento académico.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span>Matemáticas - Examen de Álgebra</span>
                </div>
                <Badge variant="secondary" className="font-bold text-base">A-</Badge>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span>Física - Laboratorio de Cinemática</span>
                </div>
                <Badge variant="secondary" className="font-bold text-base">B+</Badge>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span>Inglés - Ensayo de Literatura</span>
                </div>
                <Badge variant="secondary" className="font-bold text-base">A</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Asistencia</CardTitle>
            <CardDescription>Resumen de asistencia para el semestre actual.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary">
              <span className="text-3xl font-bold text-green-600">98%</span>
              <span className="text-sm text-muted-foreground">Tasa General</span>
            </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary">
              <span className="text-3xl font-bold">1</span>
              <span className="text-sm text-muted-foreground">Ausencias</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li className="flex gap-3">
                <Bell className="h-5 w-5 mt-1 text-primary"/>
                <div>
                    <p className="font-medium">Reuniones de padres y maestros la próxima semana.</p>
                    <p className="text-sm text-muted-foreground">Por favor, inscríbase para un horario.</p>
                </div>
            </li>
            <Separator />
             <li className="flex gap-3">
                <CalendarCheck className="h-5 w-5 mt-1 text-green-500"/>
                <div>
                    <p className="font-medium">Permiso para excursión escolar pendiente.</p>
                    <p className="text-sm text-muted-foreground">Fecha límite el viernes.</p>
                </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
