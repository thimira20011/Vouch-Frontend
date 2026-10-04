import type { ReactNode } from 'react';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Tags from '../../components/Tags';
import type { Match, Reflection, TrustSummary } from './types';
import { interestLabel, traitLabels } from './types';

export function PageIntro({ eyebrow, children, display = false }: { eyebrow: string; children: ReactNode; display?: boolean }) {
  return <div className="page-intro"><p className="eyebrow">{eyebrow}</p><h1 tabIndex={-1} className={display ? 'display-title' : ''}>{children}</h1></div>;
}
export function Notice({ children, retry, retryLabel = 'Try again', error = false }: { children: ReactNode; retry?: () => void; retryLabel?: string; error?: boolean }) {
  return <div className={`connection-notice ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>
    <p>{children}</p>{retry && <button className="text-action" onClick={retry}>{retryLabel}</button>}
    {error && typeof children === 'string' && children.includes('Your session has ended') && <a className="text-action" href="#sign-in">Sign in again</a>}
  </div>;
}
export function CharacterFallback({ name, compact = false, preview }: { name: string; compact?: boolean; preview: boolean }) {
  return <div className={`character-fallback ${compact ? 'is-compact' : ''}`} aria-label={`Character introduction for ${name}`}>
    <p className="eyebrow">CHARACTER COMES FIRST</p>
    <span className="character-initial" aria-hidden="true">{name.slice(0, 1)}.</span>
    <p className="small">{preview ? <>No photo shared.<br />There is still plenty to discover.</> : <>A character introduction.<br />There is plenty to discover.</>}</p>
  </div>;
}
export function TodayScreen({ match, trust, preview, pending, onPass, accepted }: {
  match: Match; trust: TrustSummary | null; preview: boolean; pending: boolean; onPass: () => void; accepted: boolean;
}) {
  const traits = Array.from(new Set(trust?.recentVouches.flatMap(v => traitLabels(v.traits)) ?? []));
  const name = match.matchedUserFullName;
  return <>
    <PageIntro eyebrow="ONE INTRODUCTION. NO RUSH." display>A little less noise.<br />A little more connection.</PageIntro>
    <p className="mobile-introduction muted">Meet someone through what matters.</p>
    <div className="today-columns">
      <article className="introduction-card surface stack">
        <div className="introduction-details">
          <CharacterFallback name={name} compact preview={preview} />
          <div className="character-preview">
            <p className="eyebrow">TODAY’S INTRODUCTION</p>
            <h2 className="person-name">{name.split(' ').slice(0, 1).join(' ')}<br />{name.split(' ').slice(1).join(' ')}</h2>
            <p className="small muted">{match.faculty}{preview ? ' · Year 3' : match.department ? ` · ${match.department}` : ''}</p>
            {traits.length > 0 && <Tags labels={traits.slice(0, 2)} />}
            {trust && <p className="small muted">{trust.totalVouchesReceived} peer {trust.totalVouchesReceived === 1 ? 'vouch' : 'vouches'}<span className="desktop-vouch-copy"> for {name.split(' ')[0]}.</span></p>}
            {match.hasFoundingMemberBadge && <Tags labels={['Founding member']} />}
          </div>
        </div>
        <a className="button button-primary view-character" href={accepted ? '#waiting' : '#character'}>{accepted ? 'View accepted introduction' : 'View character card'}</a>
        <div className="divider" />
        <section className="shared-details">
          <h2>A few things you share</h2>
          <p className="muted">{match.sharedDeepValues.length ? `${match.sharedDeepValues.join(', ')}, and conversations that go a little deeper.` : 'A chance to discover a new perspective, at your own pace.'}</p>
          <Tags labels={match.sharedInterests.map(interestLabel)} />
        </section>
        <p className="small muted introduction-footer">One considered introduction. Every 24 hours.</p>
        {!accepted && <Button className="mobile-pass" secondary disabled={pending} onClick={onPass}>{pending ? 'Saving your choice…' : 'Pass for today'}</Button>}
      </article>
      <aside className="philosophy-card surface stack">
        <p className="eyebrow">THE VOUCH WAY</p>
        <h2 className="feature-title">Good things<br />need room<br />to grow.</h2>
        <ol className="vouch-promises">
          {[
            ['Start with character', 'Discover values and traits vouched for by peers.'],
            ['Choose thoughtfully', 'A conversation opens when you both accept.'],
            ['Write at your own pace', 'Letters, space, and permission to pause.'],
          ].map(([title, copy], index) => <li key={title}><span aria-hidden="true">0{index + 1}</span><div><h3>{title}</h3><p className="small muted">{copy}</p></div></li>)}
        </ol>
        <a className="button button-secondary" href="#letters">Open your letters</a>
      </aside>
    </div>
  </>;
}
export function CharacterScreen({ match, trust, preview, pending, onRespond, onSafety, accepted }: {
  match: Match; trust: TrustSummary | null; preview: boolean; pending: boolean;
  onRespond: (accept: boolean) => void; onSafety: () => void; accepted: boolean;
}) {
  const traits = Array.from(new Set(trust?.recentVouches.flatMap(v => traitLabels(v.traits)) ?? []));
  return <>
    <a className="button button-secondary back-button" href="#today">Back to today</a>
    <PageIntro eyebrow="THE CHARACTER CARD" display>{match.matchedUserFullName}</PageIntro>
    <p className="small muted">{match.faculty}{preview ? ' · Sabaragamuwa University' : match.department ? ` · ${match.department}` : ''}</p>
    <div className="character-columns">
      <section className="character-details stack">
        <CharacterFallback name={match.matchedUserFullName} preview={preview} />
        <p className="eyebrow">VOUCHED-FOR CHARACTER</p>
        {traits.length > 0 ? <Tags labels={traits} /> : <p className="small muted">Peer-vouched traits will appear here.</p>}
        <p className="small muted">{trust && `${trust.totalVouchesReceived} peer vouches · `}Trust score {(trust?.trustScore ?? match.trustScore).toFixed(1)} / 20</p>
        <p className="eyebrow">WHAT YOU HAVE IN COMMON</p>
        <Tags labels={match.sharedDeepValues} />
        <p className="muted">{match.sharedInterests.map(interestLabel).join(' · ') || 'Room to discover something new.'}</p>
      </section>
      <section className="peer-voices surface stack">
        <p className="eyebrow">IN THEIR OWN WORDS</p>
        <p className="letter-text">{match.bio ? `“${match.bio}”` : 'They’re leaving a little room for the conversation.'}</p>
        <div className="divider" />
        <h2>Known by the people around them.</h2>
        {trust?.recentVouches.length ? trust.recentVouches.map((vouch, index) => <div key={vouch.id} className="endorsement-group">
          {index > 0 && <div className="divider" />}
          <article className="endorsement"><Avatar name={preview ? `${vouch.voucherName} ${index === 0 ? 'S' : 'P'}` : vouch.voucherName} /><div>
            <p className="small">{vouch.voucherName} · fellow student</p>
            {vouch.note ? <p className="letter-text">“{vouch.note}”</p> : <Tags labels={traitLabels(vouch.traits)} />}
          </div></article>
        </div>) : <p className="muted">{trust ? 'No written endorsements yet.' : 'Peer endorsements aren’t available yet.'}</p>}
        {accepted ? <a className="button button-primary" href="#waiting">View accepted introduction</a> : <>
          <Button disabled={pending} onClick={() => onRespond(true)}>{pending ? 'Saving your choice…' : 'Accept introduction'}</Button>
          <Button secondary disabled={pending} onClick={() => onRespond(false)}>Pass for today</Button>
        </>}
        <p className="small muted">Your letters open only if you both accept.</p>
        <button className="text-action small" onClick={onSafety}>Report or block this profile</button>
      </section>
    </div>
  </>;
}
export function ReflectionScreen({ reflection, passed = false }: { reflection: Reflection | null; passed?: boolean }) {
  return <div className="focused-screen">
    <PageIntro eyebrow="YOUR DAILY REFLECTION">Some days are<br />for looking inward.</PageIntro>
    <p className="muted">{passed ? 'Your choice has been saved. There’s space for a new introduction in the next daily cycle.' : 'No new introduction today. We’ll keep looking for a thoughtful connection.'}</p>
    <section className="reflection-card surface stack">
      <p className="eyebrow">A MOMENT FOR YOU</p>
      <h2 className="feature-title">{reflection?.thoughtProvokingQuestion || 'What brought you a little peace today?'}</h2>
      {reflection?.interestCategory && <p className="small">Inspired by your interest in {reflection.interestCategory.toLowerCase()}.</p>}
    </section>
    <a className="button button-secondary" href="#today">Return to today</a>
    <a className="button button-primary" href="#letters">Read your letters</a>
  </div>;
}
export function WaitingScreen({ match, mutual, onRefresh, refreshing }: { match: Match; mutual: boolean; onRefresh: () => void; refreshing: boolean }) {
  const firstName = match.matchedUserFullName.split(' ')[0];
  return <div className="focused-screen">
    <PageIntro eyebrow={mutual ? 'A MUTUAL CONNECTION' : 'INTRODUCTION ACCEPTED'}>You’ve opened<br />the door.</PageIntro>
    <section className="waiting-card surface stack">
      <Avatar name={match.matchedUserFullName} />
      <h2>{match.matchedUserFullName}</h2>
      <p className="small primary-text">{mutual ? `${firstName} has accepted, too. Your letters are open.` : `Waiting for ${firstName} to accept, too.`}</p>
      <p className="muted">A letter conversation will open if you both choose to connect. You don’t need to do anything else.</p>
    </section>
    <p className="letter-text muted">Good connections deserve a little space.</p>
    <a className="button button-primary" href={mutual ? '#letters' : '#today'}>{mutual ? 'Open your letters' : 'Back to today'}</a>
    <a className="button button-secondary" href="#letters">Read existing letters</a>
    <button className="text-action small" disabled={refreshing} onClick={onRefresh}>{refreshing ? 'Checking…' : 'Check for an update'}</button>
  </div>;
}
