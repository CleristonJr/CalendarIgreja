"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function criarIgreja(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Validando autenticação e permissão de Super Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Não autorizado")
  }

  const { data: perfil } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single()

  if (perfil?.role !== 'superadmin') {
    throw new Error("Acesso restrito a Super Administradores")
  }

  // 2. Extraindo dados do formulário
  const nome = formData.get('nome') as string
  const slug = formData.get('slug') as string

  if (!nome || !slug) {
    throw new Error("Nome e Slug (Link) são obrigatórios.")
  }

  // 3. Inserindo no banco de dados
  const { error } = await supabase
    .from('igrejas')
    .insert([{ nome, slug }])

  if (error) {
    // Tratativa para caso o slug já exista, já que é UNIQUE
    if (error.code === '23505') {
       throw new Error("Este slug/link já está sendo usado por outra igreja.")
    }
    throw new Error("Erro ao criar igreja. " + error.message)
  }

  // Se der tudo certo, atualiza a tela
  revalidatePath('/gestao')
}

// Ação de Bloqueio/Desbloqueio
export async function toggleIgreja(id: string, estadoAtual: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autorizado")
  
  const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'superadmin') throw new Error("Restrito")

  const { error } = await supabase.from('igrejas').update({ ativa: !estadoAtual }).eq('id', id)
  if (error) throw new Error("Erro de banco de dados ao tentar ativar/desativar: " + error.message)
  revalidatePath('/gestao')
}

// Ação de Toggle Pagamento
export async function togglePagamento(id: string, estadoPendenteAtual: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autorizado")
  
  const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'superadmin') throw new Error("Restrito")

  // Inverte o estado (se stava pendente, vira false. Se não tava, vira true)
  const { error } = await supabase.from('igrejas').update({ pagamento_pendente: !estadoPendenteAtual }).eq('id', id)
  if (error) throw new Error("Erro no banco de dados ao tentar negativar: " + error.message)
  
  revalidatePath('/gestao')
  // Também precisará atualizar a tela da igreja afetada:
  // revalidatePath '/' ou 'layout' para garantir a visualização local deles
  revalidatePath('/', 'layout')
}

// Ação de Deleção da Igreja
export async function deletarIgreja(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autorizado")
  
  const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'superadmin') throw new Error("Restrito")

  // Apaga a igreja (e via ON DELETE CASCADE no banco, apaga departamentos, perfis associados e eventos)
  await supabase.from('igrejas').delete().eq('id', id)
  revalidatePath('/gestao')
}

// ============================================
// FILA DE APROVAÇÃO
// ============================================

export async function aprovarSolicitacao(solicitacaoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autorizado")
  
  const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'superadmin') throw new Error("Acesso restrito a Super Administradores")

  // 1. Busca os dados da Ficha
  const { data: sol } = await supabase.from('solicitacoes_igrejas').select('*').eq('id', solicitacaoId).single()
  if (!sol) throw new Error("Solicitação não encontrada no sistema.")

  // 2. Cria Oficialmente a Igreja (Tenant Base)
  const { data: novaIgreja, error: errIg } = await supabase.from('igrejas').insert([
    { nome: sol.nome_igreja, slug: sol.slug }
  ]).select('id').single()

  if (errIg || !novaIgreja) throw new Error("Erro na consolidação da igreja: " + (errIg?.message || "Desconhecido"))

  // 3. Efetiva o dono da ficha para se tornar Ancião e atrela-o a Igreja dele.
  await supabase.from('perfis').update({ role: 'ansiao', igreja_id: novaIgreja.id }).eq('id', sol.usuario_id)

  // 4. Arquiva a solicitação como Aprovada
  await supabase.from('solicitacoes_igrejas').update({ status: 'aprovada' }).eq('id', solicitacaoId)

  revalidatePath('/gestao')
}

export async function rejeitarSolicitacao(solicitacaoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autorizado")
  
  const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'superadmin') throw new Error("Acesso restrito a Super Administradores")

  // Arquiva a solicitação como Rejeitada
  await supabase.from('solicitacoes_igrejas').update({ status: 'rejeitada' }).eq('id', solicitacaoId)

  revalidatePath('/gestao')
}

// ============================================
// GESTÃO DE SEGURANÇA DE ANSIÕES
// ============================================

export async function gerarSenhaTemporaria(alvoUserId: string) {
  const supabase = await createClient()

  // Muro de Segurança Rígido
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Conexão perdida, logue de novo." }

  const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'superadmin') return { success: false, error: "Fraude detectada: Sem privilégios." }

  try {
    // 1. Gera senha aleatória de 6 letras minúsculas e números
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
    let senhaTemp = ''
    for (let i = 0; i < 6; i++) {
       senhaTemp += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // 2. Acorda o GOD MODE (Admin API)
    const adminSupabase = createAdminClient()

    // 3. Força a alteração da Senha fisicamente no Auth
    const { error: resetError } = await adminSupabase.auth.admin.updateUserById(alvoUserId, {
      password: senhaTemp,
      email_confirm: true
    })
    
    if (resetError) return { success: false, error: "Erro Supabase: " + resetError.message }

    // 4. Marca o perfil com bandeira vermelha: forcar_troca_senha = true
    await adminSupabase.from('perfis').update({ forcar_troca_senha: true }).eq('id', alvoUserId)

    revalidatePath('/gestao')

    return { success: true, password: senhaTemp }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
