import { Calendar as CalendarIcon, Users, LayoutDashboard, Settings, LogOut, Circle, Building, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import Calendario from "@/components/Calendario";
import NovoEventoModal from "@/components/NovoEventoModal";
import MenuSidebar from "@/components/MenuSidebar";

export const revalidate = 0;

interface Props {
  params: Promise<{ igrejaSlug: string, departamentoId: string }>
}

export default async function DepartamentoDashboard(props: Props) {
  const params = await props.params;
  const slug = params.igrejaSlug;
  const departamentoId = params.departamentoId;

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

  // 2. Buscando o usuário atual para controle de tela
  const { data: { user } } = await supabase.auth.getUser();

  let role = 'visitante';
  let userDeptId = null;

  // Muro de Segurança e Definições de Permissão
  if (user) {
    const { data: perfil } = await supabase.from('perfis').select('forcar_troca_senha, role, departamento_id').eq('id', user.id).single();
    if (perfil?.forcar_troca_senha) {
      redirect("/trocar-senha");
    }
    role = perfil?.role || 'visitante';
    userDeptId = perfil?.departamento_id || null;
  }

  // 3. Buscando departamentos restritos A ESTA IGREJA
  const { data: departamentos } = await supabase
    .from("departamentos")
    .select("*")
    .eq("igreja_id", igreja.id)
    .order("created_at", { ascending: true });

  const departamentoAtual = departamentos?.find(d => d.id === departamentoId);
  if (!departamentoAtual) {
    return notFound();
  }

  // 4. Buscando os Eventos deste departamento (Organizador OU Colaborador)
  const { data: eventosDB } = await supabase
    .from("eventos")
    .select("*, departamentos(cor_identificacao)")
    .eq("igreja_id", igreja.id)
    .or(`departamento_id.eq.${departamentoId},colaboradores_ids.cs.{${departamentoId}}`);

  const eventosCalendario = eventosDB?.map((e: any) => ({
    id: e.id,
    title: e.titulo,
    start: e.data_inicio ? e.data_inicio.substring(0, 16) : null,
    end: e.data_fim ? e.data_fim.substring(0, 16) : null,
    backgroundColor: e.departamentos?.cor_identificacao || '#3b82f6',
    extendedProps: {
      descricao: e.descricao,
      departamento_id: e.departamento_id,
      departamento_nome: departamentoAtual.nome,
      colaboradores_ids: e.colaboradores_ids || [],
      convidados: e.convidados || [],
      recorrencia_id: e.recorrencia_id || null
    }
  })) || [];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      <MenuSidebar 
        igreja={igreja} 
        slug={slug} 
        departamentos={departamentos || []} 
        user={user} 
        departamentoAtivoId={departamentoAtual.id}
        paginaAtiva="calendario" 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 pl-14 md:px-8 shrink-0 w-full">
          <h1 className="text-lg sm:text-xl font-semibold flex items-center truncate sm:mr-4">
            <span className="text-slate-400 font-normal mr-1 sm:mr-2 hidden sm:inline">Calendário /</span> 
            <span className="ml-1 sm:ml-2 truncate" style={{ color: departamentoAtual.cor_identificacao }}>{departamentoAtual.nome}</span>
          </h1>
          <div className="flex space-x-3">
            {(role === 'ansiao' || role === 'superadmin') && (
              <NovoEventoModal
                igreja_id={igreja.id}
                slug={slug}
                departamentos={departamentos || []}
              />
            )}
          </div>
        </header>

        {/* Alerta de Inadimplência Opcional */}
        {igreja.pagamento_pendente && (
          <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-center text-sm font-medium shadow-md w-full relative z-10 shrink-0">
            <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
            <span>
              <strong>Aviso Importante:</strong> Identificamos uma fatura pendente. Por favor, regularize o pagamento, pois o sistema poderá ser suspenso a qualquer momento.
            </span>
          </div>
        )}

        {/* Calendar Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
          <Calendario
            eventos={eventosCalendario}
            isReadOnly={!user}
            userRole={role}
            userDeptId={userDeptId}
            slug={slug}
            departamentos={departamentos || []}
          />
        </div>
      </main>
    </div>
  );
}
