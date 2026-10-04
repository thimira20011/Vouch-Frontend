import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { errorMessage, request } from '../../lib/api';
import { Notice, PageIntro } from './ConnectionScreens';
import { previewConversation, previewIcebreaker, previewLetters } from './preview';
import type { AuthSession, Conversation, Icebreaker, Letter, Page } from './types';
import { hasStatus } from './types';

const mergeLetters = (old: Letter[], incoming: Letter[]) => [...new Map([...old, ...incoming].map(letter => [letter.id, letter])).values()]
  .sort((a, b) => Date.parse(a.deliveredAt) - Date.parse(b.deliveredAt));

export default function LettersScreen({ user, preview, pausedRoute, onSafety, drafts, setDrafts, blocked }: {
  user: AuthSession; preview: boolean; pausedRoute: boolean; onSafety: (target: { id: string; name: string }) => void;
  drafts: Record<string, string>; setDrafts: Dispatch<SetStateAction<Record<string, string>>>; blocked: string[];
}) {
  const [conversations, setConversations] = useState<Conversation[]>(preview ? [{ ...previewConversation, status: pausedRoute ? 2 : 1, isPausedByMe: pausedRoute }] : []);
  const [selected, setSelected] = useState(preview ? previewConversation.id : '');
  const [letters, setLetters] = useState<Letter[]>(preview ? previewLetters : []);
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>(preview ? [previewIcebreaker] : []);
  const [loading, setLoading] = useState(!preview);
  const [messagesLoading, setMessagesLoading] = useState(!preview);
  const [error, setError] = useState('');
  const [indexError, setIndexError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [earliestPage, setEarliestPage] = useState(1);
  const [conversationPage, setConversationPage] = useState(1);
  const [moreConversations, setMoreConversations] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const visibleConversations = conversations.filter(conversation => !blocked.includes(conversation.otherUserId));
  const active = visibleConversations.find(conversation => conversation.id === selected);
  const paused = active ? hasStatus(active.status, 2, 'Paused') : false;
  const archived = active ? hasStatus(active.status, 3, 'Archived') : false;
  const draft = drafts[selected] ?? '';

  useEffect(() => {
    if (conversations.some(conversation => conversation.id === selected && blocked.includes(conversation.otherUserId))) {
      setSelected(conversations.find(conversation => !blocked.includes(conversation.otherUserId))?.id ?? '');
    }
  }, [conversations, selected, blocked]);

  const loadIndex = useCallback(async (signal?: AbortSignal, page = 1) => {
    if (preview) return;
    setIndexError('');
    try {
      const response = await request<Page<Conversation>>(`/api/conversations/?page=${page}&pageSize=20`, { signal }, user.token);
      if (signal?.aborted) return;
      setConversations(current => page === 1 ? response.items : [...new Map([...current, ...response.items].map(item => [item.id, item])).values()]);
      setConversationPage(page); setMoreConversations(response.hasNextPage);
      setSelected(current => current && (page !== 1 || response.items.some(item => item.id === current)) ? current : response.items[0]?.id ?? '');
    } catch (error) { if (!signal?.aborted) setIndexError(errorMessage(error)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [preview, user.token]);
  useEffect(() => {
    const controller = new AbortController(); void loadIndex(controller.signal);
    return () => controller.abort();
  }, [loadIndex]);

  const loadLetters = useCallback(async (signal?: AbortSignal, initial = false) => {
    if (preview || !selected) return;
    const currentGeneration = generation.current;
    try {
      // Backend pages are oldest-first; locate the last page to start at the newest letters.
      const first = await request<Page<Letter>>(`/api/conversations/${selected}/messages?page=1&pageSize=50`, { signal }, user.token);
      const lastPage = Math.max(1, first.totalPages);
      const latest = lastPage > 1 ? await request<Page<Letter>>(`/api/conversations/${selected}/messages?page=${lastPage}&pageSize=50`, { signal }, user.token) : first;
      if (signal?.aborted || generation.current !== currentGeneration) return;
      setLetters(current => initial ? latest.items : mergeLetters(current, latest.items));
      if (initial) setEarliestPage(lastPage);
    } catch (error) { if (!signal?.aborted && generation.current === currentGeneration) setError(errorMessage(error)); }
    finally { if (!signal?.aborted && generation.current === currentGeneration) setMessagesLoading(false); }
  }, [preview, selected, user.token]);
  useEffect(() => {
    if (preview) return;
    generation.current += 1;
    const controller = new AbortController(); setLetters([]); setIcebreakers([]); setError(''); setStatus('');
    if (selected) {
      setMessagesLoading(true); void loadLetters(controller.signal, true);
      void request<Icebreaker[]>(`/api/wingman/icebreakers/conversation/${selected}`, { signal: controller.signal }, user.token)
        .then(data => { if (!controller.signal.aborted) setIcebreakers(data); }).catch(() => { /* Suggestions are optional; composing stays available. */ });
    } else setMessagesLoading(false);
    return () => { controller.abort(); generation.current += 1; };
  }, [preview, selected, loadLetters, user.token]);

  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || lock.current) return;
      void loadIndex(controller.signal); void loadLetters(controller.signal);
    }, 20000);
    return () => { clearInterval(interval); controller.abort(); };
  }, [preview, loadIndex, loadLetters]);
  useEffect(() => {
    if (!preview) return;
    setConversations(current => current.map(conversation => conversation.id === selected ? { ...conversation, status: pausedRoute ? 2 : 1, isPausedByMe: pausedRoute } : conversation));
  }, [pausedRoute, preview, selected]);

  async function loadEarlier() {
    if (!active || earliestPage <= 1 || loadingEarlier) return;
    setLoadingEarlier(true); setError('');
    const currentGeneration = generation.current;
    try {
      const response = await request<Page<Letter>>(`/api/conversations/${active.id}/messages?page=${earliestPage - 1}&pageSize=50`, {}, user.token);
      if (generation.current !== currentGeneration) return;
      setLetters(current => mergeLetters(current, response.items)); setEarliestPage(page => page - 1);
    } catch (error) { if (generation.current === currentGeneration) setError(errorMessage(error)); }
    finally { setLoadingEarlier(false); }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!active || !draft.trim() || draft.length > 2000 || lock.current || paused || archived) return;
    lock.current = true; setBusy(true); setError(''); setStatus('');
    const conversationId = active.id;
    try {
      const letter = preview ? { id: crypto.randomUUID(), senderId: user.userId, senderName: user.fullName, body: draft.trim(), deliveredAt: new Date().toISOString(), qualifiesForReveal: draft.trim().length >= 5, type: 1 }
        : await request<Letter>(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ body: draft.trim(), type: 1 }) }, user.token);
      setLetters(current => mergeLetters(current, [letter]));
      setDrafts(current => ({ ...current, [conversationId]: '' }));
      setStatus(preview ? 'Letter added to this preview.' : 'Your letter has been sent.');
      requestAnimationFrame(() => composerRef.current?.focus());
    } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function togglePause() {
    if (!active || lock.current || archived) return;
    lock.current = true; setBusy(true); setError(''); setStatus('');
    try {
      if (!preview) await request(`/api/conversations/${active.id}/${paused ? 'resume' : 'pause'}`, { method: 'POST' }, user.token);
      setConversations(current => current.map(conversation => conversation.id === active.id ? { ...conversation, status: paused ? 1 : 2, isPausedByMe: !paused } : conversation));
      window.location.hash = paused ? 'letters' : 'paused';
      setStatus(paused ? 'Your conversation has resumed.' : 'Your conversation is paused. Your letters are preserved.');
    } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  const timeLabel = (letter: Letter, index: number) => preview && index < 2 ? ['Yesterday · 6:42 pm', 'Today · 9:15 am'][index]
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(letter.deliveredAt));

  if (loading) return <><PageIntro eyebrow="YOUR LETTERS">A little room to connect.</PageIntro><Notice>Opening your letters…</Notice></>;
  if (!active) return <div className="focused-screen">
    <PageIntro eyebrow="YOUR LETTERS">Good conversations<br />begin with a connection.</PageIntro>
    {indexError ? <Notice error retry={() => void loadIndex()}>{indexError}</Notice> : <section className="surface stack"><h2>Your letters will have a home here.</h2><p className="muted">A conversation opens when you both accept an introduction. Until then, there’s no rush.</p></section>}
    <a className="button button-primary" href="#today">See today’s introduction</a>
  </div>;
  return <>
    {visibleConversations.length > 1 && <div className="conversation-picker"><label htmlFor="conversation">Your conversations</label><select id="conversation" value={selected} disabled={busy} onChange={event => setSelected(event.target.value)}>{visibleConversations.map(conversation => <option key={conversation.id} value={conversation.id}>{conversation.otherUserName}{hasStatus(conversation.status, 2, 'Paused') ? ' · Paused' : hasStatus(conversation.status, 3, 'Archived') ? ' · Archived' : ''}</option>)}</select></div>}
    {moreConversations && <button className="text-action" onClick={() => void loadIndex(undefined, conversationPage + 1)}>Load more conversations</button>}
    {indexError && <Notice error retry={() => void loadIndex()}>{indexError}</Notice>}
    <div className="conversation-identity"><Avatar name={preview ? 'Maya P' : active.otherUserName} /><div><h1 tabIndex={-1}>Letters with {active.otherUserName}</h1><p className="small muted">{archived ? 'Archived · your letters are preserved' : paused ? `${active.isPausedByMe ? 'Paused by you' : 'Paused by your connection'} · take the time you need` : preview ? 'Music, literature, and the space between.' : 'Thoughtful exchanges, at your own pace.'}</p></div></div>
    <div className="letters-columns">
      <div className="conversation-stack stack">
        <div className="reveal-notice"><p className="small primary-text">Character first. A face, in time.</p><p className="small muted">Photos are optional. Clarity grows gradually through thoughtful exchanges.</p></div>
        {error && <Notice error retryLabel="Reload letters" retry={() => { setError(''); void loadLetters(undefined, true); }}>{error}</Notice>}
        {messagesLoading ? <Notice>Opening this conversation…</Notice> : <>
          {earliestPage > 1 && <Button secondary disabled={loadingEarlier} onClick={() => void loadEarlier()}>{loadingEarlier ? 'Loading earlier letters…' : 'Read earlier letters'}</Button>}
          {letters.map((letter, index) => <article className="letter-card surface" key={letter.id} aria-label={`Letter from ${letter.senderId === user.userId ? 'you' : letter.senderName}`}><div className="letter-meta"><p>{letter.senderId === user.userId ? 'You' : letter.senderName}</p><time dateTime={letter.deliveredAt}>{timeLabel(letter, index)}</time></div><p className="letter-text">{letter.body}</p></article>)}
          {letters.length === 0 && <section className="surface stack"><h2>A first letter can be simple.</h2><p className="muted">Share a thought, ask a question, or start with something you both enjoy.</p></section>}
        </>}
        {paused || archived ? <section className="paused-notice surface">
          <h2>{archived ? 'A chapter, preserved.' : 'A little space is okay.'}</h2>
          <p className="muted">{archived ? 'This conversation is archived. You can still read your letters.' : active.isPausedByMe ? `This conversation is preserved. ${active.otherUserName} has been notified that you’re taking a pause.` : 'Your connection is taking a little space. Your letters are preserved.'}</p>
          {!archived && active.isPausedByMe && <Button disabled={busy} onClick={() => void togglePause()}>{busy ? 'Resuming…' : 'Resume conversation'}</Button>}
        </section> : <>
          <form className="letter-composer surface" onSubmit={send}>
            <label className="eyebrow" htmlFor="letter-draft">YOUR LETTER</label>
            <textarea ref={composerRef} id="letter-draft" aria-describedby="letter-hint letter-limit" value={draft} disabled={busy || messagesLoading} maxLength={2000} placeholder={`What would you like to share with ${active.otherUserName}?`} rows={2} onChange={event => { setDrafts(current => ({ ...current, [selected]: event.target.value })); setStatus(''); }} />
            <div className="composer-hints"><p className="small muted" id="letter-hint">A letter can be short. It just needs to be yours.</p><p className="small muted" id="letter-limit">{draft.length > 0 ? `${draft.length} / 2,000` : 'Up to 2,000 characters'}</p></div>
            <Button type="submit" disabled={!draft.trim() || busy || messagesLoading}>{busy ? 'Sending your letter…' : 'Send letter'}</Button>
            <p className="small muted">{draft.trim() ? 'Send when you’re ready. There’s no rush.' : 'Write a letter to enable sending.'}</p>
          </form>
          <Button secondary disabled={busy} onClick={() => void togglePause()}>Pause conversation</Button>
        </>}
        {status && <Notice>{status}</Notice>}
      </div>
      <aside className="conversation-context surface stack">
        <p className="eyebrow">A CONSIDERED CONNECTION</p>
        <h2 className="feature-title">Let curiosity<br />lead the way.</h2>
        <p>{preview ? 'You both enjoy music and literature. Here is an opening to explore.' : 'A thoughtful question can be the beginning of a good conversation.'}</p>
        {icebreakers[0] && <p className="letter-text">“{icebreakers[0].text}”</p>}
        {icebreakers[0] && !paused && !archived && <button className="context-action" disabled={busy || Boolean(draft.trim())} onClick={() => { setDrafts(current => ({ ...current, [selected]: icebreakers[0].text })); composerRef.current?.focus(); }}>Use this opening{draft.trim() ? ' (your draft is kept)' : ''}</button>}
        <div className="divider" />
        <p className="small">No read receipts.<br />No pressure to reply immediately.</p>
        <button className="text-action small" onClick={() => onSafety({ id: active.otherUserId, name: active.otherUserName })}>Report or block</button>
      </aside>
    </div>
  </>;
}
