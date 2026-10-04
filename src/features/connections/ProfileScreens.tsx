import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Tags from '../../components/Tags';
import { apiBaseUrl, errorMessage, request } from '../../lib/api';
import { Notice, PageIntro } from './ConnectionScreens';
import { characterTraits, deepValues, interests, traitLabels } from './types';
import type { AuthSession, TrustSummary } from './types';

export type ProfileDraft = { bio: string; values: string[]; interests: number[] };
export const blankProfile: ProfileDraft = { bio: '', values: [], interests: [] };

export function OnboardingScreen({ user, preview, initial, onSave }: {
  user: AuthSession; preview: boolean; initial: ProfileDraft; onSave: (profile: ProfileDraft) => void;
}) {
  const [profile, setProfile] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const summary = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  function toggleValue(value: string) {
    setProfile(current => ({ ...current, values: current.values.includes(value) ? current.values.filter(v => v !== value) : [...current.values, value] }));
    setErrors(current => ({ ...current, values: '' }));
  }
  function toggleInterest(value: number) {
    setProfile(current => ({ ...current, interests: current.interests.includes(value) ? current.interests.filter(v => v !== value) : [...current.interests, value] }));
    setErrors(current => ({ ...current, interests: '' }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current) return;
    const next: Record<string, string> = {};
    if (!profile.values.length || profile.values.length > 5) next.values = 'Choose between one and five values.';
    if (!profile.interests.length || profile.interests.length > 5) next.interests = 'Choose between one and five interests.';
    if (profile.bio.length > 280) next.bio = 'Keep your bio within 280 characters.';
    if (Object.keys(next).length) { setErrors(next); requestAnimationFrame(() => summary.current?.focus()); return; }
    lock.current = true; setBusy(true); setErrors({});
    try {
      if (!preview) await request('/api/auth/onboarding', { method: 'POST', body: JSON.stringify({ bio: profile.bio.trim(), deepValues: profile.values, intellectualInterests: profile.interests }) }, user.token);
      onSave(profile);
    } catch (error) { setErrors({ service: errorMessage(error) }); requestAnimationFrame(() => summary.current?.focus()); }
    finally { lock.current = false; setBusy(false); }
  }
  const errorEntries = Object.entries(errors).filter(([, value]) => Boolean(value));
  return <div className="focused-screen profile-width">
    <PageIntro eyebrow="YOUR NEXT CHAPTER">Begin with what<br />matters to you.</PageIntro>
    <p className="muted">Shared values make a thoughtful starting point. Tell your circle a little about the person behind the introduction.</p>
    <form className="profile-form stack" onSubmit={submit} noValidate>
      {errorEntries.length > 0 && <div className="connection-notice is-error" role="alert" tabIndex={-1} ref={summary}><h2>A few details need another look.</h2><ul>{errorEntries.map(([key, value]) => <li key={key}>{key === 'service' ? value : <a href={`#profile-${key}`} onClick={event => { event.preventDefault(); document.getElementById(`profile-${key}`)?.focus(); }}>{value}</a>}</li>)}</ul></div>}
      <fieldset className="surface choice-section" id="profile-values" tabIndex={-1} aria-describedby="values-hint" aria-invalid={Boolean(errors.values)} disabled={busy}>
        <legend>Your values</legend><p className="small muted" id="values-hint">Choose 1–5. Pick what feels like you. {profile.values.length} of 5 selected.</p>
        <div className="choice-grid">{deepValues.map(value => <label className={`choice-chip ${profile.values.includes(value) ? 'is-selected' : ''}`} key={value}><input type="checkbox" checked={profile.values.includes(value)} disabled={!profile.values.includes(value) && profile.values.length >= 5} onChange={() => toggleValue(value)} /><span>{value}</span></label>)}</div>
        {errors.values && <p className="field-error">{errors.values}</p>}
      </fieldset>
      <fieldset className="surface choice-section" id="profile-interests" tabIndex={-1} aria-describedby="interests-hint" aria-invalid={Boolean(errors.interests)} disabled={busy}>
        <legend>What holds your curiosity?</legend><p className="small muted" id="interests-hint">Choose 1–5 interests to explore together. {profile.interests.length} of 5 selected.</p>
        <div className="choice-grid">{interests.map(interest => <label className={`choice-chip ${profile.interests.includes(interest.value) ? 'is-selected' : ''}`} key={interest.value}><input type="checkbox" checked={profile.interests.includes(interest.value)} disabled={!profile.interests.includes(interest.value) && profile.interests.length >= 5} onChange={() => toggleInterest(interest.value)} /><span>{interest.label}</span></label>)}</div>
        {errors.interests && <p className="field-error">{errors.interests}</p>}
      </fieldset>
      <section className="surface stack"><label className="section-label" htmlFor="profile-bio">A little about you <span className="small muted">(optional)</span></label><textarea id="profile-bio" className="text-input bio-input" value={profile.bio} maxLength={280} disabled={busy} placeholder="A thought, a small joy, or something you’d like to share." aria-describedby="bio-hint" onChange={event => setProfile(current => ({ ...current, bio: event.target.value }))} rows={4} /><p className="small muted" id="bio-hint">{profile.bio.length} / 280 characters. Your photo can wait.</p></section>
      <Button type="submit" disabled={busy}>{busy ? 'Saving your details…' : 'Save and find your circle'}</Button>
      <a className="text-action small" href="#today">Back to today</a>
    </form>
  </div>;
}

export function ProfileScreen({ user, preview, trust, profile, error, onRetry }: {
  user: AuthSession; preview: boolean; trust: TrustSummary | null; profile: ProfileDraft; error: string; onRetry: () => void;
}) {
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [photoError, setPhotoError] = useState('');
  const previewUrl = useRef('');
  const lock = useRef(false);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  async function upload(file?: File) {
    if (!file || lock.current) return;
    setPhotoError(''); setNotice('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) { setPhotoError('Choose a JPEG, PNG, or WebP photo up to 5 MB.'); return; }
    lock.current = true; setBusy(true);
    try {
      if (preview) {
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = URL.createObjectURL(file); setPhoto(previewUrl.current);
      } else {
        const form = new FormData(); form.append('photo', file);
        const response = await request<{ originalUrl: string }>('/api/profile/photo', { method: 'PUT', body: form }, user.token);
        setPhoto(new URL(response.originalUrl, apiBaseUrl || window.location.origin).href);
      }
      setNotice(preview ? 'Photo added to this preview.' : 'Your photo has been saved.');
    } catch (error) { setPhotoError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="focused-screen profile-width">
    <PageIntro eyebrow="YOUR CHARACTER CARD">Known for who you are.</PageIntro>
    <section className="surface stack">
      <div className="profile-identity">{photo ? <img className="profile-photo" src={photo} alt="Your profile" /> : <Avatar name={user.fullName} />}<div><h2>{user.fullName}</h2><p className="small muted">{user.email}</p></div></div>
      {profile.bio && <p className="letter-text">“{profile.bio}”</p>}
      {profile.values.length > 0 && <Tags labels={profile.values} />}
      <a className="button button-secondary" href="#onboarding">Choose your values & interests</a>
      <label className="section-label" htmlFor="profile-photo">A photo, if you’d like</label><input className="photo-input" id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => void upload(event.target.files?.[0])} aria-describedby="photo-hint" /><p className="small muted" id="photo-hint">Optional · JPEG, PNG, or WebP · up to 5 MB. {busy ? 'Uploading…' : 'Character comes first.'}</p>
      {photoError && <Notice error>{photoError}</Notice>}{notice && <Notice>{notice}</Notice>}
    </section>
    {error && <Notice error retry={onRetry}>{error}</Notice>}
    <section className="surface stack"><p className="eyebrow">VOUCHED FOR BY YOUR CIRCLE</p><h2>{trust ? `${trust.totalVouchesReceived} peer vouches` : 'Your peer vouches'}</h2><p className="small muted">Trust score {(trust?.trustScore ?? user.trustScore).toFixed(1)} / 20</p>
      {trust && !trust.isIncubationComplete && <p className="muted">Three unique peer vouches help your account become eligible for introductions. Let people who know you speak to your character.</p>}
      {trust?.recentVouches.map(vouch => <article className="own-vouch" key={vouch.id}><p className="small">{vouch.voucherName}</p><Tags labels={traitLabels(vouch.traits)} />{vouch.note && <p className="letter-text">“{vouch.note}”</p>}</article>)}
      {trust?.recentVouches.length === 0 && <p className="muted">Peer endorsements will appear here.</p>}
      <a className="button button-primary" href="#vouch">Vouch for someone you know</a>
    </section>
  </div>;
}

export function VouchScreen({ user, preview }: { user: AuthSession; preview: boolean }) {
  const [target, setTarget] = useState('');
  const [traits, setTraits] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current) return;
    if ((!preview && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(target.trim())) || !target.trim() || !traits.length || target === user.userId) {
      setError('Enter your peer’s account ID and choose at least one trait. You can only vouch for someone else.'); requestAnimationFrame(() => summary.current?.focus()); return;
    }
    lock.current = true; setBusy(true); setError(''); setStatus('');
    try {
      if (!preview) await request('/api/vouches/', { method: 'POST', body: JSON.stringify({ targetUserId: target.trim(), traits: traits.reduce((sum, trait) => sum | trait, 0), note: note.trim() || null }) }, user.token);
      setStatus(preview ? 'Your vouch has been added to this preview.' : 'Your vouch has been saved. Thank you for speaking to their character.');
      setTarget(''); setTraits([]); setNote('');
    } catch (error) { setError(errorMessage(error)); requestAnimationFrame(() => summary.current?.focus()); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="focused-screen profile-width"><PageIntro eyebrow="SPEAK TO THEIR CHARACTER">A good word<br />goes a long way.</PageIntro><p className="muted">Vouch for a campus peer you know personally. Choose the qualities you’ve seen in them.</p>
    <form className="surface stack profile-form" onSubmit={submit} noValidate>
      {error && <div className="connection-notice is-error" role="alert" ref={summary} tabIndex={-1}>{error}</div>}
      <label htmlFor="vouch-peer" className="section-label">Your peer’s account ID</label><input className="text-input" id="vouch-peer" value={target} required disabled={busy} aria-describedby="peer-hint" placeholder="Ask your peer to share their account ID" onChange={event => setTarget(event.target.value)} /><p className="small muted" id="peer-hint">They can copy this from their character card.</p>
      <fieldset className="choice-section" disabled={busy}><legend>What do you know them for?</legend><div className="choice-grid">{characterTraits.map(trait => <label className={`choice-chip ${traits.includes(trait.value) ? 'is-selected' : ''}`} key={trait.value}><input type="checkbox" checked={traits.includes(trait.value)} onChange={() => setTraits(current => current.includes(trait.value) ? current.filter(value => value !== trait.value) : [...current, trait.value])} /><span>{trait.label}</span></label>)}</div></fieldset>
      <label className="section-label" htmlFor="vouch-note">A few words <span className="small muted">(optional)</span></label><textarea className="text-input" id="vouch-note" value={note} maxLength={500} disabled={busy} placeholder="A small example of their character." rows={4} onChange={event => setNote(event.target.value)} /><p className="small muted">{note.length} / 500 characters. One vouch per peer; account eligibility is checked when you submit.</p>
      <Button type="submit" disabled={busy}>{busy ? 'Saving your vouch…' : 'Submit your vouch'}</Button>{status && <Notice>{status}</Notice>}
    </form><a className="text-action" href="#profile">Back to your character card</a>
  </div>;
}
