"use server"

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function criarSolicitacaoIgreja(formData: FormData) {
  const nome_ansiao = formData.get('nome_ansiao') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nome_igreja = formData.get('nome_igreja') as string

  if (!email || !password || !nome_igreja) {
    throw new Error("Todos os campos cruciais são obrigatórios.")
  }

  const supabase = await createClient()

  // 1. Geração Inteligente e Única do Slug
  let baseSlug = nome_igreja
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'igreja';

  let slugUnico = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const { data: conflitoIg } = await supabase.from('igrejas').select('slug').eq('slug', slugUnico).single();
    const { data: conflitoSol } = await supabase.from('solicitacoes_igrejas').select('slug').eq('slug', slugUnico).single();
    
    if (!conflitoIg && !conflitoSol) {
      isUnique = true;
    } else {
      slugUnico = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // 2. Faz o SignUp Autenticado (Cria e Reserva a conta)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: nome_ansiao
      }
    }
  })

  // Se o email já estiver em uso, ele retorna error
  if (authError) throw new Error("Erro ao registrar e-mail (já está em uso?): " + authError.message)
  
  if (!authData.user) throw new Error("Falha ao gerar o ID do usuário.")

  // 3. Atualiza o perfil criado automaticamente pelo trigger, apenas garantindo o nome dele
  await supabase.from('perfis').update({ nome_completo: nome_ansiao }).eq('id', authData.user.id)

  // 4. Insere a ficha na Fila de Aprovação
  const { error: insertError } = await supabase.from('solicitacoes_igrejas').insert([{
    usuario_id: authData.user.id,
    nome_igreja,
    slug: slugUnico,
    status: 'pendente'
  }])

  if (insertError) {
    // Reverter conta criada (idealmente), mas vamos estourar pra frente
    console.error(insertError)
    throw new Error("Erro na solicitação: " + insertError.message)
  }

  // Deslogamos o usuário forçadamente, porque senão o signUp o deixa logado sem permissão
  await supabase.auth.signOut()

  return true;
}
