"use server"

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function criarEvento(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Acesso negado: Faça o login.")
  
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string
  const data_inicio = formData.get('data_inicio') as string
  const data_fim = formData.get('data_fim') as string
  const departamento_id = formData.get('departamento_id') as string | null
  const colaboradores_ids = formData.getAll('colaboradores_ids') as string[]
  const igreja_id = formData.get('igreja_id') as string
  const slug = formData.get('slug') as string
  const is_recurring = formData.get('is_recurring') === 'true'

  if (!titulo || !data_inicio || !data_fim) throw new Error("Preencha todos os campos obrigatórios.")

  const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()

  if (!perfil || (perfil.role !== 'ansiao' && perfil.role !== 'superadmin')) {
    throw new Error("Acesso Negado: Apenas o Ansião tem permissão para criar eventos.")
  }

  // Ansião só pode criar evento na SUA igreja
  if (perfil.role === 'ansiao' && perfil.igreja_id !== igreja_id) {
    throw new Error("Acesso Negado: Você só pode criar eventos na sua própria igreja.")
  }

  const baseInsert: any = {
    igreja_id,
    titulo,
    descricao,
    responsavel_id: user.id,
    colaboradores_ids: colaboradores_ids.length > 0 ? colaboradores_ids : [],
  }

  if (departamento_id && departamento_id.trim() !== "") {
    baseInsert.departamento_id = departamento_id
  }

  if (!is_recurring) {
    // Evento único (comportamento original)
    const { error } = await supabase.from('eventos').insert([{
      ...baseInsert,
      data_inicio,
      data_fim,
    }])
    if (error) throw new Error("Erro no Supabase: " + error.message)
  } else {
    // Evento Recorrente — Criar 26 semanas (6 meses) de instâncias
    const recorrencia_id = crypto.randomUUID()
    const startBase = new Date(data_inicio)
    const endBase = new Date(data_fim)
    const diffMs = endBase.getTime() - startBase.getTime() // duração do evento

    const payloadArray: any[] = []
    for (let i = 0; i < 26; i++) {
      const newStart = new Date(startBase.getTime() + (i * 7 * 24 * 60 * 60 * 1000))
      const newEnd = new Date(newStart.getTime() + diffMs)

      payloadArray.push({
        ...baseInsert,
        data_inicio: newStart.toISOString(),
        data_fim: newEnd.toISOString(),
        recorrencia_id,
      })
    }

    const { error } = await supabase.from('eventos').insert(payloadArray)
    if (error) throw new Error("Erro no Supabase ao criar recorrências: " + error.message)
  }

  revalidatePath(`/${slug}`)
}

export async function editarEvento(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Acesso negado.")

  const evento_id = formData.get('evento_id') as string
  const titulo = formData.get('titulo') as string
  const descricao = formData.get('descricao') as string
  const data_inicio = formData.get('data_inicio') as string
  const data_fim = formData.get('data_fim') as string
  const departamento_id = formData.get('departamento_id') as string | null
  const colaboradores_ids = formData.getAll('colaboradores_ids') as string[]
  const convidados_json = formData.get('convidados_json') as string
  const slug = formData.get('slug') as string
  const modo_edicao = formData.get('modo_edicao') as string || 'single' // 'single' | 'future'

  let convidados: any[] = [];
  try {
    if (convidados_json) {
      convidados = JSON.parse(convidados_json);
    }
  } catch(e) { console.error("Erro ao dar parse em convidados JSON") }

  const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
  const { data: evento_original } = await supabase.from('eventos').select('*').eq('id', evento_id).single()

  if (!perfil || !evento_original) throw new Error("Dados não encontrados.")

  // Verificação de isolamento entre igrejas
  if (perfil.role !== 'superadmin' && perfil.igreja_id !== evento_original.igreja_id) {
    throw new Error("Acesso Negado: Você não pode editar eventos de outra igreja.")
  }

  const isAnsiao = perfil.role === 'ansiao' || perfil.role === 'superadmin';
  const isOrganizador = isAnsiao || (perfil.role === 'lider' && perfil.departamento_id === evento_original.departamento_id && perfil.departamento_id !== null);
  
  const isColaborador = perfil.role === 'lider' && perfil.departamento_id !== null && 
                       (evento_original.colaboradores_ids || []).includes(perfil.departamento_id);

  if (!isOrganizador && !isColaborador) {
    throw new Error("Acesso Negado: Você não tem permissões para esse evento.")
  }

  let objUpdate: any = {}

  if (isOrganizador) {
    objUpdate = {
      titulo,
      descricao,
      data_inicio,
      data_fim,
      colaboradores_ids: colaboradores_ids.length > 0 ? colaboradores_ids : [],
      convidados
    };

    if (!isAnsiao) {
       objUpdate.departamento_id = perfil.departamento_id; 
    } else {
       if (departamento_id && departamento_id.trim() !== "") {
         objUpdate.departamento_id = departamento_id;
       } else {
         objUpdate.departamento_id = null;
       }
    }
  } else if (isColaborador) {
    objUpdate = {
      convidados
    };
  }

  // ===== LÓGICA DE EDIÇÃO EM CASCATA =====
  if (modo_edicao === 'future' && evento_original.recorrencia_id && isOrganizador) {
    // Campos permitidos para cascata: descricao, departamento_id, colaboradores_ids, convidados, horários
    // Para horários: extraímos hora:minuto do evento editado e aplicamos nos futuros, mantendo a data (dia)
    const novoInicio = new Date(data_inicio)
    const novoFim = new Date(data_fim)
    const horaInicio = novoInicio.getHours()
    const minInicio = novoInicio.getMinutes()
    const horaFim = novoFim.getHours()
    const minFim = novoFim.getMinutes()

    // Buscar todos os eventos futuros da série (incluindo o atual)
    const { data: eventosFuturos } = await supabase
      .from('eventos')
      .select('*')
      .eq('recorrencia_id', evento_original.recorrencia_id)
      .gte('data_inicio', evento_original.data_inicio)
      .order('data_inicio', { ascending: true })

    if (eventosFuturos && eventosFuturos.length > 0) {
      for (const ev of eventosFuturos) {
        const evStart = new Date(ev.data_inicio)
        const evEnd = new Date(ev.data_fim)
        
        // Preservar a data (dia) mas aplicar os novos horários
        evStart.setHours(horaInicio, minInicio, 0, 0)
        evEnd.setHours(horaFim, minFim, 0, 0)

        const cascadeUpdate: any = {
          descricao: objUpdate.descricao,
          colaboradores_ids: objUpdate.colaboradores_ids,
          convidados: objUpdate.convidados,
          data_inicio: evStart.toISOString(),
          data_fim: evEnd.toISOString(),
        }

        if (objUpdate.departamento_id !== undefined) {
          cascadeUpdate.departamento_id = objUpdate.departamento_id
        }

        await supabase.from('eventos').update(cascadeUpdate).eq('id', ev.id)
      }
    }
  } else {
    // Edição simples (apenas este evento)
    const { error } = await supabase.from('eventos').update(objUpdate).eq('id', evento_id)
    if (error) throw new Error("Erro de atualização: " + error.message)
  }

  revalidatePath(`/${slug}`)
}

export async function deletarEvento(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Acesso negado.")

  const evento_id = formData.get('evento_id') as string
  const slug = formData.get('slug') as string
  const modo_exclusao = formData.get('modo_exclusao') as string || 'single' // 'single' | 'future'

  const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()
  const { data: evento_original } = await supabase.from('eventos').select('*').eq('id', evento_id).single()

  if (!perfil || !evento_original) throw new Error("Dados não encontrados.")

  // Verificação de isolamento entre igrejas
  if (perfil.role !== 'superadmin' && perfil.igreja_id !== evento_original.igreja_id) {
    throw new Error("Acesso Negado: Você não pode excluir eventos de outra igreja.")
  }

  const isAnsiao = perfil.role === 'ansiao' || perfil.role === 'superadmin';
  const isOrganizador = isAnsiao || (perfil.role === 'lider' && perfil.departamento_id === evento_original.departamento_id && perfil.departamento_id !== null);

  if (!isOrganizador) {
    throw new Error("Acesso Negado: Apenas o Organizador ou Ansião podem excluir o evento.")
  }

  if (modo_exclusao === 'future' && evento_original.recorrencia_id) {
    // Excluir este e todos os futuros da série
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('recorrencia_id', evento_original.recorrencia_id)
      .gte('data_inicio', evento_original.data_inicio)
    
    if (error) throw new Error("Erro ao excluir série: " + error.message)
  } else {
    // Excluir apenas este evento
    const { error } = await supabase.from('eventos').delete().eq('id', evento_id)
    if (error) throw new Error("Erro ao excluir: " + error.message)
  }

  revalidatePath(`/${slug}`)
}
