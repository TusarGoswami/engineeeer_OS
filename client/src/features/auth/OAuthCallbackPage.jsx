import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';

export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithGitHub } = useAuth();
  const [error, setError] = useState('');
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const code = searchParams.get('code');
    const provider = searchParams.get('provider') || (window.location.search.includes('google') ? 'google' : 'github');
    const redirectUri = `${window.location.origin}/auth/callback?provider=${provider}`;

    if (!code) {
      setError('No authorization code received from provider.');
      return;
    }

    const processLogin = async () => {
      try {
        if (provider === 'google') {
          await loginWithGoogle(code, redirectUri);
        } else {
          await loginWithGitHub(code, redirectUri);
        }
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'OAuth authentication failed.');
      }
    };

    processLogin();
  }, [searchParams, loginWithGoogle, loginWithGitHub, navigate]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      {error ? (
        <div className="max-w-md rounded-xl border border-rose-500/30 bg-card p-6 shadow-[var(--shadow-card)] space-y-3">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto text-rose-700 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="font-display text-base font-bold text-surface-100">
            Authentication Failed
          </h3>
          <p className="text-xs text-surface-400 leading-relaxed">{error}</p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="rounded-lg bg-elevated border border-surface-700 px-4 py-2 text-xs font-medium text-surface-100 hover:bg-card hover:border-surface-600 transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      ) : (
        <div
          role="status"
          aria-label="Completing secure authentication"
          className="flex flex-col items-center gap-3 text-surface-300"
        >
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium">Completing secure authentication…</p>
        </div>
      )}
    </div>
  );
};

export default OAuthCallbackPage;
