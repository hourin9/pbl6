import { useState } from "react";
import { login, sessionUser } from "../services/api";
import type { User } from "../types/models";

interface Props {
  role: "doctor" | "admin";
  onLogin: (user: User) => void;
  onBack: () => void;
}

export default function LiveAuthPage({ role, onLogin, onBack }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = role === "admin";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(name.trim(), password);
      onLogin(sessionUser(name.trim(), role));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f8f5] text-[#17343a] flex flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 12% 18%, rgba(8, 127, 117, 0.11), transparent 32rem), radial-gradient(ellipse at 88% 82%, rgba(200, 94, 72, 0.08), transparent 28rem), radial-gradient(rgba(8, 127, 117, 0.1) 0.75px, transparent 0.75px)",
          backgroundSize: "auto, auto, 24px 24px",
        }}
      />

      <button
        type="button"
        onClick={onBack}
        className="fixed top-6 left-6 z-10 inline-flex items-center gap-2 rounded-xl border border-[#dce7e2] bg-white/90 px-3.5 py-2 text-xs font-semibold text-[#42635f] shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#087f75]/40 hover:text-[#087f75]"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 10H4m5 5-5-5 5-5" />
        </svg>
        Trang chủ
      </button>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#dce7e2] bg-white/95 p-8 shadow-[0_24px_64px_rgba(23,52,58,0.09)] backdrop-blur">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2.5">
            <svg aria-hidden="true" className="h-9 w-9 text-[#087f75]" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="currentColor" />
              <path d="M20 9v22M9 20h22" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              <circle cx="20" cy="20" r="7" stroke="#fff" strokeWidth="2" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-[#17343a]">
              NeuraScan<span className="text-[#087f75]">AI</span>
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              isAdmin
                ? "border-[#c85e48]/25 bg-[#c85e48]/10 text-[#b44d38]"
                : "border-[#087f75]/25 bg-[#087f75]/10 text-[#087f75]"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-[#c85e48]" : "bg-[#087f75]"}`} />
            {isAdmin ? "Cổng Quản trị hệ thống" : "Cổng Bác sỹ chẩn đoán"}
          </div>

          <h1 className="mt-4 font-display text-3xl text-[#17343a]">Đăng nhập</h1>
          <p className="mt-1.5 text-xs text-[#647a79]">
            Xác thực phiên làm việc an toàn qua máy chủ API
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block font-mono-data text-[11px] font-medium tracking-wider text-[#647a79]">
              TÊN ĐĂNG NHẬP
            </span>
            <input
              required
              autoComplete="username"
              placeholder={isAdmin ? "Ví dụ: bigboss" : "Ví dụ: charlotte"}
              value={name}
              onChange={event => setName(event.target.value)}
              className="w-full rounded-xl border border-[#d5e2dc] bg-[#f9fbfa] px-4 py-3 text-sm text-[#17343a] placeholder-[#93a39e] outline-none transition-all focus:border-[#087f75] focus:bg-white focus:ring-4 focus:ring-[#087f75]/10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono-data text-[11px] font-medium tracking-wider text-[#647a79]">
              MẬT KHẨU
            </span>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#d5e2dc] bg-[#f9fbfa] px-4 py-3 pr-11 text-sm text-[#17343a] placeholder-[#93a39e] outline-none transition-all focus:border-[#087f75] focus:bg-white focus:ring-4 focus:ring-[#087f75]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#718581] hover:text-[#17343a]"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#dc2626]/25 bg-[#fef2f2] p-3.5 text-xs text-[#b91c1c]">
              <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !password}
            className={`mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${
              isAdmin
                ? "bg-[#c85e48] hover:bg-[#b44d38] shadow-[#c85e48]/20"
                : "bg-[#087f75] hover:bg-[#075d58] shadow-[#087f75]/20"
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Đang xác thực…
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#e5ede8] pt-4 text-[11px] text-[#718581]">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-[#087f75]">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <span>Kết nối trực tiếp qua cookie bảo mật ASP.NET</span>
        </div>
      </div>
    </main>
  );
}
