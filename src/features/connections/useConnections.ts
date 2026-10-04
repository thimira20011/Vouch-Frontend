import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, request } from '../../lib/api';
import { previewMatch, previewReflection, previewTrust } from './preview';
import type { AuthSession, TodayConnection, TrustSummary } from './types';

export default function useConnections(user: AuthSession, preview: boolean) {
  const [today, setToday] = useState<TodayConnection | null>(preview ? { hasMatch: true, match: previewMatch, reflection: previewReflection } : null);
  const [trust, setTrust] = useState<TrustSummary | null>(preview ? previewTrust : null);
  const [ownTrust, setOwnTrust] = useState<TrustSummary | null>(preview ? { ...previewTrust, userId: user.userId } : null);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState('');
  const [trustError, setTrustError] = useState('');
  const [ownTrustError, setOwnTrustError] = useState('');
  const [pending, setPending] = useState(false);
  const [acceptedId, setAcceptedId] = useState('');
  const actionLock = useRef(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (preview) return;
    setLoading(true); setError('');
    try { setToday(await request<TodayConnection>('/api/matches/today', { signal }, user.token)); }
    catch (error) { if (!signal?.aborted) setError(errorMessage(error)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [preview, user.token]);

  const refreshOwnTrust = useCallback(async (signal?: AbortSignal) => {
    if (preview) return;
    setOwnTrustError('');
    try { setOwnTrust(await request<TrustSummary>('/api/vouches/me', { signal }, user.token)); }
    catch (error) { if (!signal?.aborted) setOwnTrustError(errorMessage(error)); }
  }, [preview, user.token]);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal); void refreshOwnTrust(controller.signal);
    return () => controller.abort();
  }, [refresh, refreshOwnTrust]);

  const matchId = today?.match?.matchedUserId;
  const refreshTrust = useCallback(async (signal?: AbortSignal) => {
    if (preview || !matchId) return;
    setTrustError('');
    try { setTrust(await request<TrustSummary>(`/api/vouches/user/${matchId}`, { signal }, user.token)); }
    catch (error) { if (!signal?.aborted) setTrustError(errorMessage(error)); }
  }, [preview, matchId, user.token]);
  useEffect(() => {
    if (!preview) setTrust(null);
    const controller = new AbortController(); void refreshTrust(controller.signal);
    return () => controller.abort();
  }, [preview, refreshTrust]);

  async function respond(accept: boolean): Promise<'waiting' | 'letters' | 'reflection' | null> {
    const match = today?.match;
    if (!match || actionLock.current || (accept && acceptedId === match.matchId)) return null;
    actionLock.current = true; setPending(true); setError('');
    try {
      if (preview) {
        setToday({ hasMatch: true, match: accept ? match : { ...match, status: 3 }, reflection: previewReflection });
      } else {
        await request(`/api/matches/${match.matchId}/respond`, { method: 'POST', body: JSON.stringify({ accept }) }, user.token);
        if (accept) setAcceptedId(match.matchId);
        // The current backend response flag doesn't reliably distinguish one-sided acceptance.
        // Read the persisted status instead before telling a user the conversation is unlocked.
        let updated: TodayConnection;
        try { updated = await request<TodayConnection>('/api/matches/today', {}, user.token); }
        catch (error) {
          setError(`Your choice was saved, but we couldn’t check for an update. ${errorMessage(error)}`);
          if (!accept) setToday({ hasMatch: false, match: null, reflection: null });
          return accept ? 'waiting' : 'reflection';
        }
        setToday(updated);
        if (accept && (updated.match?.status === 2 || updated.match?.status === 'Accepted')) {
          setAcceptedId(match.matchId); return 'letters';
        }
      }
      if (accept) setAcceptedId(match.matchId);
      return accept ? 'waiting' : 'reflection';
    } catch (error) { setError(errorMessage(error)); return null; }
    finally { actionLock.current = false; setPending(false); }
  }
  return { today, trust, ownTrust, loading, error, trustError, ownTrustError, pending, acceptedId, refresh, refreshTrust, refreshOwnTrust, respond };
}
