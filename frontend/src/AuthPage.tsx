import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

type Props = {
  onGuest?: () => void;
};

export default function AuthPage({ onGuest }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setSuccess('Account created. Check your email if confirmation is required.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-topbar">
          <img src="/b2b_ops_dark.webp" alt="Goorin B2B Ops" />
        </div>

        <div className="login-body">
        <div className="login-heading">
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p>{mode === 'signin' ? 'Sign in to your SYNC dashboard' : 'Set up access to your SYNC dashboard'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span className="login-field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              aria-label="Email"
            />
          </label>

          <label className="login-field">
            <span className="login-field-label login-field-label-row">
              Password
              {mode === 'signin' && <button type="button" className="login-forgot" tabIndex={-1}>Forgot password?</button>}
            </span>
            <div className="login-password">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                aria-label="Password"
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <div className="login-error" role="alert">{error}</div>}
          {success && (
            <div className="login-success" role="status">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 size={18} className="login-spin" /> : mode === 'signin' ? 'Log in' : 'Create account'}
          </button>

          {onGuest && (
            <button type="button" className="login-guest" onClick={onGuest}>
              Continue without a password
            </button>
          )}
        </form>

        <p className="login-foot">
          {mode === 'signin' ? 'Need access? ' : 'Already have access? '}
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </button>
        </p>

        <div className="login-cardfoot">
          <span className="login-status"><i />All systems operational</span>
          <span className="login-dot" />
          <span className="login-copyright">© 2026 Goorin Bros., Inc.</span>
        </div>
        </div>
      </div>
    </div>
  );
}
