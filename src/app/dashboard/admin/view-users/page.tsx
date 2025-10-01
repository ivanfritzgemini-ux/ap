
import { UserManagementClient } from '@/components/dashboard/admin/user-management-client'
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export default async function ViewUsersPage() {
  await requireAdmin();

  // Render the client-side user management component which will fetch data from our new API
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-semibold">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de usuarios (crear, editar, eliminar)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Client component handles fetching and actions */}
          <UserManagementClient />
        </CardContent>
      </Card>
    </div>
  )
}
