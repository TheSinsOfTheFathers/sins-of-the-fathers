import { auth, googleProvider, RECAPTCHA_SITE_KEY, functions, db } from '../firebase-config.js';
import { httpsCallable } from 'firebase/functions';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'; // Updated imports
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import i18next from '../../lib/i18n.js';

/* --------------------------------------------------------------------------
   NOIR UI HELPERS (Terminal Style Messages)
   -------------------------------------------------------------------------- */
function showMessage(target, msg, type = 'info') {
  if (!target) return;
  target.textContent = `> ${msg}`;
  if (type === 'error') target.className = 'text-red-500 font-mono text-xs animate-pulse';
  else if (type === 'success') target.className = 'text-gold font-mono text-xs';
  else target.className = 'text-gray-200 font-mono text-xs';
}

function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed', right: '20px', bottom: '20px', zIndex: '9999',
      display: 'flex', flexDirection: 'column', gap: '10px'
    });
    document.body.appendChild(container);
  }
  return container;
}

function showPopup(type, message, { timeout = 5000 } = {}) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');

  const isError = type === 'error';
  const borderColor = isError ? '#4a0404' : '#c5a059';
  const textColor = isError ? '#ff5555' : '#c5a059';
  const icon = isError ? '⚠ ERROR:' : '✓ SYSTEM:';

  Object.assign(toast.style, {
    minWidth: '280px', maxWidth: '400px', padding: '15px',
    background: '#050505',
    borderLeft: `3px solid ${borderColor}`,
    borderTop: '1px solid #222', borderRight: '1px solid #222', borderBottom: '1px solid #222',
    boxShadow: '0 10px 30px rgba(0,0,0,0.9)',
    color: '#ccc', fontFamily: "'Courier Prime', monospace", fontSize: '12px',
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    opacity: '0', transform: 'translateY(20px)', transition: 'all 0.3s ease'
  });

  toast.innerHTML = `
    <span style="color:${textColor}; font-weight:bold; white-space:nowrap;">${icon}</span>
    <span style="line-height:1.4;">${message}</span>
  `;

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  container.appendChild(toast);

  if (timeout > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, timeout);
  }
  return toast;
}

function firebaseErrorToMessage(err) {
  if (!err) return 'Unknown system failure.';
  const code = err.code || '';
  switch (code) {
    case 'auth/email-already-in-use': return 'Identity already exists in the database.';
    case 'auth/invalid-email': return 'Invalid communication frequency (Email).';
    case 'auth/invalid-credential': return 'Access Denied: Credentials rejected.';
    case 'auth/weak-password': return 'Security Alert: Key is too weak (Min 6 chars).';
    case 'auth/user-not-found': return 'Operative not found in archives.';
    case 'auth/wrong-password': return 'Encryption key mismatch (Wrong Password).';
    default:
      return err.message || 'System malfunction.';
  }
}

/* --------------------------------------------------------------------------
   RECAPTCHA LOGIC
   -------------------------------------------------------------------------- */
let recaptchaReadyPromise = new Promise(resolve => {
  if (globalThis.grecaptcha && globalThis.grecaptcha.execute) {
    resolve();
  } else {
    const checkInterval = setInterval(() => {
      if (globalThis.grecaptcha && globalThis.grecaptcha.execute) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 500);
  }
});

async function getRecaptchaToken(action = 'auth') {
  if (!RECAPTCHA_SITE_KEY) return null;
  try {
    await recaptchaReadyPromise;
    const token = await globalThis.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    return token;
  } catch (e) {
    console.error('Bot detection failed:', e);
    return null;
  }
}

/* --------------------------------------------------------------------------
   MAIN AUTH INIT
   -------------------------------------------------------------------------- */
export function initAuth() {
  const registerForm = document.getElementById('auth-register-form');
  const loginForm = document.getElementById('auth-login-form');
  const googleBtn = document.getElementById('google-signin-btn');
  const googleBtnRegister = document.getElementById('google-signin-btn-register');
  const authMessage = document.getElementById('auth-message');
  const switchLogin = document.getElementById('switch-to-login');
  const switchRegister = document.getElementById('switch-to-register');

  // --- NEW: Enforce Local Storage Persistence ---
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log(" > Auth: Persistence set to LOCAL (localStorage).");
    })
    .catch((error) => {
      console.error(" ! Auth: Failed to set persistence:", error);
    });

  // --- NEW: Handle Redirect Result (Only checks on Production or if forced) ---
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) {
    console.log(" > Auth: Checking for redirect result (Prod)...");
    getRedirectResult(auth)
      .then(async (result) => {
        console.log(" > Auth: Redirect Result Payload:", result);
        if (result) {
          // User returned from Google
          showMessage(authMessage, 'Biometrics confirmed. Processing...', 'info');
          const u = result.user;

          try {
            await setDoc(doc(db, 'users', u.uid), {
              email: u.email,
              displayName: u.displayName || null,
              photoURL: u.photoURL || null,
              provider: 'google',
              lastLogin: serverTimestamp(),
            }, { merge: true });

            showMessage(authMessage, 'Access Granted.', 'success');
            setTimeout(() => globalThis.location.href = '/', 800);
          } catch (err) {

            showPopup('error', firebaseErrorToMessage(err));
            showMessage(authMessage, 'Database Sync Failed.', 'error');
          }
        }
      })
      .catch((error) => {
        // Handle Errors here.
        console.error(" > Auth: Redirect Error Details:", error);
        showPopup('error', firebaseErrorToMessage(error));
        showMessage(authMessage, 'Authentication Interrupted.', 'error');
      });
  }

  if (loginForm && registerForm && switchLogin && switchRegister) {
    // ... (Existing switch logic) ...
    const switchTo = (isRegister) => {
      const title = document.querySelector('h1') || document.getElementById('form-title');
      if (isRegister) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        if (title) {
          title.innerHTML = i18next.t('login_page.dynamic_title_register');
          title.setAttribute('data-i18n', 'login_page.dynamic_title_register');
        }
      } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        if (title) {
          title.innerHTML = i18next.t('login_page.dynamic_title_login');
          title.setAttribute('data-i18n', 'login_page.dynamic_title_login');
        }
      }
    };

    switchRegister.addEventListener('click', (e) => { e.preventDefault(); switchTo(true); });
    switchLogin.addEventListener('click', (e) => { e.preventDefault(); switchTo(false); });
  }

  /* --- EMAIL / PASSWORD REGISTER --- */
  if (registerForm) {
    // ... (Existing register logic) ...
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = registerForm.querySelector('input[name="email"]').value.trim();
      const password = registerForm.querySelector('input[name="password"]').value.trim();

      showMessage(authMessage, 'Initiating vetting protocol...', 'info');

      try {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn('Localhost detected: Bypassing ReCAPTCHA.');
          showMessage(authMessage, 'Localhost: Bypassing Security...', 'info');
        } else {
          const signupToken = await getRecaptchaToken('signup');
          const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
          await verifyRecaptchaToken({ token: signupToken, action: 'signup' });
        }

        showMessage(authMessage, 'Creating dossier...', 'info');
        const userCred = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: email,
          provider: 'password',
          createdAt: serverTimestamp(),
          role: 'recruit',
          faction: 'undecided'
        }, { merge: true });

        showMessage(authMessage, 'Identity Verified. Redirecting...', 'success');
        setTimeout(() => globalThis.location.href = '/pages/profile.html', 1000);
      } catch (err) {
        showPopup('error', firebaseErrorToMessage(err));
        showMessage(authMessage, 'Registration Failed.', 'error');
      }
    });
  }

  /* --- EMAIL / PASSWORD LOGIN --- */
  if (loginForm) {
    // ... (Existing login logic) ...
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const password = loginForm.querySelector('input[name="password"]').value.trim();

      showMessage(authMessage, 'Decrypting credentials...', 'info');

      try {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn('Localhost detected: Bypassing ReCAPTCHA.');
          showMessage(authMessage, 'Localhost: Bypassing Security...', 'info');
        } else {
          const loginToken = await getRecaptchaToken('login');
          const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
          await verifyRecaptchaToken({ token: loginToken, action: 'login' });
        }

        showMessage(authMessage, 'Access Granted.', 'success');
        await signInWithEmailAndPassword(auth, email, password);
        setTimeout(() => globalThis.location.href = '/', 800);
      } catch (err) {
        showPopup('error', firebaseErrorToMessage(err));
        showMessage(authMessage, 'Access Denied.', 'error');
      }
    });
  }

  /* --- GOOGLE LOGIN (HYBRID: POPUP for Localhost / REDIRECT for Prod) --- */
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    showMessage(authMessage, 'Initiating secure channel...', 'info');

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    try {
      if (isLocal) {
        console.warn("Localhost: Using Popup Flow to avoid Redirect storage issues.");
        // POPUP FLOW (Localhost)
        const result = await signInWithPopup(auth, googleProvider);

        if (result) {
          showMessage(authMessage, 'Biometrics confirmed. Processing...', 'info');
          const u = result.user;
          await setDoc(doc(db, 'users', u.uid), {
            email: u.email,
            displayName: u.displayName || null,
            photoURL: u.photoURL || null,
            provider: 'google',
            lastLogin: serverTimestamp(),
          }, { merge: true });

          showMessage(authMessage, 'Access Granted.', 'success');
          setTimeout(() => globalThis.location.href = '/', 800);
        }
      } else {
        // REDIRECT FLOW (Production - Better for Mobile)
        const googleToken = await getRecaptchaToken('google_signin');
        const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
        await verifyRecaptchaToken({ token: googleToken, action: 'google_signin' });

        showMessage(authMessage, 'Redirecting to secure channel...', 'info');
        await signInWithRedirect(auth, googleProvider);
      }

    } catch (err) {
      console.error(err);
      showPopup('error', firebaseErrorToMessage(err));
      showMessage(authMessage, 'Connection Refused.', 'error');
    }
  };

  if (googleBtn) googleBtn.addEventListener('click', handleGoogleSignIn);
  if (googleBtnRegister) googleBtnRegister.addEventListener('click', handleGoogleSignIn);



  /* --------------------------------------------------------------------------
     HEADER MENU & AUTH STATE
     -------------------------------------------------------------------------- */
  onAuthStateChanged(auth, (user) => {
    console.log(" > Auth State Changed:", user ? user.email : "Logged Out"); // DEBUG

    const signinLink = document.getElementById('auth-signin-link');
    const guestLocks = document.querySelectorAll('.guest-only, .guest-lock');

    // Target the Lore/Classified link
    // We try multiple selectors to be robust
    const loreLinkFn = () => {
      const link = document.getElementById('nav-link-classified') || document.querySelector('a[href="./pages/lore.html"]');
      if (!link) {
        console.warn(" ! UI Warning: 'nav-link-classified' not found.");
        return;
      }
      const span = link.querySelector('span');
      if (!span) return;

      if (user) {
        span.textContent = "LORE";
        span.removeAttribute('data-i18n'); // Detach from translation system to force override
      } else {
        span.textContent = "CLASSIFIED";
        span.setAttribute('data-i18n', 'nav.classified');
      }
    };
    loreLinkFn();

    if (user) {
      if (signinLink) signinLink.style.display = 'none';
      else console.warn(" ! UI Warning: 'auth-signin-link' not found in DOM.");

      guestLocks.forEach(el => el.style.display = 'none');

      ensureUserMenu(user);

      document.querySelectorAll('.restricted-overlay').forEach(overlay => overlay.style.display = 'none');
      document.querySelectorAll('.restricted-content').forEach(content => content.classList.remove('restricted-content-blur'));

    } else {
      if (signinLink) signinLink.style.display = 'flex';

      guestLocks.forEach(el => el.style.display = 'flex');

      const existing = document.getElementById('user-menu');
      if (existing) existing.remove();

      document.querySelectorAll('.restricted-overlay').forEach(overlay => overlay.style.display = 'flex');
      document.querySelectorAll('.restricted-content').forEach(content => content.classList.add('restricted-content-blur'));
    }
  });

  function ensureUserMenu(user) {
    console.log(" > Building User Menu for:", user.email); // DEBUG
    const controls = document.getElementById('auth-controls');

    if (!controls) {
      console.error(" ! Critical: 'auth-controls' container not found. Cannot build menu.");
      return;
    }

    if (document.getElementById('user-menu')) {
      console.log(" > User Menu already exists.");
      return;
    }

    const menu = document.createElement('div');
    menu.id = 'user-menu';
    menu.className = 'relative ml-6';

    const avatarSrc = user.photoURL
      ? user.photoURL
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=c5a059&color=000`;

    menu.innerHTML = `
      <button id="user-menu-btn" class="flex items-center gap-2 group focus:outline-none">
           <span class="hidden md:block text-[10px] font-mono text-gray-400 group-hover:text-gold tracking-widest uppercase">
             ${i18next.t('agent_display', { name: user.displayName ? user.displayName.split(' ')[0] : 'Unknown' })}
           </span>
           <img class="w-8 h-8 rounded-sm object-cover border border-gray-700 group-hover:border-gold transition-colors" src="${avatarSrc}" alt="ID" />
      </button>

      <div id="user-dropdown" class="hidden absolute right-0 mt-4 w-56 bg-obsidian border border-gold/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] z-50 backdrop-blur-xl">
           <div class="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-gold opacity-50"></div>
           <div class="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-gold opacity-50"></div>
           
           <div class="px-4 py-3 border-b border-white/5">
                <p class="text-[10px] text-gray-200 font-mono uppercase tracking-widest">Current Identity</p>
                <p class="text-xs text-gold truncate font-mono">${user.email}</p>
           </div>
           
           <div class="py-1">
             <a href="/pages/profile.html" class="block px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white font-serif uppercase tracking-wide transition-colors">
                 <i class="fas fa-id-card mr-2 text-gold/70"></i> Access File
             </a>
           </div>

           <div class="border-t border-white/10">
             <button id="menu-signout-btn" class="w-full text-left px-4 py-3 text-xs text-red-800 hover:text-red-500 hover:bg-red-900/10 font-mono uppercase tracking-widest transition-colors">
                 <i class="fas fa-power-off mr-2"></i> Disconnect
             </button>
           </div>
      </div>
    `;

    controls.appendChild(menu);

    const btn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    const signoutBtn = document.getElementById('menu-signout-btn');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });

    signoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        globalThis.location.href = '/';
      }
      catch (err) { console.error(err); }
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) dropdown.classList.add('hidden');
    });
  }
}

export default initAuth;