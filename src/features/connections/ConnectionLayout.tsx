import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Avatar from '../../components/Avatar';
import type { AuthSession, ConnectionRoute } from './types';

export default function ConnectionLayout({ children, route, user, preview, onSignOut }: {
  children: ReactNode; route: ConnectionRoute; user: AuthSession; preview: boolean; onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLElement>(null);
  const previousRoute = useRef(route);
  useEffect(() => {
    setMenuOpen(false);
    const title = headingRef.current?.querySelector('h1');
    document.title = `${title?.textContent ?? 'Your circle'} — Vouch`;
    if (previousRoute.current !== route) { headingRef.current?.scrollTo(0, 0); title?.focus(); }
    previousRoute.current = route;
  }, [route]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuRef.current?.querySelector('button')?.focus(); } };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [menuOpen]);
  const letters = route === 'letters' || route === 'paused';
  const navigation = <>
    <a className={`nav-link ${!letters && ['today', 'character', 'waiting', 'reflection'].includes(route) ? 'is-current' : ''}`} href="#today" aria-current={!letters && ['today', 'character', 'waiting', 'reflection'].includes(route) ? 'page' : undefined}>Today</a>
    <a className={`nav-link ${letters ? 'is-current' : ''}`} href="#letters" aria-current={letters ? 'page' : undefined}>Letters</a>
  </>;
  return <div className="connection-app">
    <a className="skip-link" href="#reading" onClick={event => { event.preventDefault(); headingRef.current?.focus(); }}>Skip to content</a>
    <header className="website-header">
      <a className="brand" href="#today" aria-label="Vouch home">vouch.</a>
      <p className="header-promise">Good connections take their time.</p>
      <div className="account-menu" ref={menuRef}>
        <button className="avatar-button" aria-label="Your account" aria-expanded={menuOpen} aria-controls="account-links" onClick={() => setMenuOpen(v => !v)}><Avatar name={user.fullName} /></button>
        {menuOpen && <div id="account-links" className="account-links">
          <p>{user.fullName}</p>
          <a href="#profile">Your character & vouches</a>
          <a href="#onboarding">Values & interests</a>
          <a href="#vouch">Vouch for a peer</a>
          <button onClick={onSignOut}>{preview ? 'Leave preview' : 'Sign out'}</button>
        </div>}
      </div>
    </header>
    <div className="connection-layout">
      <aside className="sidebar">
        <p className="eyebrow">YOUR CAMPUS</p>
        <p className="campus-title">{preview ? <>Sabaragamuwa<br />University</> : 'Your university circle'}</p>
        <nav aria-label="Main navigation">{navigation}</nav>
        <p className="quiet-footer">A smaller circle.<br />A deeper connection.</p>
      </aside>
      <main className="reading-viewport" id="reading" ref={headingRef} tabIndex={-1}>
        <div className="reading-content">{children}</div>
      </main>
    </div>
    <nav className="mobile-navigation" aria-label="Mobile navigation">{navigation}</nav>
    {preview && <aside className="preview-label" aria-label="Design preview">Design preview · sample data</aside>}
  </div>;
}
