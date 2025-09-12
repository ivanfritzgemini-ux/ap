import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function StudentSchedulePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-headline font-semibold">Tu Horario</h1>
      <Card>
        <CardHeader>
          <CardTitle>Clases de Hoy</CardTitle>
          <CardDescription>
            Este es tu horario para hoy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Hora</TableHead>
                <TableHead>Asignatura</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead className="text-right">Salón</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">9:00 AM - 10:00 AM</TableCell>
                <TableCell>Matemáticas</TableCell>
                <TableCell>Sr. Davison</TableCell>
                <TableCell className="text-right">301A</TableCell>
              </TableRow>
              <TableRow className="bg-secondary">
                <TableCell className="font-medium">10:15 AM - 11:15 AM</TableCell>
                <TableCell>Física</TableCell>
                <TableCell>Sra. Curie</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    402B <Badge>En Progreso</Badge>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">11:30 AM - 12:30 PM</TableCell>
                <TableCell>Literatura Inglesa</TableCell>
                <TableCell>Sr. Shakespeare</TableCell>
                <TableCell className="text-right">204</TableCell>
              </TableRow>
               <TableRow>
                <TableCell className="font-medium">12:30 PM - 1:30 PM</TableCell>
                <TableCell colSpan={3} className="text-center text-muted-foreground">Descanso para Almorzar</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
