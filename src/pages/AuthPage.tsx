import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) { navigate('/'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setSubmitting(false); }
      else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } else {
      if (!name.trim()) { setError('Please enter your name'); setSubmitting(false); return; }
      if (!email.toLowerCase().endsWith('@illinois.edu')) {
        setError('Only @illinois.edu email addresses are allowed.');
        setSubmitting(false);
        return;
      }
      if (password.length < 8 || !/\d/.test(password)) {
        setError('Password must be at least 8 characters and contain at least 1 number.');
        setSubmitting(false);
        return;
      }
      const result = await signUp(email, password, name.trim());
      if (result.error) { setError(result.error); setSubmitting(false); }
      else {
        toast.success('Account created! Welcome to CampusCloset 🎉');
        setSignupEmail(email);
        setSubmitting(false);
        if (result.needsEmailConfirmation) {
          toast.success('Account created. Check your inbox to confirm your email.');
        } else {
          navigate('/');
        }
      }
    }
  };

  const inputClass = "w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center min-h-screen p-8">
        <div className="border border-border rounded-3xl p-8 w-full max-w-[420px] animate-slide-up" style={{ background: 'var(--gradient-card)' }}>
          <div className="text-center text-3xl mb-4">👗</div>

          <h1 className="text-xl font-bold text-center mb-1">{isLogin ? 'Welcome Back' : 'Join CampusCloset'}</h1>
              <p className="text-center text-sm text-muted-foreground mb-8">{isLogin ? 'Sign in to your account' : 'Create your free account'}</p>

              {!isLogin && signupEmail && (
                <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
                  We created your account for <strong className="text-foreground">{signupEmail}</strong>. Open the verification email, then you will be redirected back to CampusCloset automatically.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emma Rodriguez" className={inputClass} required />
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" className={inputClass} required />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} required minLength={8} />
                  <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                    <li className={password.length >= 8 ? 'text-primary' : ''}>• At least 8 characters</li>
                    <li className={/\d/.test(password) ? 'text-primary' : ''}>• At least 1 number</li>
                  </ul>
                </div>


                {!isLogin && (
                  <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                    🎓 CampusCloset is exclusively for University of Illinois students. An <strong className="text-primary">@illinois.edu</strong> email is required.
                  </div>
                )}

                {error && <p className="text-xs text-destructive mb-4">{error}</p>}
                <button type="submit" disabled={submitting} className="w-full py-4 rounded-full font-semibold text-primary-foreground text-base disabled:opacity-50" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
                  {submitting ? '...' : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="text-center mt-6 text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); setSignupEmail(''); }} className="text-primary font-semibold hover:underline cursor-pointer">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
        </div>
      </main>
    </>
  );
}
