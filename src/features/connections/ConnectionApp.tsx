import { useEffect, useState } from 'react';
import { apiConfigured } from '../../lib/api';
import type { AuthSession, ConnectionRoute } from './types';
import { hasStatus } from './types';
import ConnectionLayout from './ConnectionLayout';
import { CharacterScreen, Notice, PageIntro, ReflectionScreen, TodayScreen, WaitingScreen } from './ConnectionScreens';
import LettersScreen from './LettersScreen';
import { blankProfile, OnboardingScreen, ProfileScreen, VouchScreen } from './ProfileScreens';
import type { ProfileDraft } from './ProfileScreens';
import SafetyDialog from './SafetyDialog';
import { previewSession } from './preview';
import useConnections from './useConnections';
import './connections.css';

export default function ConnectionApp({ route, session, forcePreview, onSignOut }: {
  route: ConnectionRoute; session: AuthSession | null; forcePreview: boolean; onSignOut: () => void;
}) {
  if (!session && apiConfigured && !forcePreview) return <div className="session-required">
    <a className="brand" href="#sign-in">vouch.</a><PageIntro eyebrow="YOUR UNIVERSITY CIRCLE">Welcome back.</PageIntro><p className="muted">Sign in to see your introductions and letters.</p><a className="button button-primary" href="#sign-in">Sign in</a><a className="button button-secondary" href="?preview=1#today">Explore the design preview</a>
  </div>;
  return <ConnectedScreens route={route} user={session ?? previewSession} preview={!session || forcePreview} onSignOut={onSignOut} />;
}

function ConnectedScreens({ route, user, preview, onSignOut }: { route: ConnectionRoute; user: AuthSession; preview: boolean; onSignOut: () => void }) {
  const data = useConnections(user, preview);
  const [safety, setSafety] = useState<{ id: string; name: string } | null>(null);
  const [profile, setProfile] = useState<ProfileDraft>(blankProfile);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const match = data.today?.match;
  const declined = match && (hasStatus(match.status, 3, 'Rejected') || hasStatus(match.status, 4, 'Expired'));
  const availableMatch = match && !declined && !blocked.includes(match.matchedUserId) ? match : null;
  const mutual = Boolean(availableMatch && hasStatus(availableMatch.status, 2, 'Accepted'));
  const accepted = Boolean(availableMatch && (data.acceptedId === availableMatch.matchId || mutual));
  const inIncubation = !preview && (user.status === 'InIncubation' || user.status === '1') && data.ownTrust && !data.ownTrust.isIncubationComplete;

  useEffect(() => {
    if (route !== 'waiting' || preview) return;
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void data.refresh(); }, 20000);
    return () => clearInterval(interval);
  }, [route, preview, data.refresh]);

  async function respond(accept: boolean) {
    const next = await data.respond(accept);
    if (next) window.location.hash = next;
  }
  function saveProfile(next: ProfileDraft) {
    setProfile(next); setFeedback(preview ? 'Your values and interests have been saved in this preview.' : 'Your values and interests have been saved.');
    void data.refreshOwnTrust(); void data.refresh(); window.location.hash = 'today';
  }
  const matchRoute = ['today', 'character', 'waiting', 'reflection'].includes(route);
  return <ConnectionLayout route={route} user={user} preview={preview} onSignOut={onSignOut}>
    {feedback && <Notice>{feedback}</Notice>}
    {matchRoute && data.error && <Notice error retry={() => void data.refresh()}>{data.error}</Notice>}
    {matchRoute && !data.loading && !data.today && <PageIntro eyebrow="YOUR UNIVERSITY CIRCLE">Let’s try another moment.</PageIntro>}
    {matchRoute && data.loading && !data.today ? <><PageIntro eyebrow="YOUR UNIVERSITY CIRCLE">A little less noise.<br />A little more connection.</PageIntro><Notice>Finding your circle…</Notice></> : <>
      {matchRoute && inIncubation && <div className="focused-screen"><PageIntro eyebrow="YOUR CIRCLE IS TAKING SHAPE">Good things<br />begin with trust.</PageIntro><section className="surface stack"><h2>{data.ownTrust?.totalVouchesReceived ?? 0} of 3 peer vouches</h2><p className="muted">Before introductions begin, three campus peers need to vouch for your character. People who know you help your circle grow.</p><a className="button button-primary" href="#profile">View your character & vouches</a><a className="button button-secondary" href="#onboarding">Choose your values & interests</a></section></div>}
      {matchRoute && !inIncubation && (route === 'reflection' || (!availableMatch && data.today)) && <ReflectionScreen reflection={data.today?.reflection ?? null} passed={Boolean(declined)} />}
      {route === 'today' && !inIncubation && availableMatch && <TodayScreen match={availableMatch} trust={data.trust} preview={preview} pending={data.pending} accepted={accepted} onPass={() => void respond(false)} />}
      {route === 'character' && !inIncubation && availableMatch && <>
        {data.trustError && <Notice error retry={() => void data.refreshTrust()}>{data.trustError}</Notice>}
        <CharacterScreen match={availableMatch} trust={data.trust} preview={preview} pending={data.pending} accepted={accepted} onRespond={accept => void respond(accept)} onSafety={() => setSafety({ id: availableMatch.matchedUserId, name: availableMatch.matchedUserFullName })} />
      </>}
      {route === 'waiting' && !inIncubation && availableMatch && (accepted || preview ? <WaitingScreen match={availableMatch} mutual={mutual} refreshing={data.loading} onRefresh={() => void data.refresh()} /> : <div className="focused-screen"><PageIntro eyebrow="YOUR INTRODUCTION">Take a little time.</PageIntro><p className="muted">Read their character card before choosing whether you’d like to connect.</p><a className="button button-primary" href="#character">View character card</a></div>)}
    </>}
    {(route === 'letters' || route === 'paused') && <LettersScreen user={user} preview={preview} pausedRoute={route === 'paused'} onSafety={setSafety} drafts={drafts} setDrafts={setDrafts} blocked={blocked} />}
    {route === 'onboarding' && <OnboardingScreen user={user} preview={preview} initial={profile} onSave={saveProfile} />}
    {route === 'profile' && <>
      <ProfileScreen user={user} preview={preview} trust={data.ownTrust} profile={profile} error={data.ownTrustError} onRetry={() => void data.refreshOwnTrust()} />
      <AccountId id={user.userId} />
    </>}
    {route === 'vouch' && <VouchScreen user={user} preview={preview} />}
    {safety && <SafetyDialog target={safety} user={user} preview={preview} onClose={() => setSafety(null)} onBlocked={() => { setBlocked(current => [...current, safety.id]); setFeedback(preview ? 'This person has been blocked in the preview.' : 'This person has been blocked.'); window.location.hash = 'today'; }} />}
  </ConnectionLayout>;
}

function AccountId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  return <section className="account-id focused-screen profile-width"><p className="eyebrow">YOUR ACCOUNT ID</p><p className="small muted">Share this with a peer who would like to vouch for you.</p><code>{id}</code><button className="text-action" onClick={async () => { try { await navigator.clipboard.writeText(id); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}>{copied ? 'Copied' : 'Copy account ID'}</button><span role="status" className="small muted">{copyError ? 'Select the account ID above to copy it manually.' : copied ? 'Your account ID has been copied.' : ''}</span></section>;
}
