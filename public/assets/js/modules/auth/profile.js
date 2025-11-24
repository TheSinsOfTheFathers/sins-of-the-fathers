import { auth, db, storage } from '../firebase-config.js';
import { onAuthStateChanged, updateProfile, deleteUser } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

/* --------------------------------------------------------------------------
   HELPER: Visual Feedback (Noir Style)
   -------------------------------------------------------------------------- */
function updateButtonStatus(btn, text, status = 'default') {
    btn.innerText = text;
    if (status === 'loading') {
        btn.classList.add('opacity-70', 'cursor-wait');
    } else if (status === 'success') {
        btn.classList.remove('bg-gold', 'text-black');
        btn.classList.add('bg-green-600', 'text-white');
        setTimeout(() => {
            btn.innerText = 'UPDATE RECORDS'; // Original Text
            btn.classList.remove('bg-green-600', 'text-white');
            btn.classList.add('bg-gold', 'text-black');
        }, 3000);
    } else if (status === 'error') {
        btn.classList.add('bg-red-900', 'text-white');
        setTimeout(() => {
            btn.innerText = 'UPDATE RECORDS';
            btn.classList.remove('bg-red-900', 'text-white');
        }, 3000);
    }
}

export async function loadProfilePage() {
  // 1. HTML Elementlerini Seç
  const container = document.getElementById('profile-content');
  const loader = document.getElementById('profile-loader');
  
  // Form Inputları
  const nameInput = document.getElementById('display-name');
  const emailInput = document.getElementById('user-email');
  const bioInput = document.querySelector('textarea'); // ID vermediysen querySelector
  const factionInputs = document.querySelectorAll('input[name="faction"]');
  const form = document.getElementById('profile-form');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  
  // ID Kartı Elemanları
  const idCardImage = document.getElementById('profile-image-preview');
  const fileInput = document.getElementById('profile-photo-input');
  const burnIdentityBtn = document.querySelector('#auth-signout-btn'); // Headerdaki Terminate butonu ile karismasin, sayfa ici butona ozel class verilmeli

  if (!container) return; // Profil sayfasında değiliz

  // 2. Auth State Listener
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Login sayfasına at (Root path relative)
      window.location.href = '/pages/login.html?redirect=profile';
      return;
    }

    console.log(`> Accessing File: ${user.uid}`);

    // 3. Firestore Verisini Çek
    const userDocRef = doc(db, 'users', user.uid);
    let userData = {};
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) userData = snap.data();
    } catch (err) {
      console.error('Failed to decrypt user profile', err);
    }

    // 4. UI Doldur (Enjection)
    // a. Email & İsim
    if(emailInput) emailInput.value = user.email;
    if(nameInput) nameInput.value = user.displayName || userData.displayName || '';
    
    // b. Bio (Varsa)
    if(bioInput && userData.bio) bioInput.value = userData.bio;

    // c. Fotoğraf (ID Kartı)
    const currentPhoto = user.photoURL || userData.photoURL;
    if (currentPhoto && idCardImage) {
        idCardImage.src = currentPhoto;
    }

    // d. Faction (Radio Buttons)
    if (userData.faction) {
        factionInputs.forEach(radio => {
            if (radio.value === userData.faction) radio.checked = true;
        });
    }

    // 5. Yükleme Ekranını Kaldır (Transition)
    if (loader) {
        setTimeout(() => {
            loader.classList.add('opacity-0', 'pointer-events-none'); // Fade out
            container.classList.remove('opacity-0'); // Fade in content
        }, 600); // Biraz yapay gecikme "tarama" hissi için
    }

    /* --------------------------------------------------------------------------
       EVENT LISTENERS
       -------------------------------------------------------------------------- */

    // A. Dosya Önizleme (Henüz Upload Yok)
    if (fileInput && idCardImage) {
        fileInput.addEventListener('change', (ev) => {
            const f = ev.target.files && ev.target.files[0];
            if (!f) return;
            // Limit Size (Optional): 2MB
            if(f.size > 2 * 1024 * 1024) {
                alert("Image file too large. Compress data packet.");
                return;
            }
            const url = URL.createObjectURL(f);
            idCardImage.src = url; // Anlık gösterim
        });
    }

    // B. Form Gönderimi (Kayıt & Upload)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            updateButtonStatus(submitBtn, 'ENCRYPTING DATA...', 'loading');

            const newName = nameInput.value.trim();
            const newBio = bioInput ? bioInput.value.trim() : '';
            // Seçili Faksiyonu Bul
            let selectedFaction = null;
            factionInputs.forEach(r => { if(r.checked) selectedFaction = r.value; });

            const file = fileInput && fileInput.files[0];

            try {
                let photoURL = user.photoURL;

                // 1. Fotoğraf varsa yükle
                if (file) {
                    const sRef = storageRef(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
                    await uploadBytes(sRef, file);
                    photoURL = await getDownloadURL(sRef);
                }

                // 2. Auth Profilini Güncelle (Core Firebase)
                if (auth.currentUser) {
                     await updateProfile(auth.currentUser, { displayName: newName, photoURL });
                }

                // 3. Firestore Dökümanını Güncelle (Genişletilmiş Veri)
                await setDoc(userDocRef, {
                    displayName: newName,
                    photoURL: photoURL,
                    bio: newBio,
                    faction: selectedFaction || 'neutral',
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                // Success UI
                console.log('> Profile Updated Successfully');
                updateButtonStatus(submitBtn, 'ACCESS GRANTED', 'success');
                
                // Eğer headerda avatar varsa güncelle (Sayfa yenilenmeden)
                const headerAvatar = document.querySelector('#user-menu-btn img');
                if(headerAvatar && photoURL) headerAvatar.src = photoURL;

            } catch (err) {
                console.error('> Update Failed:', err);
                updateButtonStatus(submitBtn, 'UPLOAD FAILED', 'error');
            }
        });
    }

    // C. Hesabı Silme (Burn Identity) - ID kartın altındaki buton
    // Not: Profile.html'deki "Burn Identity" butonuna bir ID veya class verilmeli.
    // Örn HTML'de: <button id="burn-identity-btn" ...> ise:
    const burnBtn = document.querySelector('.lg\\:col-span-4 button'); // Basit secim veya ID ekleyin

    if (burnBtn && !burnBtn.hasAttribute('data-listening')) {
        burnBtn.setAttribute('data-listening', 'true'); // Prevent double binding
        burnBtn.addEventListener('click', async () => {
            if (confirm("WARNING: This action will permanently scrub your identity from the Ballantine Archives. This cannot be undone. Proceed?")) {
                try {
                    await deleteDoc(userDocRef); // Firestore verisini sil
                    await deleteUser(user); // Auth kullanıcısını sil
                    alert("Identity scorched. Redirecting...");
                    window.location.href = '/index.html';
                } catch (err) {
                    console.error(err);
                    alert("Error: Clearance insufficient. Re-login required.");
                }
            }
        });
    }

  });
}

export default loadProfilePage;