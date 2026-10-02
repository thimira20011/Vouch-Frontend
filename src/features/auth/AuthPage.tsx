import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { AccountValues, CampusValues, SignInValues, FieldName, FormErrors, AuthRoute } from './types';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import AuthLayout from './AuthLayout';
import { campusOptions, facultyOptions, departmentOptions, yearOptions } from './campusOptions';
import { PASSWORD_HINT, validateSignIn, validateAccount, validateCampus } from './validation';
import './auth.css';

const blankAccount: AccountValues = { FullName: '', Email: '', Password: '' };
const blankCampus: CampusValues = { CampusCode: 'SAB', Faculty: '', Department: '', AcademicYear: '', InviteToken: '' };
const allowedRoutes = ['sign-in', 'sign-up', 'campus', 'invitation'];
function readRoute(): AuthRoute {
  const hash = window.location.hash.slice(1);
  return allowedRoutes.includes(hash) ? hash as AuthRoute : 'sign-in';
}

export default function AuthPage() {
  const [route, setRoute] = useState(readRoute);
  const [signin, setSignin] = useState<SignInValues>({ Email: '', Password: '' });
  const [account, setAccount] = useState(blankAccount);
  const [campus, setCampus] = useState(blankCampus);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const submitted = useRef(false);
  const signup = route !== 'sign-in';
  const campusStep = route === 'campus' || route === 'invitation';
  const invitation = route === 'invitation';
  const values: Partial<Record<FieldName, string>> = campusStep ? campus : signup ? account : signin;

  function resetFeedback() { setErrors({}); setStatus(''); submitted.current = false; }

  useEffect(() => {
    function onHashChange() { setRoute(readRoute()); resetFeedback(); }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => { document.title = `${signup ? 'Join your campus' : 'Sign in'} — Vouch`; }, [signup]);

  function navigate(next: AuthRoute) {
    resetFeedback();
    // Preserve signup drafts between steps, clear credentials when leaving signup.
    if (next === 'sign-in') { setAccount(blankAccount); setCampus(blankCampus); }
    if (next === 'sign-up' && !signup) setSignin({ Email: '', Password: '' });
    setRoute(next);
    window.history.pushState(null, '', `#${next}`);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      document.querySelector('.auth-main')?.scrollTo(0, 0);
      window.scrollTo(0, 0);
    });
  }
  function validate(current: Partial<Record<FieldName, string>>): FormErrors {
    return campusStep ? validateCampus(current as CampusValues, invitation) : signup ? validateAccount(current as AccountValues) : validateSignIn(current as SignInValues);
  }
  function update(name: FieldName, value: string) {
    const next = { ...values, [name]: value };
    if (name === 'Faculty') next.Department = '';
    if (campusStep) setCampus(next as CampusValues);
    else if (signup) setAccount(next as AccountValues);
    else setSignin(next as SignInValues);
    setStatus('');
    if (submitted.current || errors[name]) setErrors(validate(next));
  }
  function blur(name: FieldName) {
    if (!values[name] && !submitted.current) return;
    const next = validate(values);
    setErrors((current) => {
      const result = { ...current };
      if (next[name]) result[name] = next[name]; else delete result[name];
      return result;
    });
  }
  function showErrors(nextErrors: FormErrors) {
    setErrors(nextErrors);
    requestAnimationFrame(() => summaryRef.current?.focus());
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); submitted.current = true; setStatus('');
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
    if (route === 'sign-up') { navigate('campus'); return; }
    if (campusStep && Object.keys(validateAccount(account)).length) {
      navigate('sign-up'); submitted.current = true; showErrors(validateAccount(account)); return;
    }
    // Local UI preview only; real authentication and account creation need the backend.
    setErrors({});
    setStatus(campusStep
      ? 'Your details are ready. Account creation will be available when the service is connected.'
      : 'Your details are ready. Sign-in will be available when the service is connected.');
  }

  const title = route === 'sign-in' ? 'Welcome back.' : route === 'sign-up' ? 'Begin with you.' : invitation ? <>An invitation<br />to begin.</> : 'Find your circle.';
  const description = route === 'sign-in' ? 'Sign in to your university circle. There’s no need to catch up in a hurry.'
    : route === 'sign-up' ? 'A few details to get started. Your photo can wait.'
    : invitation ? 'This campus is in its founding phase. An ambassador invitation is needed to join.'
    : 'Your academic details help us keep connections within your campus.';
  const fieldProps = (name: FieldName) => ({ name, value: values[name] ?? '', onChange: update, onBlur: blur, error: errors[name] });
  const errorEntries = Object.entries(errors);

  return (
    <AuthLayout signup={signup}>
      <form className="auth-form" noValidate onSubmit={submit} aria-labelledby="auth-title">
        <div className="form-intro">
          <p className="eyebrow">{signup ? `STEP ${campusStep ? 2 : 1} OF 2 · YOUR ${campusStep ? 'CAMPUS' : 'ACCOUNT'}` : 'YOUR NEXT CHAPTER'}</p>
          <h1 id="auth-title" ref={headingRef} tabIndex={-1}>{title}</h1>
          <p className="form-description">{description}</p>
        </div>
        {errorEntries.length > 0 && <div className="form-notice error-summary" role="alert" tabIndex={-1} ref={summaryRef} aria-labelledby="error-title">
          <h2 id="error-title">{signup ? 'A few details need another look.' : 'Please check your details.'}</h2>
          <ul>{errorEntries.map(([name, message]) => <li key={name}><a href={`#${name}`} onClick={(event) => { event.preventDefault(); document.getElementById(name)?.focus(); }}>{message}</a></li>)}</ul>
        </div>}
        {invitation && <div className="form-notice">
          <h2>General registration isn’t open yet.</h2>
          <p>Use an invitation supplied by the campus ambassador team. A code must be validated before an account is created.</p>
        </div>}
        <div className="form-fields" key={campusStep ? 'campus' : signup ? 'account' : 'signin'}>
          {campusStep ? <>
            {invitation && <FormField {...fieldProps('InviteToken')} label="Ambassador invitation" placeholder="Paste your invitation code" hint="Invitation links may fill this code for you." autoComplete="off" />}
            <FormField {...fieldProps('CampusCode')} label="University" options={campusOptions} hint={campusOptions.find((option) => option.value === campus.CampusCode)?.fullName} />
            <FormField {...fieldProps('Faculty')} label="Faculty" placeholder="Select your faculty" options={facultyOptions} />
            <FormField {...fieldProps('Department')} label="Department" placeholder="Select your department" options={departmentOptions} />
            <FormField {...fieldProps('AcademicYear')} label="Academic year" placeholder="Select your year" options={yearOptions} />
          </> : <>
            {signup && <FormField {...fieldProps('FullName')} label="Full name" placeholder="Your full name" autoComplete="name" />}
            <FormField {...fieldProps('Email')} label="University email" type="email" placeholder="you@university.ac.lk" autoComplete="email" hint={signup ? 'Use your .ac.lk or approved university email.' : 'Use the email you registered with.'} />
            <FormField {...fieldProps('Password')} label={signup ? 'Create password' : 'Password'} type="password" placeholder={signup ? 'Create a password' : 'Enter your password'} autoComplete={signup ? 'new-password' : 'current-password'} hint={signup ? PASSWORD_HINT : undefined} />
          </>}
        </div>
        <Button type="submit">{route === 'sign-in' ? 'Sign in' : route === 'sign-up' ? 'Continue' : invitation ? 'Create account with invitation' : 'Create account'}</Button>
        {route === 'sign-in' ? <div className="new-member">
          <p>New here? Start with what matters.</p>
          <Button secondary onClick={() => navigate('sign-up')}>Create an account</Button>
        </div> : campusStep ? <>
          {!invitation && <Button secondary onClick={() => navigate('invitation')}>Have an ambassador invitation?</Button>}
          <Button secondary onClick={() => navigate('sign-up')}>Back to account details</Button>
        </> : <Button secondary onClick={() => navigate('sign-in')}>Already a member? Sign in</Button>}
        <p className="form-footer">{route === 'sign-in' ? 'A university email brings you into the same community.' : route === 'sign-up' ? 'Next: your university, faculty and academic year.' : 'After signup, you’ll choose your values, interests and a short bio. Photos are optional.'}</p>
        <div className={status ? 'form-notice' : 'status-empty'} role="status" aria-live="polite">{status}</div>
      </form>
    </AuthLayout>
  );
}
