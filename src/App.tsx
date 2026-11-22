import { useEffect, useState } from 'react';
import type { ProfileDoc } from './lib/store';
import { defaultProfile, loadLocal, saveLocal, clearLocal, loadLocalAuth, saveLocalAuth, hasFullAccess, levelForXp, titleForLevel , normalizeCheckinFrequency } from './lib/store';
import * as api from './lib/api';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import Today from './components/Today';
import Workouts from './components/Workouts';
import Journey from './components/Journey';
import Nutrition from './components/Nutrition';
import Progress from './components/Progress';
import Armor from './components/Armor';
import Faq from './components/Faq';
import Coach from './components/Coach';

export type Tab = 'today' | 'assessment' | 'workouts' | 'journey' | 'nutrition' | 'progress' | 'armor' | 'faq' | 'coach';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☀' },
  { id: 'assessment', label: 'Assessment', icon: '✓' },
  { id: 'workouts', label: 'Workouts', icon: '◆' },
  { id: 'journey', label: 'Journey', icon: '✦' },
  { id: 'nutrition', label: 'Nutrition', icon: '●' },
  { id: 'progress', label: 'Progress', icon: '▲' },
  { id: 'armor', label: 'Armor', icon: '⬢' },
  { id: 'faq', label: 'FAQ', icon: '?' },
  { id: 'coach', label: 'Coach', icon: '★' },
];

export interface Ctx {
  doc: ProfileDoc;
  save: (next: ProfileDoc) => void;
  update: (fn: (d: ProfileDoc) => void) => void;
  go: (t: Tab) => void;
  auth: { email: string; displayName: string } | null;
  serverMode: boolean;
}

export default function App() {
  const [doc, setDoc] = useState<ProfileDoc | null>(null);
  const [auth, setAuth] = useState<{ email: string; displayName: string } | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [serverMode, setServerMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBeta, setShowBeta] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [betaMsg, setBetaMsg] = useState('');
  const [betaBusy, setBetaBusy] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    (async () => {
      const mode = await api.detectMode();
      setServerMode(mode === 'server');
      if (mode === 'server') {
        try {
          const meRes = await api.me();
          if (meRes.user) {
            setAuth(meRes.user);
            const remote = await api.loadProfile();
            if (remote) {
              setDoc(remote);
              saveLocal(remote);
              setLoading(false);
              return;
            }
          }
        } catch {
          /* fall through to local */
        }
      }
      const localAuth = loadLocalAuth();
      if (localAuth) setAuth(localAuth);
      setDoc(loadLocal() || defaultProfile(localAuth?.email || '', localAuth?.displayName || ''));
      setLoading(false);
    })();
  }, []);

  const save = (next: ProfileDoc) => {
    // Migrate old check-in picks: recorded video was never a check-in type,
    // and live video calls are 1 to 4 times a month, never weekly.
    if ((next.checkinMode as string) === 'recorded-video') next.checkinMode = 'text';
    next.checkinFrequency = normalizeCheckinFrequency(next.checkinMode, next.checkinFrequency);
    next.lastActive = new Date().toISOString();
    next.level = levelForXp(next.xp);
    setDoc(next);
    saveLocal(next);
    if (serverMode && auth) {
      api.saveProfile(next).catch(() => undefined);
    }
  };

  const update = (fn: (d: ProfileDoc) => void) => {
    if (!doc) return;
    const next: ProfileDoc = JSON.parse(JSON.stringify(doc));
    fn(next);
    save(next);
  };

  const go = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  if (loading || !doc) {
    return (
      <div className="app">
        <div className="banner">
          <h1>Active Life Quest</h1>
          <p>Loading your quest...</p>
        </div>
      </div>
    );
  }

  const ctx: Ctx = { doc, save, update, go, auth, serverMode };

  if (!auth) {
    return (
      <div className={doc.largeText ? 'large-text' : ''}>
        <div className="app">
          <Auth
            onAuth={(a) => {
              setAuth(a);
              saveLocalAuth(a);
              update((d) => {
                d.email = a.email;
                d.displayName = a.displayName;
              });
            }}
          />
          <footer className="appfoot">
            Active Life Personal Training by Derek. Derek cannot fix, treat, diagnose, or cure pain. Move better with less discomfort. For sharp, new, worsening, or non-improving pain, see a doctor or physical therapist.
          </footer>
        </div>
      </div>
    );
  }

  const full = hasFullAccess(doc);
  const level = levelForXp(doc.xp);
  const unread = doc.nudges.filter((n) => !n.read).length + doc.messages.filter((m) => m.coachReply && !m.repliedAt).length;

  return (
    <div className={doc.largeText ? 'large-text' : ''}>
      <div className="app">
        <div className="banner">
          <h1>Active Life Quest</h1>
          <p>
            {doc.guardian ? `${doc.guardian.name} the ${doc.guardian.classId}` : 'Your quest starts here'} · Level {level} {titleForLevel(level)} · {doc.xp} XP
            {doc.betaRedeemed ? ' · Beta access' : doc.trialStartedAt ? ' · Trial' : ' · Free plan'}
          </p>
        </div>

        {!doc.guardianPicked && tab !== 'assessment' && (
          <Onboarding ctx={ctx} />
        )}
        {doc.guardianPicked && tab === 'today' && <Today ctx={ctx} />}
        {tab === 'assessment' && <Assessment ctx={ctx} />}
        {tab === 'workouts' && <Workouts ctx={ctx} />}
        {tab === 'journey' && <Journey ctx={ctx} />}
        {tab === 'nutrition' && <Nutrition ctx={ctx} />}
        {tab === 'progress' && <Progress ctx={ctx} />}
        {tab === 'armor' && <Armor ctx={ctx} />}
        {tab === 'faq' && <Faq ctx={ctx} />}
        {tab === 'coach' && <Coach ctx={ctx} />}

        {!full && doc.guardianPicked && tab !== 'coach' && (
          <div className="card gold-frame">
            <h3>Free plan</h3>
            <p>The assessment and Week 1 are free. After that, a 14-day trial, then paid coaching through Stripe. No one is charged in beta.</p>
            <div className="row">
              <button
                className="primary"
                onClick={() => {
                  update((d) => {
                    d.trialStartedAt = d.trialStartedAt || new Date().toISOString();
                  });
                }}
              >
                Start my 14-day trial
              </button>
              <button
                onClick={() => {
                  setShowBeta((v) => !v);
                  setBetaMsg('');
                }}
              >
                Have a code from Derek? Enter it here
              </button>
            </div>
            {showBeta && (
              <form
                className="row"
                onSubmit={(e) => {
                  e.preventDefault();
                  const code = betaCode.trim();
                  if (!code) {
                    setBetaMsg('Enter your beta code first.');
                    return;
                  }
                  setBetaBusy(true);
                  setBetaMsg('');
                  api.redeemBeta(code).then((r) => {
                    setBetaBusy(false);
                    if (r.ok) {
                      update((d) => {
                        d.betaRedeemed = true;
                      });
                      setBetaMsg('Beta access unlocked. Welcome to the quest.');
                      setShowBeta(false);
                      setBetaCode('');
                    } else {
                      setBetaMsg(r.error || 'That code did not work.');
                    }
                  });
                }}
              >
                <label>
                  Beta code
                  <input value={betaCode} onChange={(e) => setBetaCode(e.target.value)} placeholder="ACTIVEBETA" autoCapitalize="characters" />
                </label>
                <button className="primary" type="submit" disabled={betaBusy}>
                  {betaBusy ? 'Checking...' : 'Unlock beta access'}
                </button>
              </form>
            )}
            {betaMsg && <p>{betaMsg}</p>}
          </div>
        )}

        <footer className="appfoot">
          {!confirmSignOut ? (
            <button onClick={() => setConfirmSignOut(true)}>Sign out</button>
          ) : (
            <span>
              Sign out? Your progress is saved to your account.{' '}
              <button
                className="primary"
                onClick={() => {
                  api.logout();
                  clearLocal();
                  setAuth(null);
                  setDoc(defaultProfile());
                  setConfirmSignOut(false);
                }}
              >
                Yes, sign out
              </button>{' '}
              <button onClick={() => setConfirmSignOut(false)}>Cancel</button>
            </span>
          )}{' '}
          · Active Life Personal Training by Derek · Derek cannot fix, treat, diagnose, or cure pain.
        </footer>

        <nav className="nav" aria-label="Sections">
          {TABS.filter((t) => t.id !== 'coach').map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
              <span className="nav-icon" aria-hidden="true">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
              {t.id === 'today' && unread > 0 && <span className="badge">{unread}</span>}
            </button>
          ))}
          <button className={tab === 'coach' ? 'active' : ''} onClick={() => go('coach')} aria-current={tab === 'coach' ? 'page' : undefined}>
            <span className="nav-icon" aria-hidden="true">★</span>
            <span className="nav-label">Coach</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
