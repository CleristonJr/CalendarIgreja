import { ArrowLeft, Plus, Settings, ShieldCheck, Tag, Trash2, Users, UserPlus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { adicionarDepartamento, deletarDepartamento, criarMembro, deletarMembro } from "./actions";
import MenuSidebar from "@/components/MenuSidebar";
import GerenciadorDepartamentos from "@/components/GerenciadorDepartamentos";
import GerenciadorDoxologiaTemplates from "@/components/GerenciadorDoxologiaTemplates";
import GerenciadorLogo from "@/components/GerenciadorLogo";
import GerenciadorEquipe from "@/components/GerenciadorEquipe";

// Paleta de Cores com base na indentidade Adventista
const PALETA_CORES = [
  { hex: "#0F365B", nome: "Manto (Azul Marinho)" },
  { hex: "#BFA15F", nome: "Dourado Velho / Ouro" },
  { hex: "#2C5F2D", nome: "Bosque (Verde Floresta)" },
  { hex: "#8B1214", nome: "Vinho Profundo" },
  { hex: "#F59E0B", nome: "Laranja (Aventureiros)" },
  { hex: "#1D4ED8", nome: "Azul Brilhante (Desbravadores)" },
  { hex: "#E11D48", nome: "Rosa Forte / Coral" },
  { hex: "#6366F1", nome: "Índigo/Roxo (Jovens)" },
  { hex: "#0EA5E9", nome: "Céu (Azul Claro)" },
  { hex: "#475569", nome: "Cinza Chumbo" },
];

export default async function ConfiguracoesIgreja({
  params,
}: {
  params: Promise<{ igrejaSlug: string }>
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.igrejaSlug;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Buscando Igreja
  const { data: igreja } = await supabase.from("igrejas").select("*").eq("slug", slug).single();
  if (!igreja) return notFound();

  // Validando se é o dono dessa igreja, superadmin, ou líder
  const { data: perfil } = await supabase.from('perfis').select('key:id, role, igreja_id, departamento_id').eq('id', user.id).single();

  if (!perfil || (perfil.role !== 'superadmin' && perfil.igreja_id !== igreja.id)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 text-red-900">
        <ShieldCheck className="w-16 h-16 mb-4 text-red-600" />
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-red-700">Você não tem permissão para acessar esta página.</p>
        <Link href={`/${slug}`} className="mt-6 px-4 py-2 bg-slate-900 text-white rounded">Voltar ao Calendário</Link>
      </div>
    );
  }

  const isLider = perfil.role === 'lider';

  // Buscando departamentos desta igreja
  const { data: departamentos } = await supabase.from("departamentos").select("*").eq("igreja_id", igreja.id).order('created_at');

  // Buscando Membros (Líderes, Anciãos) desta igreja
  const { data: membros } = await supabase
    .from("perfis")
    .select("*, departamentos(nome, cor_identificacao)")
    .eq("igreja_id", igreja.id)
    .order('created_at');

  // Buscando Templates de Doxologia desta igreja
  const { data: templates } = await supabase
    .from("doxologia_templates")
    .select("*")
    .eq("igreja_id", igreja.id)
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      <MenuSidebar 
        igreja={igreja} 
        slug={slug} 
        departamentos={departamentos || []} 
        user={user} 
        paginaAtiva="configuracoes" 
      />

      <main className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 pl-14 md:px-8 shrink-0 w-full mb-6 relative">
          <h1 className="text-lg sm:text-xl font-semibold truncate text-slate-800 flex items-center w-full">
            <Settings className="w-5 h-5 mr-3 text-slate-400 hidden sm:block" />
            Configurações: {igreja.nome}
          </h1>
        </header>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full pb-10">
          <p className="text-slate-500 mb-8 mt-2">
            {isLider ? "Gerenciamento da equipe do seu departamento." : "Gestão local de cores, departamentos e membros da equipe."}
          </p>

        {isLider ? (
          <GerenciadorEquipe 
            igreja={igreja} 
            slug={slug} 
            departamentos={departamentos || []} 
            perfil={perfil} 
          />
        ) : (
          <>
            {/* 1. SETUP DA IGREJA */}
            <GerenciadorLogo 
              igreja={igreja}
              slug={slug}
            />

            {/* 2. ESTRUTURA DE DEPARTAMENTOS */}
            <GerenciadorDepartamentos 
              igreja={igreja} 
              slug={slug} 
              departamentos={departamentos || []} 
              PALETA_CORES={PALETA_CORES} 
            />

            {/* 3. ACESSOS E LÍDERES (MEMBROS DO SISTEMA) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
                  Gerenciar Acessos e Líderes
                </h2>
                <p className="text-sm text-slate-500 mt-1 ml-7">
                  Adicione ou remova líderes que poderão gerenciar departamentos e acessar o sistema.
                </p>
              </div>

              <div className="p-6 md:flex md:space-x-8">
                {/* Lado Esquerdo: Formulário */}
                <div className="md:w-1/3 mb-8 md:mb-0">
                  <form action={criarMembro} className="space-y-4">
                <input type="hidden" name="igreja_id" value={igreja.id} />
                <input type="hidden" name="slug" value={slug} />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                  <input name="nome" placeholder="Ex: Roberto Justos" required className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail de Acesso</label>
                  <div className="flex border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-indigo-600 transition overflow-hidden bg-white">
                    <input 
                      name="email_prefix" 
                      type="text" 
                      placeholder="roberto" 
                      required 
                      className="w-full text-sm px-3 py-2.5 outline-none border-none bg-transparent" 
                    />
                    <div className="flex items-center px-3 bg-slate-100 border-l border-slate-300 text-slate-500 text-[13px] font-bold shrink-0">
                      @{slug}.com
                    </div>
                  </div>
                  <input type="hidden" name="email_suffix" value={`@${slug}.com`} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Senha Inicial</label>
                  <input name="password" type="text" placeholder="Mínimo 6 caracteres" required minLength={6} className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Departamento (Opcional)</label>
                  <select name="departamento_id" className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition bg-white text-slate-700">
                    <option value="">Acesso Global (Sem restrição)</option>
                    {departamentos?.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="w-full flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition mt-2">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Convidar Membro
                </button>
              </form>
            </div>

            {/* Lado Direito: Lista de Equipe */}
            <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 pt-8 md:pt-0">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Equipe Cadastrada ({membros?.length})</h3>

              {membros?.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                  Nenhum membro listado.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {membros?.map(m => (
                    <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition shadow-sm group">

                      <div className="flex items-start space-x-3 mb-2 sm:mb-0">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold shrink-0">
                          {m.nome_completo?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight flex items-center gap-2">
                            {m.nome_completo || "Usuário"}
                            {m.role === 'ansiao' && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">ANCIÃO</span>}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{m.id.substring(0, 8)}... • Acesso validado</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                        {/* Identificador de Departamento */}
                        {m.departamentos ? (
                          <div className="flex items-center text-xs font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: m.departamentos.cor_identificacao }}></span>
                            {m.departamentos.nome}
                          </div>
                        ) : (
                          <div className="text-xs font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 text-slate-500">
                            Acesso Global
                          </div>
                        )}

                        {m.role !== 'ansiao' && m.role !== 'superadmin' && m.id !== user.id && (
                          <form action={deletarMembro}>
                            <input type="hidden" name="membro_id" value={m.id} />
                            <input type="hidden" name="igreja_id" value={igreja.id} />
                            <input type="hidden" name="slug" value={slug} />
                            <button type="submit" title="Excluir Acesso" className="text-slate-300 hover:text-red-500 transition p-1 border hover:border-red-200 hover:bg-red-50 rounded-md">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
            
        {/* 4. EQUIPES INTERNAS DOS DEPARTAMENTOS */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Membros Voluntários dos Departamentos</h3>
              <GerenciadorEquipe 
                igreja={igreja} 
                slug={slug} 
                departamentos={departamentos || []} 
                perfil={perfil} 
              />
            </div>

            {/* 5. TEMPLATES E ROTINAS DE CULTO */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Templates de Eventos</h3>
              <GerenciadorDoxologiaTemplates
                igreja={igreja}
                slug={slug}
                templates={templates || []}
              />
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}
