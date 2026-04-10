import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import PortalContainer from "@/components/visitante/PortalContainer";

export const revalidate = 0;

interface Props {
  params: Promise<{ igrejaSlug: string }>
}

export default async function PortalEventosPage(props: Props) {
  const params = await props.params;
  const slug = params.igrejaSlug;

  const supabase = await createClient();

  // 1. Buscando a Igreja a partir do SLUG na URL
  const { data: igreja } = await supabase
    .from("igrejas")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!igreja) {
    return notFound();
  }

  if (!igreja.ativa) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <h1 className="text-3xl font-bold mb-2">Acesso Suspenso</h1>
        <p className="text-slate-500">O sistema desta igreja está temporariamente desativado.</p>
      </div>
    )
  }

  // 2. Autenticação para repassar pra Sidebar
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: perfil } = await supabase.from('perfis').select('forcar_troca_senha, igreja_id').eq('id', user.id).single();
    if (perfil?.forcar_troca_senha) {
      redirect("/trocar-senha");
    }
  }

  // 3. Departamentos
  const { data: departamentos } = await supabase
    .from("departamentos")
    .select("*")
    .eq("igreja_id", igreja.id)
    .order("created_at", { ascending: true });

  // 4. Eventos Futuros Ordenados
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Inicio do dia local
  
  const { data: eventosDB } = await supabase
    .from("eventos")
    .select("*, departamentos(nome, cor_identificacao)")
    .eq("igreja_id", igreja.id)
    .gte("data_inicio", hoje.toISOString()) // Apenas eventos do dia atual em diante
    .order("data_inicio", { ascending: true });

  // Adapta pro formato comum esperado
  const eventos = eventosDB?.map((e: any) => ({
    id: e.id,
    title: e.titulo,
    start: e.data_inicio ? e.data_inicio.substring(0, 16) : null,
    end: e.data_fim ? e.data_fim.substring(0, 16) : null,
    backgroundColor: e.departamentos?.cor_identificacao || '#3b82f6',
    extendedProps: {
      descricao: e.descricao,
      departamento_id: e.departamento_id,
      departamento_nome: e.departamentos?.nome || 'Geral',
      convidados: e.convidados || [],
      imagem_url: e.imagem_url || null, 
    }
  })) || [];

  return (
    <PortalContainer 
      igreja={igreja}
      departamentos={departamentos || []}
      eventos={eventos}
      user={user}
      slug={slug}
    />
  );
}
