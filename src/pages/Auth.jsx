import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

// Official Google 'G' Logo SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleGuideModal, setShowGoogleGuideModal] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const { effectiveTheme } = useTheme();
  const navigate = useNavigate();
  const googleBtnContainerRef = useRef(null);
  const tokenClientRef = useRef(null);
  const [googleBtnRendered, setGoogleBtnRendered] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle detailed auth errors with actionable messages
  const handleAuthError = (err) => {
    console.error('Authentication Error:', err);
    if (err.response?.data?.message) {
      setError(err.response.data.message);
    } else if (err.code === 'ERR_NETWORK' || !err.response) {
      setError('Unable to connect to backend server. Make sure the backend is running on port 5000.');
    } else if (err.message) {
      setError(err.message);
    } else {
      setError('Google sign-in failed. Please try again.');
    }
  };

  // Initialize Google Identity Services & OAuth2 Token Client
  useEffect(() => {
    if (!googleClientId) return;

    const setupGoogle = () => {
      // 1. Initialize OAuth2 Token Client (opens Google account chooser popup on button click)
      if (window.google?.accounts?.oauth2 && !tokenClientRef.current) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse?.error) {
                console.warn('[Google OAuth Response Error]:', tokenResponse);
                if (tokenResponse.error === 'popup_closed_by_user') {
                  setError('Google sign-in popup was closed.');
                } else if (tokenResponse.error === 'access_denied') {
                  setError('Google sign-in was denied.');
                } else {
                  setError(`Google sign-in error: ${tokenResponse.error_description || tokenResponse.error}`);
                }
                setGoogleLoading(false);
                return;
              }
              if (tokenResponse?.access_token) {
                setGoogleLoading(true);
                setError('');
                try {
                  await loginWithGoogle({
                    accessToken: tokenResponse.access_token,
                    name: name?.trim() || undefined,
                  });
                  navigate('/dashboard');
                } catch (err) {
                  handleAuthError(err);
                } finally {
                  setGoogleLoading(false);
                }
              }
            },
            error_callback: (err) => {
              console.warn('[Google OAuth Error Callback]:', err);
              setGoogleLoading(false);
              if (err?.type === 'popup_closed') {
                setError('Google sign-in window was closed.');
              } else {
                setError('Could not open Google sign-in window. Check popup permissions.');
              }
            },
          });
        } catch (e) {
          console.warn('[Google OAuth2 init error]:', e);
        }
      }

      // 2. Initialize Identity Services (ID Token / One Tap & Official Button)
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            use_fedcm_for_prompt: false, // Disables FedCM to avoid localhost NetworkError
          });

          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            const isDark = effectiveTheme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: isDark ? 'filled_black' : 'outline',
              size: 'large',
              width: 380,
              shape: 'rectangular',
              text: isLogin ? 'signin_with' : 'signup_with',
              logo_alignment: 'left',
            });
            setGoogleBtnRendered(true);
          }
        } catch (e) {
          console.warn('Google Identity initialization notice:', e);
        }
      }
    };

    if (window.google?.accounts) {
      setupGoogle();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts) {
          clearInterval(timer);
          setupGoogle();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [googleClientId, isLogin, effectiveTheme]);

  // Handle Google Token Response from official Google Sign-In button
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle({
        credential: response.credential,
        name: name?.trim() || undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Google button click handler (uses OAuth2 token client popup)
  const handleGoogleClick = () => {
    setError('');
    if (!googleClientId) {
      setShowGoogleGuideModal(true);
      return;
    }

    if (tokenClientRef.current) {
      try {
        setGoogleLoading(true);
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Token client request failed:', err);
      }
    }

    // Fallback: trigger click on rendered Google button if present
    const renderedBtn = googleBtnContainerRef.current?.querySelector('div[role="button"]');
    if (renderedBtn) {
      renderedBtn.click();
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In service is still loading. Please wait a moment.');
    }
  };

  // Developer 1-click test flow when GOOGLE_CLIENT_ID is not yet configured
  const handleSimulateGoogleLogin = async () => {
    setShowGoogleGuideModal(false);
    setGoogleLoading(true);
    setError('');
    try {
      const mockTestUser = {
        email: email.trim() ? email.trim().toLowerCase() : 'user.google@example.com',
        name: name.trim() ? name.trim() : 'Google User',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        googleId: `google_sim_${Date.now()}`,
      };
      await loginWithGoogle({ testUser: mockTestUser });
      navigate('/dashboard');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Email/Password Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-bg relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface border border-theme rounded-3xl p-5 sm:p-7 md:p-9 card-shadow relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-accent text-white flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            {isLogin ? 'Welcome back to Life OS' : 'Create your Account'}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1 font-medium">
            {isLogin ? 'Access your unified life management system' : 'Start tracking your habits, goals & health with clarity'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex bg-subtle p-1 rounded-xl border border-theme mb-5">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${isLogin
              ? 'bg-surface text-primary card-shadow'
              : 'text-secondary hover:text-primary'
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${!isLogin
              ? 'bg-surface text-primary card-shadow'
              : 'text-secondary hover:text-primary'
              }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* --- GOOGLE AUTHENTICATION SECTION --- */}
        <div className="space-y-3">
          {/* Official Google GSI Button Container */}
          <div
            ref={googleBtnContainerRef}
            className={`flex justify-center w-full min-h-[44px] overflow-hidden ${googleBtnRendered ? '' : 'hidden'
              }`}
          />

          {/* Custom Google Button (visible when official button is loading or on ad-blocker fallback) */}
          {!googleBtnRendered && (
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-surface hover:bg-subtle border border-theme hover:border-accent/40 text-primary font-bold text-xs sm:text-sm transition-all duration-200 card-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>
                {googleLoading
                  ? 'Connecting to Google...'
                  : isLogin
                    ? 'Continue with Google'
                    : 'Sign up with Google'}
              </span>
            </button>
          )}

          {/* Micro troubleshoot link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowGoogleGuideModal(true)}
              className="text-[11px] text-secondary hover:text-accent font-medium underline transition-colors cursor-pointer"
            >
              Google Sign-In troubleshooting & test mode
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-theme" />
          <span className="absolute bg-surface px-3 text-[11px] font-bold text-secondary uppercase tracking-wider">
            or continue with email
          </span>
        </div>

        {/* --- EMAIL & PASSWORD FORM --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base input-with-icon-left"
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base input-with-icon-left"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base input-with-icon-left input-with-icon-right"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary cursor-pointer p-1 z-10"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!isLogin && (
              <span className="text-[10px] text-secondary mt-1 block">
                Must be at least 6 characters long
              </span>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full font-bold shadow-md shadow-indigo-500/20"
            >
              {isLogin ? 'Sign In to Life OS' : 'Create Account & Start'}
            </Button>
          </div>
        </form>

        {/* Security & Privacy Micro-Footer */}
        <div className="mt-6 pt-4 border-t border-theme/60 flex items-center justify-center gap-1.5 text-[11px] text-secondary font-medium text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Secured with JWT authentication & password hashing</span>
        </div>
      </div>

      {/* Google Setup Guide & Sandbox Modal */}
      <Modal
        isOpen={showGoogleGuideModal}
        onClose={() => setShowGoogleGuideModal(false)}
        title="Google Authentication Setup"
        subtitle="Live Google OAuth integration ready in your codebase"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-primary">Google Sign-In is fully coded & ready!</p>
              <p className="text-secondary leading-relaxed">
                To connect real Google accounts, obtain a Client ID from the{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-bold"
                >
                  Google Cloud Console
                </a>{' '}
                and add it to your environment variables:
              </p>
            </div>
          </div>

          <div className="space-y-2 p-3 bg-subtle rounded-xl border border-theme font-mono text-[11px]">
            <p className="text-secondary font-sans font-bold uppercase tracking-wider text-[10px]">
              Required Variables:
            </p>
            <p className="text-primary">
              <span className="text-indigo-400">client/.env:</span> VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
            </p>
            <p className="text-primary">
              <span className="text-purple-400">server/.env:</span> GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
            </p>
          </div>

          <div className="p-3 bg-subtle rounded-xl border border-theme text-[11px] space-y-1.5">
            <p className="font-bold text-primary font-sans">
              Important: Authorized JavaScript Origins in Google Cloud Console
            </p>
            <p className="text-secondary leading-relaxed">
              In your OAuth 2.0 Client ID settings, verify that <code className="text-accent font-mono">http://localhost:3000</code> and <code className="text-accent font-mono">http://localhost:5173</code> are added under <strong>Authorized JavaScript origins</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-primary">Would you like to test the Google Sign-In user flow right now?</p>
            <p className="text-secondary leading-relaxed">
              Clicking below will simulate an authentic Google OAuth profile response and sign you in directly.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setShowGoogleGuideModal(false)}>
              Close
            </Button>
            <Button variant="primary" icon={CheckCircle2} onClick={handleSimulateGoogleLogin}>
              Test Google Sign-In Flow
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Auth;
