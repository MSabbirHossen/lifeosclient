import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';

// Official Google 'G' Logo SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

// Client-side Password Strength Evaluator
const evaluatePasswordStrength = (pwd) => {
  if (!pwd) {
    return {
      score: 0,
      label: 'Too Short',
      textColor: 'text-muted',
      barColor: 'bg-subtle',
      hasMinLength: false,
      hasUppercase: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasUppercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  let label = 'Weak';
  let textColor = 'text-rose-500';
  let barColor = 'bg-rose-500';

  if (score === 2) {
    label = 'Fair';
    textColor = 'text-amber-500';
    barColor = 'bg-amber-500';
  } else if (score === 3) {
    label = 'Good';
    textColor = 'text-indigo-500';
    barColor = 'bg-indigo-500';
  } else if (score >= 4) {
    label = 'Strong';
    textColor = 'text-emerald-500';
    barColor = 'bg-emerald-500';
  }

  return {
    score,
    label,
    textColor,
    barColor,
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSpecial,
  };
};

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const { effectiveTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const googleBtnContainerRef = useRef(null);
  const tokenClientRef = useRef(null);
  const isGoogleIdInitializedRef = useRef(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Real-time password strength calculation
  const pwdStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  // Handle detailed auth errors with actionable messages
  const handleAuthError = (err) => {
    console.error('Authentication Error:', err);
    if (err.response?.data?.message) {
      setError(err.response.data.message);
    } else if (err.code === 'ERR_NETWORK' || !err.response) {
      setError('Unable to connect to backend server. Please check your network connection or server status.');
    } else if (err.message) {
      setError(err.message);
    } else {
      setError('Google sign-in failed. Please try again.');
    }
  };

  // Handle Google Token Response from background Google Sign-In button
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

  const handleCredentialResponseRef = useRef(handleGoogleCredentialResponse);
  useEffect(() => {
    handleCredentialResponseRef.current = handleGoogleCredentialResponse;
  });

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

      // 2. Initialize Identity Services (ID Token / One Tap in background)
      if (window.google?.accounts?.id) {
        try {
          if (!isGoogleIdInitializedRef.current) {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: (res) => handleCredentialResponseRef.current?.(res),
              auto_select: false,
              use_fedcm_for_prompt: false,
            });
            isGoogleIdInitializedRef.current = true;
          }

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

  // Google button click handler (uses OAuth2 token client popup)
  const handleGoogleClick = () => {
    setError('');
    if (!googleClientId) {
      setError('Google Sign-In is not currently available. Please sign in with email.');
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

    // Fallback: trigger click on background rendered Google button if present
    const renderedBtn = googleBtnContainerRef.current?.querySelector('div[role="button"]');
    if (renderedBtn) {
      renderedBtn.click();
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Sign-In service is initializing. Please wait a moment.');
    }
  };

  // Email/Password Submit with Client-side validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Strong password confirmation on registration
    if (!isLogin) {
      if (!pwdStrength.hasMinLength) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (pwdStrength.score < 3) {
        setError('Please create a stronger password (must include uppercase, numbers, and symbols).');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-bg relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-surface border border-theme rounded-3xl p-6 sm:p-8 card-shadow relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-accent text-white flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            {isLogin ? t('auth.welcomeBack') : t('auth.signUpTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1 font-medium">
            {isLogin ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
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
            {t('common.signIn')}
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
            {t('auth.registerBtn')}
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
          {/* Primary High-Visibility "Continue with Google" Button */}
          <button
            type="button"
            id="google-auth-button"
            onClick={handleGoogleClick}
            disabled={googleLoading}
            aria-label={t('auth.googleSignIn')}
            className="w-full h-12 flex items-center justify-center gap-3.5 px-5 rounded-2xl bg-surface hover:bg-subtle active:scale-[0.99] border-2 border-theme hover:border-indigo-500/50 dark:hover:border-indigo-400/50 text-primary font-semibold text-sm sm:text-base transition-all duration-200 card-shadow hover:shadow-md hover:shadow-indigo-500/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {/* Ambient hover glow gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.04] via-purple-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <div className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                <GoogleIcon />
              </div>
            )}

            <span className="font-semibold tracking-tight text-primary">
              {googleLoading
                ? 'Connecting to Google...'
                : t('auth.googleSignIn')}
            </span>
          </button>

          {/* Hidden GSI container for background service initialization */}
          <div
            ref={googleBtnContainerRef}
            aria-hidden="true"
            className="hidden"
          />
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
                {t('auth.name')}
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
              {t('auth.email')}
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
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
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

            {/* Client-side Smooth Password Strength Validation (on Create Account tab) */}
            {!isLogin && (password.length > 0 || isPasswordFocused) && (
              <div className="mt-2.5 p-3 rounded-xl bg-subtle border border-theme space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-secondary">Password Strength:</span>
                  <span className={`font-bold transition-colors duration-200 ${pwdStrength.textColor}`}>
                    {pwdStrength.label}
                  </span>
                </div>

                {/* 4-Segment Animated Progress Bar */}
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full rounded-full transition-all duration-300 ${pwdStrength.score >= step ? pwdStrength.barColor : 'bg-surface border border-theme/40'
                        }`}
                    />
                  ))}
                </div>

                {/* Validation Criteria Checkpoints */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-150 ${pwdStrength.hasMinLength ? 'text-emerald-500 font-medium' : 'text-secondary'
                      }`}
                  >
                    <Check className={`w-3 h-3 ${pwdStrength.hasMinLength ? 'text-emerald-500 stroke-[3]' : 'opacity-30'}`} />
                    <span>8+ characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-150 ${pwdStrength.hasUppercase ? 'text-emerald-500 font-medium' : 'text-secondary'
                      }`}
                  >
                    <Check className={`w-3 h-3 ${pwdStrength.hasUppercase ? 'text-emerald-500 stroke-[3]' : 'opacity-30'}`} />
                    <span>Uppercase (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-150 ${pwdStrength.hasNumber ? 'text-emerald-500 font-medium' : 'text-secondary'
                      }`}
                  >
                    <Check className={`w-3 h-3 ${pwdStrength.hasNumber ? 'text-emerald-500 stroke-[3]' : 'opacity-30'}`} />
                    <span>Number (0-9)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors duration-150 ${pwdStrength.hasSpecial ? 'text-emerald-500 font-medium' : 'text-secondary'
                      }`}
                  >
                    <Check className={`w-3 h-3 ${pwdStrength.hasSpecial ? 'text-emerald-500 stroke-[3]' : 'opacity-30'}`} />
                    <span>Special symbol (!@#)</span>
                  </div>
                </div>
              </div>
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
              {isLogin ? t('auth.loginBtn') : t('auth.registerBtn')}
            </Button>
          </div>
        </form>


      </div>
    </div>
  );
};

export default Auth;
