import { auth, db, storage } from '../firebase-config.js';
import { onAuthStateChanged, updateProfile, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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



export default async function (container, props) {
    // container is passed in.
    const loader = document.getElementById('profile-loader');

    const nameInput = container.querySelector('#display-name');
    const emailInput = container.querySelector('#user-email');
    const form = container.querySelector('#profile-form');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    const idCardImage = container.querySelector('#profile-image-preview');
    const fileInput = container.querySelector('#profile-photo-input');

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

        // --- POPULATE FIELDS ---
        if (emailInput) emailInput.value = user.email;
        if (nameInput) nameInput.value = user.displayName || userData.displayName || '';

        const currentPhoto = user.photoURL || userData.photoURL;
        if (currentPhoto && idCardImage) {
            idCardImage.src = currentPhoto;
        }
        // -----------------------

        if (loader) {
            setTimeout(() => {
                loader.classList.add('opacity-0', 'pointer-events-none');
                container.classList.remove('opacity-0');
            }, 600);
        } else {
            // Fallback if loader is missing
            container.classList.remove('opacity-0');
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
    });
}

