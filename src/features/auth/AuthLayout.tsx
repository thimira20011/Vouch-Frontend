import type { ReactNode } from 'react';

export default function AuthLayout({ signup, children }: { signup: boolean; children: ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="brand-panel" aria-label="About Vouch">
        <span className="brand">vouch.</span>
        <div className="brand-story">
          <p className="eyebrow">A SMALLER CIRCLE. A DEEPER CONNECTION.</p>
          <h2>{signup ? <>Good connections<br />begin with<br />something real.</> : <>A little less noise.<br />A little more<br />connection.</>}</h2>
          <p>Meet through shared values, peer-vouched character, and letters written at your own pace.</p>
        </div>
        <ol className="brand-promises">
          <li><span>01</span>A university community</li>
          <li><span>02</span>Character before appearances</li>
          <li><span>03</span>One introduction. No rush.</li>
        </ol>
      </aside>
      <header className="auth-mobile-header">
        <span className="brand">vouch.</span>
        <p className="eyebrow">{signup ? 'JOIN YOUR CAMPUS' : 'WELCOME BACK'}</p>
      </header>
      <main className="auth-main" id="main-content">{children}</main>
    </div>
  );
}
