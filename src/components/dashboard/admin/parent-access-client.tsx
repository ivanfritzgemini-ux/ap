"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { checkParentAccess } from "@/app/actions";
import type { ConfirmParentStudentAccessOutput } from "@/ai/flows/parent-student-access";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const FormSchema = z.object({
  parentId: z.string().min(1, "El ID del padre es obligatorio."),
  studentIds: z.string().min(1, "Se requiere al menos un ID de estudiante."),
  accessibleStudentIds: z.string().min(1, "Se requiere al menos un ID de estudiante accesible."),
});

type FormValues = z.infer<typeof FormSchema>;

export function ParentAccessClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConfirmParentStudentAccessOutput | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);

    const input = {
      parentId: data.parentId,
      studentIds: data.studentIds.split(',').map(id => id.trim()),
      accessibleStudentIds: data.accessibleStudentIds.split(',').map(id => id.trim()),
    };

    try {
      const response = await checkParentAccess(input);
      setResult(response);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo verificar el acceso de los padres.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="parentId">ID del Padre</Label>
            <Input 
              id="parentId" 
              placeholder="p.ej., padre-123" 
              {...register("parentId")}
            />
            {errors.parentId && <p className="text-sm text-destructive">{errors.parentId.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="studentIds">IDs de Estudiantes Autorizados</Label>
            <Input
              id="studentIds"
              placeholder="p.ej., estudiante-abc, estudiante-def"
              {...register("studentIds")}
            />
            <p className="text-xs text-muted-foreground">
              Lista separada por comas de los IDs de los estudiantes a los que este padre *debería* tener acceso.
            </p>
             {errors.studentIds && <p className="text-sm text-destructive">{errors.studentIds.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accessibleStudentIds">IDs de Estudiantes Actualmente Accesibles</Label>
            <Input
              id="accessibleStudentIds"
              placeholder="p.ej., estudiante-abc, estudiante-xyz"
              {...register("accessibleStudentIds")}
            />
            <p className="text-xs text-muted-foreground">
              Lista separada por comas de los IDs de los estudiantes a los que este padre *actualmente* tiene acceso en el sistema.
            </p>
             {errors.accessibleStudentIds && <p className="text-sm text-destructive">{errors.accessibleStudentIds.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar Acceso
          </Button>
        </CardFooter>
      </form>
      {result && (
        <div className="px-6 pb-6">
          <Alert variant={result.isValidAccess ? "default" : "destructive"} className={result.isValidAccess ? "border-green-500" : ""}>
            {result.isValidAccess ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.isValidAccess ? "Acceso Válido" : "Acceso Inválido"}</AlertTitle>
            <AlertDescription>{result.reason}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
