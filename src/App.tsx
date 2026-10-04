import { useEffect, useState } from 'react';
import AuthPage from './features/auth/AuthPage';
import ConnectionApp from './features/connections/ConnectionApp';
import { connectionRoutes } from './features/connections/types';
import type { AuthSession, ConnectionRoute } from './features/connections/types';

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1));
  const [session, setSession] = useState<AuthSession | null>(null);
  const preview = new URLSearchParams(window.location.search).get('preview') === '1';
  useEffect(() => {
    const update = () => setRoute(window.location.hash.slice(1));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  function signOut() { setSession(null); window.location.hash = 'sign-in'; }
  return connectionRoutes.includes(route as ConnectionRoute)
    ? <ConnectionApp route={route as ConnectionRoute} session={session} forcePreview={preview} onSignOut={signOut} />
    : <AuthPage preview={preview} onAuthenticated={(user, signup) => { setSession(user); window.location.hash = signup ? 'onboarding' : 'today'; }} />;
}
