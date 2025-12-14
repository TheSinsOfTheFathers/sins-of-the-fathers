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
            btn.innerText = 'UPDATE RECORDS';
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

/**
 * Populates form fields with user data to reduce cognitive complexity
 */
function populateFormFields(user, userData, elements) {
    const { emailInput, nameInput, bioInput, factionInputs, idCardImage } = elements;

    if (emailInput) emailInput.value = user.email;
    if (nameInput) nameInput.value = user.displayName || userData.displayName || '';
    if (bioInput && userData.bio) bioInput.value = userData.bio;

    const currentPhoto = user.photoURL || userData.photoURL;
    if (currentPhoto && idCardImage) {
        idCardImage.src = currentPhoto;
    }

    if (userData.faction) {
        factionInputs.forEach(radio => {
            if (radio.value === userData.faction) radio.checked = true;
        });
    }
}

export async function loadProfilePage() {
    const container = document.getElementById('profile-content');
    const loader = document.getElementById('profile-loader');

    const nameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('user-email');
    const bioInput = document.querySelector('textarea');
    const factionInputs = document.querySelectorAll('input[name="faction"]');
    const form = document.getElementById('profile-form');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    const idCardImage = document.getElementById('profile-image-preview');
    const fileInput = document.getElementById('profile-photo-input');

    if (!container) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            globalThis.location.href = '/pages/login.html?redirect=profile';
            return;
        }

        console.log(`> Accessing File: ${user.uid}`);

        const userDocRef = doc(db, 'users', user.uid);
        let userData = {};
        try {
            const snap = await getDoc(userDocRef);
            if (snap.exists()) userData = snap.data();
        } catch (err) {
            console.error('Failed to decrypt user profile', err);
        }

        populateFormFields(user, userData, { emailInput, nameInput, bioInput, factionInputs, idCardImage });

        if (loader) {
            setTimeout(() => {
                loader.classList.add('opacity-0', 'pointer-events-none');
                container.classList.remove('opacity-0');
            }, 600);
        }

        /* --------------------------------------------------------------------------
           EVENT LISTENERS
           -------------------------------------------------------------------------- */

        if (fileInput && idCardImage) {
            fileInput.addEventListener('change', (ev) => {
                const f = ev.target.files && ev.target.files[0];
                if (!f) return;
                if (f.size > 2 * 1024 * 1024) {
                    alert("Image file too large. Compress data packet.");
                    return;
                }
                const url = URL.createObjectURL(f);
                idCardImage.src = url;
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                updateButtonStatus(submitBtn, 'ENCRYPTING DATA...', 'loading');

                const newName = nameInput.value.trim();
                const newBio = bioInput ? bioInput.value.trim() : '';
                let selectedFaction = null;
                factionInputs.forEach(r => { if (r.checked) selectedFaction = r.value; });

                const file = fileInput && fileInput.files[0];

                try {
                    let photoURL = user.photoURL;

                    if (file) {
                        const sRef = storageRef(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
                        await uploadBytes(sRef, file);
                        photoURL = await getDownloadURL(sRef);
                    }

                    if (auth.currentUser) {
                        await updateProfile(auth.currentUser, { displayName: newName, photoURL });
                    }

                    await setDoc(userDocRef, {
                        displayName: newName,
                        photoURL: photoURL,
                        bio: newBio,
                        faction: selectedFaction || 'neutral',
                        updatedAt: serverTimestamp(),
                    }, { merge: true });

                    console.log('> Profile Updated Successfully');
                    updateButtonStatus(submitBtn, 'ACCESS GRANTED', 'success');

                    const headerAvatar = document.querySelector('#user-menu-btn img');
                    if (headerAvatar && photoURL) headerAvatar.src = photoURL;

                } catch (err) {
                    console.error('> Update Failed:', err);
                    updateButtonStatus(submitBtn, 'UPLOAD FAILED', 'error');
                }
            });
        }

        const burnBtn = document.querySelector(String.raw`.lg\:col-span-4 button`);

        if (burnBtn && !burnBtn.dataset.listening) {
            burnBtn.dataset.listening = 'true';
            burnBtn.addEventListener('click', async () => {
                if (confirm("WARNING: This action will permanently scrub your identity from the Ravenwood Archives. This cannot be undone. Proceed?")) {
                    try {
                        await deleteDoc(userDocRef);
                        await deleteUser(user);
                        alert("Identity scorched. Redirecting...");
                        globalThis.location.href = '/';
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