import { useState } from 'react';
import * as api from '../lib/api';
import { PRICES, TRIAL_DAYS } from '../lib/data';

export default function Auth({ onAuth }: { onAuth: (a: { email: string; displayName: string }) => void }) {
  const [mode, setMode] = useState<'signup' | 'login' | 'forgot' | 'reset'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (api.getMode() === 'local') {
        // Local mode: no server yet. Create a local account on this device.
        if (mode === 'forgot' || mode === 'reset') {
          setInfo('Password reset needs the hosted version. For now, just sign up again with a new password on this device.');
          return;
        }
        if (!email.includes('@') || password.length < 8) {
          setError('Use a real email address and a password of at least 8 characters.');
          return;
        }
        onAuth({ email: email.trim().toLowerCase(), displayName: name.trim() || email.split('@')[0] });
        return;
      }
      if (mode === 'signup') {
        const r = await api.signup(email.trim().toLowerCase(), password, name.trim() || email.split('@')[0]);
        onAuth(r.user);
      } else if (mode === 'login') {
        const r = await api.login(email.trim().toLowerCase(), password);
        onAuth(r.user);
      } else if (mode === 'forgot') {
        await api.forgotPassword(email.trim().toLowerCase());
        setInfo('If that email has an account, a reset link was sent. Check your inbox.');
      } else {
        await api.resetPassword(token.trim(), password);
        setInfo('Password updated. Sign in with your new password.');
        setMode('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="banner">
        <h1>Active Life Quest</h1>
        <p>Assessment first, then a plan built around you. Gamified weight loss and corrective movement for beginners.</p>
      </div>

      <div className="card gold-frame">
        <h2>Free plan</h2>
        <p>The assessment and Week 1 are free. After that, a {TRIAL_DAYS}-day trial, then paid coaching. No one is charged in beta.</p>
        <p className="small muted">
          Have a code from Derek? Enter it here after you sign up. The code is ACTIVEBETA for beta testers.
        </p>
        <table>
          <tbody>
            {PRICES.map((p) => (
              <tr key={p.label}>
                <td>{p.label}</td>
                <td>${p.price}</td>
                <td className="muted">{p.note || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted">Prices are shown in the app. Payment is through Stripe when the hosted version goes live. No real payment is wired yet.</p>
      </div>

      <div className="card">
        <h2>{mode === 'signup' ? 'Create your account' : mode === 'login' ? 'Welcome back' : mode === 'forgot' ? 'Reset your password' : 'Set a new password'}</h2>
        {api.getMode() === 'local' && (
          <p className="small muted">
            This copy is running in local mode (no database connected yet). Your account and progress save on this device only. Sign up with email on the hosted version to keep progress across devices.
          </p>
        )}
        {error && <div className="error">{error}</div>}
        {info && <div className="ok">{info}</div>}
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label htmlFor="auth-name">Your first name</label>
              <input id="auth-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
            </>
          )}
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          {mode === 'reset' && (
            <>
              <label htmlFor="auth-token">Reset code</label>
              <input id="auth-token" value={token} onChange={(e) => setToken(e.target.value)} required />
            </>
          )}
          {mode !== 'forgot' && (
            <>
              <label htmlFor="auth-pass">Password (at least 8 characters)</label>
              <input id="auth-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </>
          )}
          <div style={{ marginTop: 14 }}>
            <button className="primary" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'login' ? 'Sign in' : mode === 'forgot' ? 'Send reset link' : 'Set new password'}
            </button>
          </div>
        </form>
        <div className="row" style={{ marginTop: 12 }}>
          {mode !== 'signup' && <button onClick={() => setMode('signup')}>Create an account</button>}
          {mode !== 'login' && <button onClick={() => setMode('login')}>Sign in</button>}
          {mode !== 'forgot' && mode !== 'reset' && <button onClick={() => setMode('forgot')}>Forgot password</button>}
          {mode === 'forgot' && <button onClick={() => setMode('reset')}>I have a reset code</button>}
        </div>
      </div>

      <div className="card">
        <h3>How it works</h3>
        <p>1. Pick your guardian. 2. Do the short assessment. 3. Find your next step on Today. 4. Start your first workout, about 10 to 15 minutes.</p>
        <p className="small muted">Derek cannot fix, treat, diagnose, or cure pain. This app helps you move better with less discomfort. For sharp, new, worsening, or non-improving pain, see a doctor or physical therapist.</p>
      </div>
    </div>
  );
}
