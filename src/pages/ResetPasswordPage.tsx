import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check if we already have a session (user clicked the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      setError('Password must be at least 8 characters and contain at least 1 number.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      toast.success('Password updated successfully!');
      navigate('/');
    }
  };

  const inputClass = "w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center min-h-screen p-8">
        <div className="border border-border rounded-3xl p-8 w-full max-w-[420px] animate-slide-up" style={{ background: 'var(--gradient-card)' }}>
          <div className="text-center text-3xl mb-4">🔑</div>
          <h1 className="text-xl font-bold text-center mb-1">Reset Your Password</h1>
          <p className="text-center text-sm text-muted-foreground mb-8">Enter your new password below.</p>

          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">Verifying your reset link…</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} required minLength={8} />
                <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                  <li className={password.length >= 8 ? 'text-primary' : ''}>• At least 8 characters</li>
                  <li className={/\d/.test(password) ? 'text-primary' : ''}>• At least 1 number</li>
                </ul>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} required minLength={8} />
              </div>

              {error && <p className="text-xs text-destructive mb-4">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full py-4 rounded-full font-semibold text-primary-foreground text-base disabled:opacity-50" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
                {submitting ? '...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
