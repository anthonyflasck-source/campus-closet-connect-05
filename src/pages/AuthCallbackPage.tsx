import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    let cancelled = false;

    const completeAuth = async () => {
      const code = searchParams.get('code');
      const authError = searchParams.get('error_description') || searchParams.get('error');

      if (authError) {
        if (!cancelled) {
          setMessage(authError);
          toast.error('Email confirmation failed');
        }
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (!cancelled) {
            setMessage(error.message);
            toast.error('We could not complete email confirmation');
          }
          return;
        }
      }

      if (!cancelled) {
        toast.success('Email confirmed. Your account is ready.');
        navigate('/', { replace: true });
      }
    };

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md border border-border rounded-3xl p-8 text-center" style={{ background: 'var(--gradient-card)' }}>
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <h1 className="text-xl font-bold mb-2">Finishing sign in</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </main>
    </>
  );
}
