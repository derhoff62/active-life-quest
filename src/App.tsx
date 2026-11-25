import { useEffect, useState, Component, type ReactNode } from 'react';
import type { ProfileDoc } from './lib/store';
import { defaultProfile, loadLocal, saveLocal, clearLocal, loadLocalAuth, saveLocalAuth, hasFullAccess, levelForXp, titleForLevel , normalizeCheckinFrequency, normalizeProfile, refillMana, earnedArmorIds } from './lib/store';
import { tabBadges } from './lib/badges';
import { tabNotice, type NoticeAction } from './lib/tabNotices';
import * as api from './lib/api';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Today from './components/Today';
import Train from './components/Train';
import Health, { type HealthSection } from './components/Health';
import Journey from './components/Journey';
import Gear from './components/Gear';
import Progress from './components/Progress';
import ToastHost from './components/Toast';
import TabNoticeCard from './components/TabNotice';
import { showToast } from './lib/toast';
import Coach from './components/Coach';

/* Six tabs, one row (Nov 25, 2026): 12 tabs in two rows was too much to
   scan, and clients could not find companions or badges. What was
   folded in, nothing deleted:
   - Train = Workouts + Assessment and retests (below the workouts,
     open when something is due).
   - Health = Cardio + Sleep + Food (Nutrition), one section at a time.
   - Journey = the map, companions, and Combat, as before.
   - Gear = Armor + Badges (badges below the gear, full list behind
     Show all badges).
   - Today also holds Questions and settings (the old FAQ tab) at the
     bottom, behind one tap.
   - Coach is not a bottom tab any more: it is Derek-only and PIN-gated,
     so it lives on a Coach sign-in button in the footer, on every tab.
   'coach' stays in the Tab type as a hidden tab so that button works. */
export type Tab = 'today' | 'train' | 'health' | 'journey' | 'gear' | 'progress' | 'coach';

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

/* Short display labels for the nav: the full words do not fit on one line
   in a 6-column grid on a phone, and the old `overflow-wrap: anywhere`
   split them mid-word ("Assessm/ent", "Workout/s" on Derek's phone, Nov 22).
   The six tab labels are all short words now (Today, Train, Health,
   Journey, Gear, Progress); the full name is still the page heading
   inside the tab, and the aria-label below uses it too.
   `white-space: nowrap` means a label can never split mid-word again —
   the ellipsis is only a backstop if a phone ever renders a label wider
   than its tab.
   a label wider than its tab. "Companions" (Nov 25, 2026) is the longest
   label now, so the nav font is 0.65rem to fit it on a 360px phone. */
const TABS: { id: Tab; label: string; full: string; icon: string }[] = [
  { id: 'today', label: 'Today', full: 'Today', icon: '☀' },
  { id: 'train', label: 'Train', full: 'Train', icon: '◆' },
  { id: 'health', label: 'Health', full: 'Health', icon: '♥' },
  { id: 'journey', label: 'Journey', full: 'Journey', icon: '✦' },
  { id: 'gear', label: 'Gear', full: 'Gear', icon: '⬢' },
  { id: 'progress', label: 'Progress', full: 'Progress', icon: '▲' },
];

export interface Ctx {
  doc: ProfileDoc;
  save: (next: ProfileDoc) => void;
  update: (fn: (d: ProfileDoc) => void) => void;
  go: (t: Tab, section?: string) => void;
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

  // Which Health section is showing (Cardio, Sleep, or Food). go() can
  // pick it: go('health', 'sleep') opens Health on Sleep.
  const [healthSection, setHealthSection] = useState<HealthSection>('cardio');

  const go = (t: Tab, section?: string) => {
    if (t === 'health' && section) setHealthSection(section as HealthSection);
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  // A button on the top-of-tab notice: open another tab, scroll to the
  // thing to do on this tab, or both (go first, then scroll once the new
  // tab has rendered). Visiting Armor or Journey no longer marks things
  // seen on arrival: the badge and the notice stay while you are on the
  // tab, and the tab itself marks them seen when you leave it.
  const handleNoticeAction = (a: NoticeAction) => {
    if (a.go) {
      go(a.go, a.section);
      if (a.anchor) {
        const anchor = a.anchor;
        window.setTimeout(() => {
          document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
      return;
    }
    if (a.anchor) {
      document.getElementById(a.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      <div className={`${doc.largeText ? 'large-text' : ''}${doc.reducedMotion ? ' reduced-motion' : ''}`}>
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
  // Gold badges on the nav tabs: a number where there is a count, a plain
  // dot where it is just "needs attention". See src/lib/badges.ts.
  const badges = tabBadges(doc);

  return (
    <div className={`${doc.largeText ? 'large-text' : ''}${doc.reducedMotion ? ' reduced-motion' : ''}`}>
      <div className="app">
        <ToastHost />
        <div className="banner">
          <h1>Active Life Quest</h1>
          <p>
            {doc.guardian ? `${doc.guardian.name} the ${doc.guardian.classId}` : 'Your quest starts here'} · Level {level} {titleForLevel(level)} · {doc.xp} XP
            {doc.betaRedeemed ? ' · Beta access' : doc.trialStartedAt ? ' · Trial' : ' · Free plan'}
          </p>
        </div>

        {!doc.guardianPicked && tab !== 'train' && (
          <Onboarding ctx={ctx} />
        )}
        {(() => {
          const notice = tabNotice(doc, tab);
          return notice ? <TabNoticeCard notice={notice} onAction={handleNoticeAction} /> : null;
        })()}
        <TabErrorBoundary tab={tab}>
          {doc.guardianPicked && tab === 'today' && <Today ctx={ctx} />}
          {tab === 'train' && <Train ctx={ctx} />}
          {tab === 'health' && <Health ctx={ctx} section={healthSection} onSection={setHealthSection} />}
          {tab === 'journey' && <Journey ctx={ctx} />}
          {tab === 'gear' && <Gear ctx={ctx} />}
          {tab === 'progress' && <Progress ctx={ctx} />}
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
          <button
            className="primary"
            onClick={() => {
              go('today');
              window.setTimeout(() => {
                document.getElementById('today-messages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 150);
            }}
          >
            Need help? Message Derek
          </button>{' '}
          {/* Coach used to be a bottom tab. It is Derek-only and PIN-gated,
              so it lives here in the footer instead, on every tab, with
              the unread count when Derek has messages to review. */}
          <button
            onClick={() => go('coach')}
          >
            Coach sign-in{badges.coach?.count ? ` (${badges.coach.count})` : ''}
          </button>{' '}
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
          {TABS.map((t) => {
            const badge = badges[t.id];
            return (
            <button
              key={t.id}
              className={`${tab === t.id ? 'active' : ''}${pressedTab === t.id ? ' pressed' : ''}`}
              onPointerDown={() => setPressedTab(t.id)}
              onPointerUp={() => setPressedTab(null)}
              onPointerLeave={() => setPressedTab(null)}
              onPointerCancel={() => setPressedTab(null)}
              onClick={() => { setPressedTab(null); go(t.id); }}
              aria-current={tab === t.id ? 'page' : undefined}
              aria-label={badge ? `${t.full}, ${badge.count ? `${badge.count} things to do` : 'needs attention'}` : t.full}
            >
              <span className="nav-icon" aria-hidden="true">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
              {badge && (
                <span className={`badge${badge.count == null ? ' dot' : ''}`} aria-hidden="true">
                  {badge.count != null ? (badge.count > 9 ? '9+' : badge.count) : ''}
                </span>
              )}
            </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
