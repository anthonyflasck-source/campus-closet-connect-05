import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ChangePasswordSection() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 5) {
      setError('Password must be at least 5 characters.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      toast.success('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const inputClass = "w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div className="max-w-[480px]">
      <div className="border border-border rounded-2xl p-8" style={{ background: 'var(--gradient-card)' }}>
        <div className="text-2xl mb-3">🔑</div>
        <h2 className="text-lg font-bold mb-1">Change Password</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter a new password for your account.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="•••••" className={inputClass} required minLength={5} />
            <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
              <li className={password.length >= 5 ? 'text-primary' : ''}>• At least 5 characters</li>
            </ul>
          </div>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="•••••" className={inputClass} required minLength={5} />
          </div>

          {error && <p className="text-xs text-destructive mb-4">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full py-4 rounded-full font-semibold text-primary-foreground text-base disabled:opacity-50" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
            {submitting ? '...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
