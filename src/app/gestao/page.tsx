import { Calendar, Building, ShieldCheck, Plus, CheckCircle2, Ban, Trash2, Search, AlertTriangle, CheckCircle, UserCog, Lock, Key } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { criarIgreja, toggleIgreja, deletarIgreja, togglePagamento, aprovarSolicitacao, rejeitarSolicitacao } from "./actions";
import { DeleteButton } from "./DeleteButton";
import { ResetPasswordButton } from "./ResetPasswordButton";

export const metadata = { title: "Gestão SaaS | CalendarIgreja" };

export default async function GestaoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const termoBusca = params?.q ? String(params.q) : "";
  const view = params?.view as string || "igrejas"; // Controle da ABA

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Muro de Segurança: Impedir que Ansiãos e Líderes entrem aqui
  const { data: perfil } = await supabase
    .from('perfis')
    .select('role, nome_completo')
    .eq('id', user.id)
    .single();

  if (perfil?.role !== 'superadmin') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 text-red-900">
        <ShieldCheck className="w-16 h-16 mb-4 text-red-600" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p>Você não é o dono da plataforma.</p>
      </div>
    );
  }

  // Buscando igrejas ativas para listar na tela (com ou sem filtro de busca)
  let query = supabase.from("igrejas").select("*");
  if (termoBusca) {
    query = query.or(`nome.ilike.%${termoBusca}%,slug.ilike.%${termoBusca}%`);
  }
  const { data: igrejas } = await query.order("created_at", { ascending: false });

  // Buscando Aprovações (se estivermos na aba)
  let pendentes: any[] = [];
  if (view === 'aprovacoes') {
    const { data, error } = await supabase.from('solicitacoes_igrejas').select('*').eq('status', 'pendente').order('created_at', { ascending: false });
    if (error) {
      console.error("Erro ao puxar solicitacoes:", error);
    }
    pendentes = data || [];
  }

  // Buscando Ansiões (se estivermos na aba)
  let ansioes: any[] = [];
  if (view === 'ansioes') {
    let queryAnsioes = supabase.from('perfis').select('id, nome_completo, forcar_troca_senha, igreja_id, igrejas(nome)').eq('role', 'ansiao');
    if (termoBusca) {
      queryAnsioes = queryAnsioes.ilike('nome_completo', `%${termoBusca}%`);
    }
    const { data } = await queryAnsioes;
    ansioes = data || [];
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-slate-100 text-slate-900">
      
      {/* Sidebar de Gestão */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <ShieldCheck className="w-6 h-6 text-emerald-400 mr-2" />
          <span className="font-bold text-lg">Super Admin</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link href="/gestao?view=igrejas" scroll={false} className={`flex items-center px-3 py-2.5 rounded-md font-medium transition ${view === 'igrejas' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <Building className="w-5 h-5 mr-3" />
            Igrejas Criadas
          </Link>
          <Link href="/gestao?view=ansioes" scroll={false} className={`flex items-center px-3 py-2.5 rounded-md font-medium transition ${view === 'ansioes' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <UserCog className="w-5 h-5 mr-3" />
            Gestão de Ansiões
          </Link>
          <Link href="/gestao?view=aprovacoes" scroll={false} className={`flex items-center px-3 py-2.5 rounded-md font-medium transition ${view === 'aprovacoes' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <CheckCircle className="w-5 h-5 mr-3" />
            Aprovações Pendentes
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-x-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shadow-sm shrink-0">
          <h1 className="text-lg md:text-xl font-bold text-slate-800">Painel de Gestão Multi-Tenant</h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col md:flex-row gap-6">
          
          {/* Só exibe Form de Add Igreja se estiver na aba de Igrejas Criadas */}
          {view === 'igrejas' && (
            <div className="w-full md:w-1/3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h2 className="font-semibold text-slate-800 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-blue-600" />
                    Nova Igreja (Tenant Manual)
                  </h2>
                </div>
                <form action={criarIgreja} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Oficial da Igreja</label>
                    <input
                      name="nome"
                      className="w-full rounded-md border border-slate-300 py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      placeholder="Ex: Igreja Verbo da Vida SP"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link Exclusivo (Slug)</label>
                    <div className="flex shadow-sm rounded-md overflow-hidden border border-slate-300">
                      <span className="bg-slate-50 text-slate-500 px-3 py-2 text-sm border-r border-slate-300 shrink-0">
                        site.com/
                      </span>
                      <input
                        name="slug"
                        className="flex-1 py-2 px-3 text-sm focus:outline-none"
                        placeholder="verbodavida-sp"
                        pattern="[a-z0-9-]+"
                        title="Apenas letras minúsculas, números e traços."
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Criar Infraestrutura Física
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Área Direita Dinâmica: Lista de Igrejas ou Tabela de Aprovações */}
          <div className={view === 'igrejas' ? "flex-1" : "w-full"}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center space-x-4">
                <h2 className="font-semibold text-slate-800 whitespace-nowrap">
                  {view === 'igrejas' ? 'Igrejas Operando na Plataforma' : view === 'aprovacoes' ? 'Fila de Fichas Aguardando Ativação' : 'Contas de Ansiões (Líderes Locais)'}
                </h2>

                {(view === 'igrejas' || view === 'ansioes') && (
                  <form method="GET" action="/gestao" className="flex-1 max-w-sm flex">
                    <input type="hidden" name="view" defaultValue={view} />
                    <input
                      name="q"
                      defaultValue={termoBusca}
                      placeholder={view === 'igrejas' ? "Buscar por nome ou slug..." : "Buscar pelo nome do Ansião..."}
                      className="w-full text-sm py-1.5 px-3 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    {termoBusca && (
                      <a href={`/gestao?view=${view}`} className="ml-2 py-1.5 px-3 text-sm text-slate-500 bg-slate-200 hover:bg-slate-300 rounded-md transition inline-flex items-center">
                        Limpar
                      </a>
                    )}
                    <button type="submit" className="ml-2 py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition shadow-sm">
                      Buscar
                    </button>
                  </form>
                )}

                <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full font-medium whitespace-nowrap hidden lg:block">
                  {view === 'igrejas' ? `${igrejas?.length || 0} listadas` : view === 'aprovacoes' ? `${pendentes?.length || 0} pendentes` : `${ansioes?.length || 0} lideres`}
                </span>
              </div>

              <div className="p-0 overflow-y-auto max-h-[calc(100vh-15rem)]">
                {view === 'igrejas' ? (
                  igrejas?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Nenhuma igreja operante ainda.</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                          <th className="py-3 px-6 font-medium">Igreja</th>
                          <th className="py-3 px-6 font-medium">Sufixo de URL</th>
                          <th className="py-3 px-6 font-medium">Status</th>
                          <th className="py-3 px-6 font-medium text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {igrejas?.map((ig) => {
                          const toggleAction = toggleIgreja.bind(null, ig.id, ig.ativa)
                          const deleteAction = deletarIgreja.bind(null, ig.id)
                          const togglePaymentAction = togglePagamento.bind(null, ig.id, ig.pagamento_pendente)

                          return (
                            <tr key={ig.id} className="hover:bg-slate-50">
                              <td className="py-3 px-6 font-medium text-slate-800">
                                <div className="flex items-center">
                                  {ig.nome}
                                  <Link href={`/gestao/${ig.slug}`} title="Detalhes da Igreja" className="ml-2 p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                                    <Search className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </td>
                              <td className="py-3 px-6 font-mono text-xs text-blue-600">/{ig.slug}</td>
                              <td className="py-3 px-6">
                                <div className="flex flex-col space-y-1.5">
                                  {ig.ativa && !ig.pagamento_pendente && (
                                    <span className="flex items-center text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded w-max">
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> Regular
                                    </span>
                                  )}
                                  {!ig.ativa && (
                                    <span className="flex items-center text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-1 rounded w-max">
                                      <Ban className="w-3 h-3 mr-1" /> Suspenso
                                    </span>
                                  )}
                                  {ig.pagamento_pendente && (
                                    <span className="flex items-center text-xs text-white font-bold bg-red-500 px-2 py-1 rounded w-max shadow-sm">
                                      <AlertTriangle className="w-3 h-3 mr-1" /> Negativado
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-6">
                                <div className="flex items-center justify-end space-x-2">
                                  <form action={togglePaymentAction}>
                                    <button title={ig.pagamento_pendente ? "Perdoar Dívida" : "Cobrar fatura em aberto"} className={`py-1.5 px-3 rounded text-xs font-medium transition ${ig.pagamento_pendente ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                                      {ig.pagamento_pendente ? 'Tirar Negativação' : 'Negativar'}
                                    </button>
                                  </form>

                                  <form action={toggleAction}>
                                    <button
                                      className={`py-1.5 px-3 rounded text-xs font-medium transition ${ig.ativa ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                    >
                                      {ig.ativa ? 'Desligar Sist.' : 'Ligar Sist.'}
                                    </button>
                                  </form>

                                  <form action={deleteAction}>
                                    <DeleteButton />
                                  </form>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                ) : view === 'ansioes' ? (
                  // View Ansioes
                  ansioes.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center text-slate-400">
                      <UserCog className="w-10 h-10 mb-3 text-slate-200" />
                      Nenhum Ansião cadastrado e validado no sistema.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                          <th className="py-3 px-6 font-medium">Líder Conectado</th>
                          <th className="py-3 px-6 font-medium">Organização Alvo</th>
                          <th className="py-3 px-6 font-medium">Segurança</th>
                          <th className="py-3 px-6 font-medium text-right">Controles de Segurança</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {ansioes?.map((lider) => {
                          return (
                            <tr key={lider.id} className="hover:bg-slate-50">
                              <td className="py-3 px-6 font-medium text-slate-800">
                                <div className="flex items-center">
                                  {lider.nome_completo}
                                </div>
                              </td>
                              <td className="py-3 px-6 text-slate-600">
                                {lider.igrejas?.nome || <span className="text-slate-400 italic">Desvinculado</span>}
                              </td>
                              <td className="py-3 px-6">
                                {lider.forcar_troca_senha ? (
                                  <span className="flex items-center text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded w-max border border-orange-200">
                                    <Lock className="w-3 h-3 mr-1" /> Troca Pendente
                                  </span>
                                ) : (
                                  <span className="flex items-center text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded w-max border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Seguro
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-6">
                                <div className="flex items-center justify-end space-x-2">
                                  <ResetPasswordButton userId={lider.id} />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                ) : (
                  // View Aprovações
                  pendentes.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center text-slate-400">
                      <CheckCircle className="w-10 h-10 mb-3 text-slate-200" />
                      Caixa Limpa! Nenhuma solicitação pendente.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                          <th className="py-3 px-6 font-medium">Igreja Solicitada</th>
                          <th className="py-3 px-6 font-medium">URL Desejada</th>
                          <th className="py-3 px-6 font-medium text-right">Ação SuperAdmin</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {pendentes?.map((req) => {
                          const routeApprove = aprovarSolicitacao.bind(null, req.id)
                          const routeReject = rejeitarSolicitacao.bind(null, req.id)

                          return (
                            <tr key={req.id} className="hover:bg-amber-50/20 bg-amber-50/10">
                              <td className="py-3 px-6 font-medium text-slate-800">
                                {req.nome_igreja}
                              </td>
                              <td className="py-3 px-6 font-mono text-xs text-amber-600">/{req.slug}</td>
                              <td className="py-3 px-6">
                                <div className="flex items-center justify-end space-x-2">
                                  <form action={routeReject}>
                                    <button className="py-1.5 px-3 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition">
                                      Recusar Ficha
                                    </button>
                                  </form>

                                  <form action={routeApprove}>
                                    <button className="py-1.5 px-5 rounded text-xs font-bold bg-green-500 text-white hover:bg-green-600 shadow-sm transition">
                                      Aprovar e Ativar
                                    </button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
