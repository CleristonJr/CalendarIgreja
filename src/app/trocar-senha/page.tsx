import { ShieldAlert, KeyRound } from "lucide-react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function TrocarSenhaForcadoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se não tem usuário, pra que trocar senha? Vai pro login
  if (!user) redirect("/login");

  // Ação de Formulário Server Side
  async function trocarSenhaAction(formData: FormData) {
    "use server"
    const senha = formData.get("senha") as string;
    const confirmacao = formData.get("confirmacao") as string;

    if (!senha || senha.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
    if (senha !== confirmacao) throw new Error("As senhas não coincidem.");

    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("Sessão expirada");

    // 1. Atualizar a autenticação do usuário
    const { error: authError } = await sb.auth.updateUser({ password: senha });
    if (authError) throw new Error("Falha na atualização de segurança.");

    // 2. Liberar o acesso (forcar_troca_senha = false)
    await sb.from('perfis').update({ forcar_troca_senha: false }).eq('id', user.id);

    // 3. Voltar ao fluxo normal
    revalidatePath('/', 'layout');
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-orange-500 p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Segurança Compulsória</h1>
          <p className="text-orange-100 mt-2 text-sm">
            Sua conta está usando uma credencial provisória. Por motivos de segurança, você precisa criar uma nova senha definitiva agora.
          </p>
        </div>

        <form action={trocarSenhaAction} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  name="senha"
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-900"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirme a Nova Senha</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  name="confirmacao"
                  required
                  placeholder="Repita a mesma senha"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-900"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            Cadastrar e Acessar Painel
          </button>
        </form>
      </div>
    </div>
  );
}
