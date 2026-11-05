import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../services/supabase';
import { Sparkles, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
interface AuthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess }) => {
  const { language, setLanguage } = useLanguage(); // <- BU SATIRI EKLE
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* relative sınıfını ekledik */}
      <div className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        
        {/* SAĞ ÜST KÖŞE: TR / EN DİL BUTONU */}
        <div className="absolute top-5 right-5 flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-[11px] z-10">
          <button
            type="button"
            onClick={() => setLanguage('tr')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
              language === 'tr'
                ? 'bg-[#0052FF] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            TR
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
              language === 'en'
                ? 'bg-[#0052FF] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0052FF] to-[#00D2FF] flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(0,82,255,0.3)]">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isSignUp
              ? language === 'tr' ? 'Hesap Oluştur' : 'Create Account'
              : language === 'tr' ? 'Giriş Yap' : 'Log In'}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {language === 'tr'
              ? 'Ses kayıtlarınızı ve aksiyon planlarınızı senkronize edin.'
              : 'Sync your voice recordings and action plans.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {/* Google ile Giriş / Kayıt Butonu */}
        <button
          type="button"
          onClick={async () => {
            try {
              setIsLoading(true);
              setErrorMsg(null);
              await signInWithGoogle();
            } catch (err: any) {
              setErrorMsg(err.message || 'Google ile giriş başarısız oldu.');
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.92H1.27v3.12C3.25 21.37 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.57H1.27C.46 8.19 0 10.03 0 12s.46 3.81 1.27 5.43l4.01-3.12z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.27 6.57l4.01 3.12c.95-2.82 3.6-4.94 6.72-4.94z"
            />
          </svg>
          {language === 'tr' ? 'Google ile Devam Et' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] text-gray-500 uppercase">
            {language === 'tr' ? 'veya e-posta ile' : 'or with email'}
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'tr' ? 'E-posta adresi' : 'Email address'}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0052FF]"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === 'tr' ? 'Şifre (min 6 karakter)' : 'Password (min 6 chars)'}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0052FF]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#00D2FF] text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {isSignUp
              ? language === 'tr'
                ? 'Zaten hesabınız var mı? Giriş yapın'
                : 'Already have an account? Log in'
              : language === 'tr'
                ? 'Hesabınız yok mu? Yeni hesap oluşturun'
                : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};