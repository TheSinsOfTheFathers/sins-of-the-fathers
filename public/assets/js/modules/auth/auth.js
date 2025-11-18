import { auth, googleProvider, RECAPTCHA_SITE_KEY, functions } from '../firebase-config.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { db } from '../firebase-config.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

function showMessage(target, msg, type = 'info') {
  if (!target) return;
  target.textContent = msg;
  target.className = `auth-message ${type}`;
}

function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.right = '16px';
    container.style.top = '16px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    document.body.appendChild(container);
  }
  return container;
}

function showPopup(type, message, {timeout = 6000} = {}) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.minWidth = '240px';
  toast.style.maxWidth = '360px';
  toast.style.padding = '10px 12px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
  toast.style.color = '#fff';
  toast.style.fontSize = '14px';
  toast.style.display = 'flex';
  toast.style.justifyContent = 'space-between';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  if (type === 'error') toast.style.background = '#ef4444';
  else if (type === 'success') toast.style.background = '#10b981';
  else toast.style.background = '#111827';

  const text = document.createElement('div');
  text.textContent = message;
  text.style.flex = '1';
  toast.appendChild(text);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'rgba(255,255,255,0.9)';
  closeBtn.style.fontSize = '18px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.padding = '0 4px';
  closeBtn.addEventListener('click', () => {
    if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
  });
  toast.appendChild(closeBtn);

  container.appendChild(toast);
  if (timeout > 0) setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, timeout);
  return toast;
}

function firebaseErrorToMessage(err) {
  if (!err) return 'Unknown error.';
  const code = err.code || '';
  switch (code) {
    case 'auth/email-already-in-use': return 'This email address is already in use.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/invalid-credential': return 'Invalid credentials.';
    case 'auth/weak-password': return 'Password is too weak. Must be at least 6 characters.';
    case 'auth/user-not-found': return 'User not found.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/popup-closed-by-user': return 'Google sign-in window was closed.';
    case 'auth/popup-blocked': return "Please allow popups in your browser to use Google sign-in.";
    case 'auth/network-request-failed': return 'Network error. Check your internet connection.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    case 'auth/unauthorized-domain': return 'This app is not authorized to use Firebase Authentication on this domain.';
    default:
      return err.message || 'An unexpected error occurred.';
  }
}


let recaptchaReadyPromise = new Promise(resolve => {
  window.onRecaptchaLoad = () => {
    console.log("reCAPTCHA script loaded and ready.");
    resolve();
  };
});

async function getRecaptchaToken(action = 'auth') {
  if (!RECAPTCHA_SITE_KEY) {
    console.warn("reCAPTCHA site key is not configured.");
    return null;
  }

  try {
    await recaptchaReadyPromise;
    
    if (typeof window.grecaptcha.ready !== 'function') {
      throw new Error("window.grecaptcha.ready is not a function");
    }

    const token = await new Promise((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const t = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
          resolve(t);
        } catch (executeError) {
          console.error('grecaptcha.execute error:', executeError);
          resolve(null);
        }
      });
    });
        
    return token;
  } catch (e) {
    console.error('reCAPTCHA execution error:', e);
    return null;
  }
}

export function initAuth() {
  const registerForm = document.getElementById('auth-register-form');
  const loginForm = document.getElementById('auth-login-form');
  const googleBtn = document.getElementById('google-signin-btn');
  const googleBtnRegister = document.getElementById('google-signin-btn-register');
  const authControls = document.getElementById('auth-controls');
  const signinLink = document.getElementById('auth-signin-link');
  const authMessage = document.getElementById('auth-message');

  const title = document.getElementById('form-title');
  const switchLogin = document.getElementById('switch-to-login');
  const switchRegister = document.getElementById('switch-to-register');

  if (loginForm && registerForm && title && switchLogin && switchRegister) {
    const switchTo = (isRegister) => {
      if (isRegister) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        title.textContent = "Create Account";
      } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        title.textContent = "Sign In";
      }
    };

    switchRegister.addEventListener('click', (e) => {
      e.preventDefault();
      switchTo(true);
    });
    switchLogin.addEventListener('click', (e) => {
      e.preventDefault();
      switchTo(false);
    });

    if (window.location.hash === '#register') {
      switchTo(true);
    }
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = registerForm.querySelector('input[name="email"]').value.trim();
      const password = registerForm.querySelector('input[name="password"]').value.trim();
      showMessage(authMessage, 'Creating account...', 'info');
      try {
        const signupToken = await getRecaptchaToken('signup');
        if (RECAPTCHA_SITE_KEY && !signupToken) {
          showPopup('error', 'reCAPTCHA verification failed. Please try again.');
          return;
        }
        
        const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
        await verifyRecaptchaToken({ 
          token: signupToken,
          action: 'signup'
        });

        console.debug('reCAPTCHA token (signup) verified by cloud function');
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await setDoc(doc(db, 'users', userCred.user.uid), {
            email: email,
            provider: 'password',
            createdAt: serverTimestamp(),
          });
        } catch (writeErr) {
          console.error('Failed to write user profile to Firestore', writeErr);
        }

        showMessage(authMessage, 'Account created. Redirecting…', 'success');
        setTimeout(() => window.location.assign('profile.html'), 800);
      } catch (err) {
        showPopup('error', firebaseErrorToMessage(err));
        console.error('Sign up error', err);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const password = loginForm.querySelector('input[name="password"]').value.trim();
      showMessage(authMessage, 'Signing in…', 'info');
      try {
        const loginToken = await getRecaptchaToken('login');
        if (RECAPTCHA_SITE_KEY && !loginToken) {
          showPopup('error', 'reCAPTCHA verification failed. Please try again.');
          return;
        }

        const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
        await verifyRecaptchaToken({ 
          token: loginToken,
          action: 'login'
        });

        console.debug('reCAPTCHA token (login) verified by cloud function');
        await signInWithEmailAndPassword(auth, email, password);
        showMessage(authMessage, 'Signed in. Redirecting…', 'success');
        setTimeout(() => window.location.assign('../index.html'), 600);
      } catch (err) {
        showPopup('error', firebaseErrorToMessage(err));
        console.error('Sign in error', err);
      }
    });
  }

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    showMessage(authMessage, 'Signing in with Google…', 'info');
    try {
      const googleToken = await getRecaptchaToken('google_signin');
      if (RECAPTCHA_SITE_KEY && !googleToken) {
        showPopup('error', 'reCAPTCHA verification failed. Please try again.');
        return;
      }

      const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
      await verifyRecaptchaToken({ 
        token: googleToken,
        action: 'google_signin'
      });

      console.debug('reCAPTCHA token (google) verified by cloud function');
      const result = await signInWithPopup(auth, googleProvider);
      try {
        const u = result.user;
        await setDoc(doc(db, 'users', u.uid), {
          email: u.email,
          displayName: u.displayName || null,
          photoURL: u.photoURL || null,
          provider: 'google',
          lastLogin: serverTimestamp(),
        }, { merge: true });
      } catch (writeErr) {
        console.error('Failed to write Google user profile to Firestore', writeErr);
      }

      showMessage(authMessage, 'Signed in with Google. Redirecting…', 'success');
      setTimeout(() => window.location.assign('../index.html'), 600);
    } catch (err) {
      showPopup('error', firebaseErrorToMessage(err));
      console.error('Google sign-in error', err);
    }
  };

  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleSignIn);
  }
  if (googleBtnRegister) {
    googleBtnRegister.addEventListener('click', handleGoogleSignIn);
  }


  document.addEventListener('click', (ev) => {
    const target = ev.target;
    if (target && target.classList && target.classList.contains('user-menu-signout')) {
      ev.preventDefault();
      (async () => {
        try {
          await signOut(auth);
          if (authMessage) showMessage(authMessage, 'Signed out', 'info');
          setTimeout(() => window.location.reload(), 300);
        } catch (err) {
          if (authMessage) showPopup('error', 'Sign out failed. Please try again.');
          console.error('Sign out (menu) error', err);
        }
      })();
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (signinLink) signinLink.style.display = 'none';
      ensureUserMenu(user);
    } else {
      if (signinLink) signinLink.style.display = '';
      const existing = document.getElementById('user-menu');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }
  });


  function ensureUserMenu(user) {
    const controls = document.getElementById('auth-controls');
    if (!controls) return;

    let menu = document.getElementById('user-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'user-menu';
      menu.className = 'user-menu';
      menu.style.position = 'relative';
      menu.innerHTML = `
        <button class="user-menu-button" aria-haspopup="true" aria-expanded="false">
          <img class="user-avatar hidden" alt="avatar" />
        </button>
        <div class="user-menu-dropdown hidden" role="menu">
          <a href="./profile.html" class="block px-4 py-2 hover:bg-neutral-800">Profile</a>
          <a href="#" class="block px-4 py-2 hover:bg-neutral-800 user-menu-signout">Sign out</a>
        </div>
      `;
      const avatarImg = menu.querySelector('img.user-avatar');
      if (avatarImg && user.photoURL) {
        avatarImg.src = user.photoURL;
        avatarImg.classList.remove('hidden');
      }
      controls.appendChild(menu);

      const btn = menu.querySelector('.user-menu-button');
      const dd = menu.querySelector('.user-menu-dropdown');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const open = !dd.classList.contains('hidden');
        dd.classList.toggle('hidden', open);
        btn.setAttribute('aria-expanded', String(!open));
      });
      document.addEventListener('click', (ev) => {
        if (!menu.contains(ev.target)) {
          dd.classList.add('hidden');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    } else {
      const img = menu.querySelector('img.user-avatar');
      if (img && user.photoURL) {
        img.src = user.photoURL;
        img.classList.remove('hidden');
      }
    }
  }
}

export default initAuth;