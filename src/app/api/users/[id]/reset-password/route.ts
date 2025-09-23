import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema for password reset
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6).optional(),
  useRut: z.boolean().optional(),
})

// POST /api/users/[id]/reset-password -> Reset user password
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validation = resetPasswordSchema.safeParse(body)
    
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json(
        { error: firstError.message, issues: validation.error.errors },
        { status: 400 }
      )
    }

    // Create admin client to reset password
    const adminClient = createServiceRoleClient()

    let newPassword: string | undefined = undefined

    if (body.useRut) {
      // Get user's RUT from the database to use as password
      const supabase = adminClient
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('rut')
        .eq('id', userId)
        .single()

      if (userError || !userData?.rut) {
        return NextResponse.json(
          { error: userError?.message || 'User not found' },
          { status: 404 }
        )
      }

      newPassword = userData.rut
    } else if (body.newPassword) {
      // Use the provided new password
      newPassword = body.newPassword
    } else {
      return NextResponse.json(
        { error: 'Either newPassword or useRut must be provided' },
        { status: 400 }
      )
    }

    // Update the user's password in Supabase Auth
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}