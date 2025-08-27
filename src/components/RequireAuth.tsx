// src/components/RequireAuth.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Props = { children: React.ReactNode };

export default function RequireAuth({ children }: Props) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate("/driver-login", { replace: true });
      } else {
        setReady(true);
      }
    });

    // If the session disappears (sign out elsewhere), kick them out
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/driver-login", { replace: true });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready) return null;
  return <>{children}</>;
}
