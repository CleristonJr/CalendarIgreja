import { Calendar, UserCircle, KeyRound, AlertCircle } from "lucide-react";
import { login } from "./actions";

export const metadata = {
  title: "Login | Calendário da Igreja",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-100 p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Acesso ao Sistema</h1>
          <p className="text-slate-500 text-sm mt-1">Gerenciamento de eventos e departamentos</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" action={login}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              E-mail de acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCircle className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email"
                name="email"
                className="pl-10 block w-full rounded-lg border border-slate-200 py-2.5 px-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm outline-none text-slate-900 placeholder:text-slate-400"
                placeholder="seu.email@exemplo.com"
                type="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                name="password"
                className="pl-10 block w-full rounded-lg border border-slate-200 py-2.5 px-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm outline-none text-slate-900 placeholder:text-slate-400"
                placeholder="••••••••"
                type="password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Entrar no Sistema
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Apenas Ansiãos e Líderes podem acessar o painel.
          </p>
        </div>
      </div>
    </div>
  );
}
