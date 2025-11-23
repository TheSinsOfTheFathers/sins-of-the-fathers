import { auth, googleProvider, RECAPTCHA_SITE_KEY, functions } from '../firebase-config.js'; // Yolun doğru olduğundan emin olun
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

/* --------------------------------------------------------------------------
   UI HELPERS (Toast & Messages)
   -------------------------------------------------------------------------- */
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
    Object.assign(container.style, {
      position: 'fixed', right: '16px', top: '16px', zIndex: '9999',
      display: 'flex', flexDirection: 'column', gap: '8px'
    });
    document.body.appendChild(container);
  }
  return container;
}

function showPopup(type, message, {timeout = 6000} = {}) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Basit inline stil (Tailwind/CSS ile de yönetilebilir ama JS bağımsızlığı için iyi)
  Object.assign(toast.style, {
      minWidth: '240px', maxWidth: '360px', padding: '12px', borderRadius: '8px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.2)', color: '#fff', fontSize: '14px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
      background: type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#171717'),
      border: '1px solid #333'
  });

  const text = document.createElement('div');
  text.textContent = message;
  text.style.flex = '1';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  Object.assign(closeBtn.style, {
    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)',
    fontSize: '20px', cursor: 'pointer', padding: '0 4px', lineHeight: '1'
  });
  
  closeBtn.addEventListener('click', () => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  });
  
  toast.append(text, closeBtn);
  container.appendChild(toast);

  if (timeout > 0) {
      setTimeout(() => { 
          if (toast.parentNode) toast.parentNode.removeChild(toast); 
      }, timeout);
  }
  return toast;
}

function firebaseErrorToMessage(err) {
  if (!err) return 'Unknown error.';
  // Hata kodlarını temizle
  const code = err.code || '';
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/invalid-credential': return 'Invalid credentials.';
    case 'auth/weak-password': return 'The password is too weak. It should be at least 6 characters long.';
    case 'auth/user-not-found': return 'User not found.';
    case 'auth/wrong-password': return 'Wrong password.';
    case 'auth/popup-closed-by-user': return 'Sign in with Google popup closed by user.';
    case 'auth/popup-blocked': return "Browser blocked the Google sign-in popup. Please allow popups and try again.";
    case 'auth/network-request-failed': return 'Network request failed. Please check your internet connection and try again';
    case 'functions/permission-denied': return 'Security check failed. Please try again.';
    default:
      return err.message || 'An unknown error occurred.';
  }
}

/* --------------------------------------------------------------------------
   RECAPTCHA LOGIC
   -------------------------------------------------------------------------- */
let recaptchaReadyPromise = new Promise(resolve => {
  // Eğer grecaptcha zaten yüklüyse bekleme
  if (window.grecaptcha && window.grecaptcha.execute) {
    resolve();
  } else {
    // Script'in onload callback'i bekleniyor (HTML tarafında tanımlı olmalı veya buraya eklenmeli)
    const checkInterval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.execute) {
            clearInterval(checkInterval);
            resolve();
        }
    }, 500);
  }
});

async function getRecaptchaToken(action = 'auth') {
  if (!RECAPTCHA_SITE_KEY) {
    console.warn("Security Warning: reCAPTCHA site key missing.");
    return null;
  }
  try {
    await recaptchaReadyPromise;
    const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    return token;
  } catch (e) {
    console.error('reCAPTCHA execution error:', e);
    return null;
  }
}

/* --------------------------------------------------------------------------
   MAIN AUTH INIT
   -------------------------------------------------------------------------- */
export function initAuth() {
  // Elements
  const registerForm = document.getElementById('auth-register-form');
  const loginForm = document.getElementById('auth-login-form');
  const googleBtn = document.getElementById('google-signin-btn');
  const googleBtnRegister = document.getElementById('google-signin-btn-register'); // Kayıt formundaki Google butonu
  const authMessage = document.getElementById('auth-message');
  
  // Switcher
  const title = document.getElementById('form-title');
  const switchLogin = document.getElementById('switch-to-login');
  const switchRegister = document.getElementById('switch-to-register');

  // Toggle Login/Register UI
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
      // Hash güncelle (isteğe bağlı)
      if(history.replaceState) history.replaceState(null, null, isRegister ? '#register' : '#login');
    };

    switchRegister.addEventListener('click', (e) => { e.preventDefault(); switchTo(true); });
    switchLogin.addEventListener('click', (e) => { e.preventDefault(); switchTo(false); });

    if (window.location.hash === '#register') { switchTo(true); }
  }

  /* --- EMAIL / PASSWORD REGISTER --- */
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = registerForm.querySelector('input[name="email"]').value.trim();
      const password = registerForm.querySelector('input[name="password"]').value.trim();
      
      showMessage(authMessage, 'Bot check up is in progress...', 'info');

      try {
        // 1. Gatekeeper Check (Cloud Function)
        const signupToken = await getRecaptchaToken('signup');
        const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
        await verifyRecaptchaToken({ token: signupToken, action: 'signup' });

        // 2. Firebase Auth
        showMessage(authMessage, 'Account is creating...', 'info');
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // 3. Firestore Profile
        await setDoc(doc(db, 'users', userCred.user.uid), {
            email: email,
            provider: 'password',
            createdAt: serverTimestamp(),
            role: 'recruit' // Default role
        });

        showMessage(authMessage, 'Account created, you are being redirected...', 'success');
        setTimeout(() => window.location.assign('/profile.html'), 800); // DİKKAT: Absolute path
      } catch (err) {
        showPopup('error', firebaseErrorToMessage(err));
        console.error('Sign up error', err);
      }
    });
  }

  /* --- EMAIL / PASSWORD LOGIN --- */
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const password = loginForm.querySelector('input[name="password"]').value.trim();

      showMessage(authMessage, 'Security Check...', 'info');

      try {
        const loginToken = await getRecaptchaToken('login');
        const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
        await verifyRecaptchaToken({ token: loginToken, action: 'login' });

        showMessage(authMessage, 'Logging in...', 'info');
        await signInWithEmailAndPassword(auth, email, password);
        
        showMessage(authMessage, 'Login successful.', 'success');
        // Eğer admin/editör ise dashboarda yönlendir, yoksa anasayfa
        setTimeout(() => window.location.assign('../../../../index.html'), 600); 
      } catch (err) {
        showPopup('error', firebaseErrorToMessage(err));
        console.error('Sign in error', err);
      }
    });
  }

  /* --- GOOGLE LOGIN --- */
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    showMessage(authMessage, 'Google ile bağlanılıyor...', 'info');
    
    try {
        const googleToken = await getRecaptchaToken('google_signin');
        const verifyRecaptchaToken = httpsCallable(functions, 'verifyRecaptchaToken');
        await verifyRecaptchaToken({ token: googleToken, action: 'google_signin' });

        const result = await signInWithPopup(auth, googleProvider);
        const u = result.user;

        // Merge seçeneği ile, varsa eski veriyi koru, yoksa yaz.
        await setDoc(doc(db, 'users', u.uid), {
            email: u.email,
            displayName: u.displayName || null,
            photoURL: u.photoURL || null,
            provider: 'google',
            lastLogin: serverTimestamp(),
        }, { merge: true });

        showMessage(authMessage, 'Signed in with Google.', 'success');
        setTimeout(() => window.location.assign('../../../../index.html'), 600);
    } catch (err) {
      showPopup('error', firebaseErrorToMessage(err));
      console.error('Google sign-in error', err);
    }
  };

  if (googleBtn) googleBtn.addEventListener('click', handleGoogleSignIn);
  if (googleBtnRegister) googleBtnRegister.addEventListener('click', handleGoogleSignIn);


  /* --- AUTH STATE LISTENER & USER MENU --- */
  onAuthStateChanged(auth, (user) => {
    const signinLinks = document.querySelectorAll('#auth-signin-link, .guest-only');
    if (user) {
      // Login butonlarını gizle
      signinLinks.forEach(el => el.style.display = 'none');
      // Menüyü oluştur
      ensureUserMenu(user);
    } else {
      // Login butonlarını göster
      signinLinks.forEach(el => el.style.display = 'flex'); // Veya block/inline-flex
      // Menüyü kaldır
      const existing = document.getElementById('user-menu');
      if (existing) existing.remove();
    }
  });

  /* --- HEADER USER MENU GENERATOR --- */
  function ensureUserMenu(user) {
    const controls = document.getElementById('auth-controls'); // Header'daki container
    if (!controls) return;

    let menu = document.getElementById('user-menu');
    
    // Menü henüz yoksa DOM'a ekle
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'user-menu';
      menu.className = 'user-menu relative inline-block ml-4'; // Tailwind + custom mix
      
      // Profil resmi varsa kullan, yoksa harf avatar
      const avatarSrc = user.photoURL 
        ? user.photoURL 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=f59e0b&color=000`;

      menu.innerHTML = `
        <button class="user-menu-button transition-all duration-300 focus:outline-none border-2 border-transparent hover:border-yellow-500 rounded-full">
           <img class="w-auto h-auto rounded-full object-cover shadow-md" src="${avatarSrc}" alt="User Profile" />
        </button>
        <div class="user-menu-dropdown hidden absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-md shadow-xl overflow-hidden z-50">
          <div class="px-4 py-3 border-b border-neutral-700 text-sm">
             <p class="text-neutral-400 truncate">${user.email}</p>
          </div>
          <a href="./profile.html" class="block px-4 py-2 text-sm text-gray-200 hover:bg-neutral-800 hover:text-yellow-500 transition-colors">Profile Settings</a>
          <a href="#" class="user-menu-signout block px-4 py-2 text-sm text-gray-200 hover:bg-red-900/30 hover:text-red-400 transition-colors">Log Out</a>
        </div>
      `;
      controls.appendChild(menu);

      // Dropdown Toggle Logic
      const btn = menu.querySelector('.user-menu-button');
      const dd = menu.querySelector('.user-menu-dropdown');
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dd.classList.toggle('hidden');
      });

      // Çıkış Yap Logic (Event Delegation burada tanımlı olmalı çünkü buton dinamik yaratıldı)
      const signoutBtn = menu.querySelector('.user-menu-signout');
      signoutBtn.addEventListener('click', async (ev) => {
          ev.preventDefault();
          try { 
             await signOut(auth);
             // Ana sayfaya at
             window.location.assign('../../../../index.html');
          } catch (err) {
             console.error("Logout failed", err);
          }
      });

      // Menü dışına tıklayınca kapat
      document.addEventListener('click', (ev) => {
        if (!menu.contains(ev.target)) dd.classList.add('hidden');
      });

    } else {
      // Menü varsa ve resim değiştiyse (profile update sonrası)
      // Basitlik adına burası boş bırakılabilir, sayfa yenilenince düzelir.
    }
  }
}

export default initAuth;