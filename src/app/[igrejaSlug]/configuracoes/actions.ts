"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

async function verificarPermissaoLocal(igreja_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Acesso negado: Faça o login.")

  const { data: perfil } = await supabase.from('perfis').select('role, igreja_id').eq('id', user.id).single()
  
  if (perfil?.role === 'superadmin') return supabase; // Dono da plataforma pode tudo
  if (perfil?.role === 'ansiao' && perfil?.igreja_id === igreja_id) return supabase; // Ansião gerenciando a própria igreja
  
  throw new Error("Acesso negado: Você não tem permissão de Ansião para esta organização.")
}

export async function adicionarDepartamento(formData: FormData) {
  const nome = formData.get('nome') as string
  const cor_identificacao = formData.get('cor_identificacao') as string
  const igreja_id = formData.get('igreja_id') as string
  const slug = formData.get('slug') as string

  if (!nome || !cor_identificacao || !igreja_id) throw new Error("Dados incompletos.")
  
  const supabase = await verificarPermissaoLocal(igreja_id)

  const { error } = await supabase.from('departamentos').insert([{ 
    nome, 
    cor_identificacao, 
    igreja_id 
  }])

  if (error) throw new Error("Erro ao salvar departamento: " + error.message)
  
  revalidatePath(`/${slug}/configuracoes`)
  revalidatePath(`/${slug}`)
}

export async function deletarDepartamento(formData: FormData) {
  const dept_id = formData.get('dept_id') as string
  const igreja_id = formData.get('igreja_id') as string
  const slug = formData.get('slug') as string

  const supabase = await verificarPermissaoLocal(igreja_id)

  await supabase.from('departamentos').delete().eq('id', dept_id)
  
  revalidatePath(`/${slug}/configuracoes`)
  revalidatePath(`/${slug}`)
}

export async function criarMembro(formData: FormData) {
  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const departamento_id = formData.get('departamento_id') as string // optional
  const igreja_id = formData.get('igreja_id') as string
  const slug = formData.get('slug') as string

  if (!email || !password || !igreja_id || !nome) throw new Error("Dados incompletos.")

  await verificarPermissaoLocal(igreja_id)

  const adminClient = createAdminClient()

  // 1. Criar Auth User
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { name: nome },
    email_confirm: true
  })

  if (authError || !newUser?.user) throw new Error("Erro ao criar usuário: " + authError?.message)

  // 2. Atualizar perfil criado pelo trigger
  const { error: perfilError } = await adminClient.from('perfis').update({
    nome_completo: nome,
    igreja_id: igreja_id,
    departamento_id: departamento_id || null,
    role: 'lider'
  }).eq('id', newUser.user.id)

  if (perfilError) throw new Error("Erro ao vincular perfil: " + perfilError.message)

  revalidatePath(`/${slug}/configuracoes`)
}

export async function deletarMembro(formData: FormData) {
  const membro_id = formData.get('membro_id') as string
  const igreja_id = formData.get('igreja_id') as string
  const slug = formData.get('slug') as string

  await verificarPermissaoLocal(igreja_id)

  const adminClient = createAdminClient()
  
  // Garantir proteção
  const { data: alvo } = await adminClient.from('perfis').select('igreja_id, role').eq('id', membro_id).single()
  if (alvo?.igreja_id !== igreja_id || alvo?.role === 'ansiao') {
     throw new Error("Proibido apagar este membro.")
  }

  const { error } = await adminClient.auth.admin.deleteUser(membro_id)
  if (error) throw new Error("Erro ao excluir. " + error.message)

  revalidatePath(`/${slug}/configuracoes`)
}
