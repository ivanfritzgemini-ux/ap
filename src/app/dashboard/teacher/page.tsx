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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const students = [
  { id: "s1", name: "Alice Johnson" },
  { id: "s2", name: "Bob Williams" },
  { id: "s3", name: "Charlie Brown" },
  { id: "s4", name: "Diana Miller" },
  { id: "s5", name: "Ethan Davis" },
];

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-semibold">Asistencia</h1>
        <p className="text-muted-foreground">
          Marcar la asistencia para tus clases.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tomar Asistencia</CardTitle>
          <CardDescription>
            Seleccione una clase y marque el estado de asistencia de cada estudiante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="class-select">Seleccionar Clase</Label>
            <Select>
              <SelectTrigger id="class-select">
                <SelectValue placeholder="Seleccione una clase..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="math-10">Grado 10 - Matemáticas</SelectItem>
                <SelectItem value="phy-11">Grado 11 - Física</SelectItem>
                <SelectItem value="eng-9">Grado 9 - Inglés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <form>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Estudiante</TableHead>
                    <TableHead className="text-center w-[300px]">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <RadioGroup defaultValue="present" className="flex justify-around">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="present" id={`${student.id}-present`} />
                            <Label htmlFor={`${student.id}-present`}>Presente</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                            <Label htmlFor={`${student.id}-absent`}>Ausente</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="late" id={`${student.id}-late`} />
                            <Label htmlFor={`${student.id}-late`}>Tarde</Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4">
              <Button>Enviar Asistencia</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
