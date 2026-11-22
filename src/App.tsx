import { useEffect, useState, Component, type ReactNode } from 'react';
import type { ProfileDoc } from './lib/store';
import { defaultProfile, loadLocal, saveLocal, clearLocal, loadLocalAuth, saveLocalAuth, hasFullAccess, levelForXp, titleForLevel , normalizeCheckinFrequency, normalizeProfile, refillMana, earnedArmorIds } from './lib/store';
import * as api from './lib/api';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import Today from './components/Today';
import Workouts from './components/Workouts';
import Cardio from './components/Cardio';
import Sleep from './components/Sleep';
import Journey from './components/Journey';
import Nutrition from './components/Nutrition';
import Progress from './components/Progress';
import Armor from './components/Armor';
import Faq from './components/Faq';
import ToastHost from './components/Toast';
import { showToast } from './lib/toast';
import Coach from './components/Coach';

export type Tab = 'today' | 'assessment' | 'workouts' | 'cardio' | 'sleep' | 'journey' | 'nutrition' | 'progress' | 'armor' | 'faq' | 'coach';

/** If one tab throws while rendering, show a small card for that tab
 * instead of blanking the whole app. The header and nav stay up, so the
 * client can tap another tab or reload. */
class TabErrorBoundary extends Component<{ tab: Tab; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(prevProps: { tab: Tab }) {
    if (prevProps.tab !== this.props.tab && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="card">
          <h3>This tab had a problem</h3>
          <p>It did not load. Your progress is saved. Try another tab, or reload the page.</p>
          <button className="primary" onClick={() => window.location.reload()}>Reload the page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☀' },
  { id: 'assessment', label: 'Assessment', icon: '✓' },
  { id: 'workouts', label: 'Workouts', icon: '◆' },
  { id: 'cardio', label: 'Cardio', icon: '♥' },
  { id: 'sleep', label: 'Sleep', icon: '☾' },
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
  /** Show a short toast at the top of the screen ("Saved", "+10 XP"). */
  toast: (msg: string) => void;
}

export default function App() {
  const [doc, setDoc] = useState<ProfileDoc | null>(null);
  const [auth, setAuth] = useState<{ email: string; displayName: string } | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  const [serverMode, setServerMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // True only once the server profile for the CURRENT signed-in account
  // has actually answered (with a profile, or with "no profile yet").
  // save() must never PUT to the server before this is true: before the
  // fix, a failed load fell through to a fresh default doc and the next
  // save overwrote the real profile in Neon with 0 XP, no guardian.
  const [remoteReady, setRemoteReady] = useState(false);
  const [showBeta, setShowBeta] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [betaMsg, setBetaMsg] = useState('');
  const [betaBusy, setBetaBusy] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');

  // Load the server profile for one signed-in user, behind the loading
  // screen. Runs on first mount AND after every sign-in / sign-up: the
  // old code only ran on mount, so signing in (or signing back in after
  // sign-out) never reloaded the server profile and the app showed a
  // fresh 0 XP default as if the account were new, with no loading
  // screen at all. A failed load stays on the loading screen with a
  // Retry button instead of falling through to a fresh default that a
  // later save could write over the real profile.
  const loadRemoteProfile = async (user: { email: string; displayName: string }) => {
    setLoading(true);
    setLoadError('');
    try {
      const remote = await api.loadProfile();
      if (remote) {
        const next = normalizeProfile(remote);
        setDoc(next);
        saveLocal(next);
      } else {
        // No server profile yet (a brand-new account): only use the
        // local copy if it actually holds progress. Otherwise start
        // from a fresh default, which is the correct first-run state.
        const local = normalizeProfile(loadLocal());
        const hasLocal = local.guardianPicked || local.xp > 0 || local.assessmentDone || local.workouts.length > 0;
        local.email = local.email || user.email;
        local.displayName = local.displayName || user.displayName;
        setDoc(hasLocal ? local : { ...local, email: user.email, displayName: user.displayName });
      }
      setRemoteReady(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Your profile could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const mode = await api.detectMode();
      setServerMode(mode === 'server');
      if (mode === 'server') {
        try {
          const meRes = await api.me();
          if (meRes.user) {
            setAuth(meRes.user);
            // Mark this account as loaded here so the auth effect below
            // does not load the same profile a second time.
            setAuthLoadedFor(meRes.user.email);
            await loadRemoteProfile(meRes.user);
            return;
          }
        } catch {
          /* not signed in: fall through to local */
        }
      }
      const localAuth = loadLocalAuth();
      if (localAuth) setAuth(localAuth);
      const localDoc = normalizeProfile(loadLocal());
      localDoc.email = localDoc.email || localAuth?.email || '';
      localDoc.displayName = localDoc.displayName || localAuth?.displayName || '';
      setDoc(localDoc);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After sign-in / sign-up, reload the server profile for that account.
  // Auth's onAuth calls this through handleAuth below; it is an effect
  // here so the reload also happens whenever auth changes.
  const [authLoadedFor, setAuthLoadedFor] = useState('');
  useEffect(() => {
    if (auth && serverMode && auth.email && authLoadedFor !== auth.email) {
      setAuthLoadedFor(auth.email);
      void loadRemoteProfile(auth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, serverMode]);

  const save = (next: ProfileDoc) => {
    const fixed = normalizeProfile(next);
    // Migrate old check-in picks: recorded video was never a check-in type,
    // and live video calls are 30 minutes, at most once a week, 1 to 4 times
    // a month, never more often than weekly.
    if ((fixed.checkinMode as string) === 'recorded-video') fixed.checkinMode = 'text';
    fixed.checkinFrequency = normalizeCheckinFrequency(fixed.checkinMode, fixed.checkinFrequency);
    fixed.lastActive = new Date().toISOString();
    fixed.level = levelForXp(fixed.xp);
    // Mana refills to full once a day, and armor is always worked out from
    // what the client has actually done, so earned gear shows as earned.
    // Both used to never run, so mana never refilled and the vault always
    // showed 1 of 30 earned.
    refillMana(fixed);
    const earned = earnedArmorIds(fixed);
    fixed.armorEarned = earned;
    fixed.rarityEarned = earned;
    setDoc(fixed);
    saveLocal(fixed);
    // Never write to the server until the server profile for this account
    // has actually loaded (remoteReady). Before this guard, a fresh
    // default doc could be PUT over the real profile after a failed load.
    if (serverMode && auth && remoteReady) {
      api.saveProfile(fixed).catch(() => undefined);
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

  // Sign-in / sign-up: in server mode the auth effect above reloads the
  // server profile for this account (behind the loading screen). Do NOT
  // update() the current doc here: while signed out it is a fresh
  // default, and writing it would clobber the real server profile.
  // In local mode there is no server profile, so keep the old behaviour.
  const handleAuth = (a: { email: string; displayName: string }) => {
    setAuth(a);
    saveLocalAuth(a);
    if (!serverMode) {
      update((d) => {
        d.email = a.email;
        d.displayName = a.displayName;
      });
    }
  };

  if (loadError && auth) {
    return (
      <div className="app">
        <div className="banner">
          <h1>Active Life Quest</h1>
          <p>Your profile could not be loaded.</p>
        </div>
        <div className="card">
          <p>{loadError}</p>
          <p>Your progress is still saved on your account. It did not load, so the app is waiting instead of showing a fresh start.</p>
          <button
            className="primary"
            onClick={() => {
              setAuthLoadedFor('');
              void loadRemoteProfile(auth);
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

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

  const ctx: Ctx = { doc, save, update, go, auth, serverMode, toast: showToast };

  if (!auth) {
    return (
      <div className={doc.largeText ? 'large-text' : ''}>
        <div className="app">
          <ToastHost />
          <Auth onAuth={handleAuth} />
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
        <ToastHost />
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
        <TabErrorBoundary tab={tab}>
          {doc.guardianPicked && tab === 'today' && <Today ctx={ctx} />}
          {tab === 'assessment' && <Assessment ctx={ctx} />}
          {tab === 'workouts' && <Workouts ctx={ctx} />}
          {tab === 'cardio' && <Cardio ctx={ctx} />}
          {tab === 'sleep' && <Sleep ctx={ctx} />}
          {tab === 'journey' && <Journey ctx={ctx} />}
          {tab === 'nutrition' && <Nutrition ctx={ctx} />}
          {tab === 'progress' && <Progress ctx={ctx} />}
          {tab === 'armor' && <Armor ctx={ctx} />}
          {tab === 'faq' && <Faq ctx={ctx} />}
          {tab === 'coach' && <Coach ctx={ctx} />}
        </TabErrorBoundary>

        {!full && doc.guardianPicked && tab === 'today' && (
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
                  showToast('Trial started. 14 days free.');
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
                      showToast('Beta access unlocked. Welcome to the quest.');
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
                  setRemoteReady(false);
                  setAuthLoadedFor('');
                  setLoadError('');
                  setDoc(defaultProfile());
                  setConfirmSignOut(false);
                }}
              >
                Yes, sign out
              </button>{' '}
              <button onClick={() => setConfirmSignOut(false)}>Cancel</button>
            </span>
          )}{' '}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}>Delete my account</button>
          ) : (
            <span>
              Delete your account and all your progress? This cannot be undone.{' '}
              <button
                className="primary"
                onClick={async () => {
                  try {
                    await api.deleteAccount();
                    api.logout();
                    clearLocal();
                    setAuth(null);
                    setRemoteReady(false);
                    setAuthLoadedFor('');
                    setLoadError('');
                    setDoc(defaultProfile());
                  } catch (e) {
                    setDeleteMsg(e instanceof Error ? e.message : 'Your account could not be deleted. Try again, or message Derek.');
                  }
                  setConfirmDelete(false);
                }}
              >
                Yes, delete everything
              </button>{' '}
              <button onClick={() => setConfirmDelete(false)}>Cancel</button>
            </span>
          )}{' '}
          {deleteMsg && <span>{deleteMsg}</span>}{' '}
          · Active Life Personal Training by Derek · Derek cannot fix, treat, diagnose, or cure pain.
        </footer>

        <nav className="nav" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${tab === t.id ? 'active' : ''}${pressedTab === t.id ? ' pressed' : ''}`}
              onPointerDown={() => setPressedTab(t.id)}
              onPointerUp={() => setPressedTab(null)}
              onPointerLeave={() => setPressedTab(null)}
              onPointerCancel={() => setPressedTab(null)}
              onClick={() => { setPressedTab(null); go(t.id); }}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
              {t.id === 'today' && unread > 0 && <span className="badge">{unread}</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
