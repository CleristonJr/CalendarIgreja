import { Calendar, Building, Globe, Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SaasLandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se já tiver logado, tenta jogar para o dashboard dele
  if (user) {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('forcar_troca_senha, igrejas(slug)')
      .eq('id', user.id)
      .single();
      
    if (perfil?.forcar_troca_senha) {
      redirect("/trocar-senha");
    }

    const igrejaData = perfil?.igrejas as any;
    if (igrejaData && !Array.isArray(igrejaData) && igrejaData.slug) {
       redirect(`/${igrejaData.slug}`);
    }
  }

  // Lista de igrejas abertas no SaaS
  const { data: igrejas } = await supabase.from('igrejas').select('*');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-12">
        <div className="mx-auto w-20 h-20 bg-blue-100 flex items-center justify-center rounded-full mb-6">
          <Globe className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Gestão de Calendários para Igrejas
        </h1>
        <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
          Um sistema completo, multi-tenant. Cada igreja possui seu próprio espaço, líderes e acessos completamente isolados.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <div className="flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="w-full flex items-center justify-center p-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
          >
            Fazer Login (Ansiãos/Líderes)
          </Link>
          <p className="text-center text-sm text-slate-500">
            Sua organização ainda não está no servidor?{" "}
            <Link href="/solicitar" className="font-semibold text-blue-600 hover:underline">
              Crie a página da sua Igreja
            </Link>
          </p>
        </div>
        </div>

        <div className="border-t border-slate-100 pt-8 mt-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
            Igrejas Registradas neste Servidor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {igrejas?.length === 0 && (
              <p className="text-sm text-slate-400 col-span-2">Nenhuma igreja encontrada. Verifique o banco!</p>
            )}
            {igrejas?.map((igreja) => (
              <Link 
                key={igreja.id} 
                href={`/${igreja.slug}`}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
              >
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                  <span className="font-medium text-slate-700 group-hover:text-blue-800">{igreja.nome}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
