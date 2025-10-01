import { ParentAccessClient } from "@/components/dashboard/admin/parent-access-client";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export default async function ParentAccessPage() {
    await requireAdmin();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-headline font-semibold">Verificación de Acceso para Padres</h1>
                <p className="text-muted-foreground">
                    Utilice esta herramienta para confirmar que un padre solo tiene acceso a sus estudiantes autorizados.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Verificador de Acceso</CardTitle>
                    <CardDescription>
                        Ingrese los ID de padre y estudiante para verificar los permisos. Esta herramienta utiliza IA para analizar los derechos de acceso.
                    </CardDescription>
                </CardHeader>
                <ParentAccessClient />
            </Card>
        </div>
    );
}
