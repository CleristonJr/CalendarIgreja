"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !authData.user) {
    const errorMsg = error?.message || 'Credenciais inválidas. Tente novamente.';
    return redirect(`/login?error=${encodeURIComponent(errorMsg)}`)
  }

  // Identificando de qual igreja este usuário é
  const { data: perfil } = await supabase
    .from('perfis')
    .select('igrejas(slug)')
    .eq('id', authData.user.id)
    .single();

  let destino = '/'; // Landing page padrão
  
  const igrejaData = perfil?.igrejas as any;
  if (igrejaData && !Array.isArray(igrejaData) && igrejaData.slug) {
     destino = `/${igrejaData.slug}`;
  }

  revalidatePath(destino, 'layout')
  redirect(destino)
}
