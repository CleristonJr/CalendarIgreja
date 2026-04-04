import { ArrowLeft, Building, Users, Calendar, MapPin, UserCheck, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function GestaoIgrejaDetalhes({
  params,
}: {
  params: Promise<{ igrejaSlug: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase.from('perfis').select('role').eq('id', user.id).single();
  if (perfil?.role !== 'superadmin') {
    redirect("/login");
  }

  const resolvedParams = await params;
  const slug = resolvedParams.igrejaSlug;

  // 1. Buscando a igreja
  const { data: igreja } = await supabase.from("igrejas").select("*").eq("slug", slug).single();
  if (!igreja) return notFound();

  // 2. Buscando métricas e as listagens
  const { count: deptCount } = await supabase.from("departamentos").select("*", { count: "exact", head: true }).eq("igreja_id", igreja.id);
  const { count: eventosCount } = await supabase.from("eventos").select("*", { count: "exact", head: true }).eq("igreja_id", igreja.id);
  const { data: ansiaos } = await supabase.from("perfis").select("*").eq("igreja_id", igreja.id).eq("role", "ansiao");

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900">
      <main className="flex-1 flex flex-col overflow-hidden max-w-6xl mx-auto w-full">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm justify-between">
          <div className="flex items-center">
            <Link href="/gestao" className="mr-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center">
                <Building className="w-5 h-5 mr-2 text-indigo-600" />
                {igreja.nome}
              </h1>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" /> /{igreja.slug}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {igreja.pagamento_pendente && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm flex items-center">
                <ShieldAlert className="w-3 h-3 mr-1" /> Igreja Negativada
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${igreja.ativa ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {igreja.ativa ? 'Sistema Ativo' : 'Sistema Suspenso'}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-6">
          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
              <div className="bg-indigo-50 p-4 rounded-lg mr-4">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Departamentos</p>
                <p className="text-2xl font-bold text-slate-800">{deptCount || 0}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
              <div className="bg-emerald-50 p-4 rounded-lg mr-4">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Eventos Cadastrados</p>
                <p className="text-2xl font-bold text-slate-800">{eventosCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Gestão de Ansiãos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-indigo-600" />
                Ansiãos desta Igreja
              </h2>
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition">
                + Associar Ansião
              </button>
            </div>
            <div className="p-0">
              {ansiaos?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <ShieldAlert className="w-10 h-10 text-orange-400 mb-2" />
                  Nenhum ansião associado. Essa igreja está sem administrador local!
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                      <th className="py-3 px-6 font-medium">Nome</th>
                      <th className="py-3 px-6 font-medium">Status no Banco</th>
                      <th className="py-3 px-6 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {ansiaos?.map(ansiao => (
                      <tr key={ansiao.id}>
                        <td className="py-3 px-6 font-medium text-slate-800">{ansiao.nome_completo || 'Sem Nome Cadastrado'}</td>
                        <td className="py-3 px-6 text-emerald-600 font-mono text-xs">Vínculo Ativo</td>
                        <td className="py-3 px-6 flex justify-end">
                          <button className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded transition">Remover Vínculo</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
