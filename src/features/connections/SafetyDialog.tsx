import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import Button from '../../components/Button';
import { errorMessage, request } from '../../lib/api';
import type { AuthSession } from './types';

export default function SafetyDialog({ target, user, preview, onClose, onBlocked }: {
  target: { id: string; name: string }; user: AuthSession; preview: boolean; onClose: () => void; onBlocked: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const opener = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const [action, setAction] = useState('report');
  const [category, setCategory] = useState('1');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => {
      node?.close();
      requestAnimationFrame(() => { if (opener.current?.isConnected) opener.current.focus(); });
    };
  }, []);
  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'))
      .filter(control => control.getClientRects().length > 0 && (!(control instanceof HTMLInputElement) || control.type !== 'radio' || control.checked));
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current) return;
    if (action === 'report' && details.trim().length < 10) { setError('Please provide at least 10 characters so the team can understand what happened.'); requestAnimationFrame(() => errorRef.current?.focus()); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      if (!preview) await request(`/api/moderation/${action}`, { method: 'POST', body: JSON.stringify(action === 'block' ? { targetUserId: target.id } : { reportedUserId: target.id, messageId: null, category: Number(category), details: details.trim() }) }, user.token);
      if (action === 'block') { onBlocked(); onClose(); }
      else setSent(true);
    } catch (error) { setError(errorMessage(error)); requestAnimationFrame(() => errorRef.current?.focus()); }
    finally { lock.current = false; setBusy(false); }
  }
  return <dialog className="safety-dialog" ref={dialog} aria-labelledby="safety-title" onKeyDown={keepFocusInside} onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <form className="stack" onSubmit={submit}>
      <p className="eyebrow">YOUR SAFETY MATTERS</p><h2 id="safety-title">{sent ? 'Thank you for speaking up.' : `A little care for your circle.`}</h2>
      {sent ? <><p>{preview ? 'Your report has been recorded in this preview.' : 'Your report has been submitted for review.'}</p><Button onClick={onClose}>Done</Button></> : <>
        <p className="muted">Report a concern about {target.name}, or block this connection.</p>
        <fieldset className="safety-options" disabled={busy}><legend className="visually-hidden">Choose an action</legend><label><input type="radio" name="safety-action" checked={action === 'report'} onChange={() => setAction('report')} /> Report a concern</label><label><input type="radio" name="safety-action" checked={action === 'block'} onChange={() => setAction('block')} /> Block this person</label></fieldset>
        {action === 'report' ? <><label htmlFor="report-category">What happened?</label><select className="text-input" id="report-category" disabled={busy} value={category} onChange={event => setCategory(event.target.value)}>{['Harassment', 'Impersonation', 'Spam', 'Inappropriate content', 'Other'].map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select><label htmlFor="report-details">Tell us a little more</label><textarea id="report-details" className="text-input" disabled={busy} rows={4} maxLength={1000} value={details} onChange={event => setDetails(event.target.value)} aria-describedby="report-hint" /><p className="small muted" id="report-hint">10–1,000 characters. Share only what you’re comfortable sharing.</p></> : <p className="connection-notice">Blocking prevents further contact with {target.name}. This connection will be removed from your current view.</p>}
        {error && <p className="field-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : action === 'report' ? 'Submit report' : 'Block this person'}</Button><Button secondary disabled={busy} onClick={onClose}>Cancel</Button>
      </>}
    </form>
  </dialog>;
}
