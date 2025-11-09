import { auth, db, storage } from '../firebase-config.js';
import { onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

export async function loadProfilePage() {
  const container = document.getElementById('profile-content');
  if (!container) return;

  // Wait for auth state
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // redirect to login with return param
      window.location.assign('login.html?redirect=profile.html');
      return;
    }

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    let userData = {};
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) userData = snap.data();
    } catch (err) {
      console.error('Failed to load user profile', err);
    }

    // Render simple profile form with avatar upload
    container.innerHTML = `
      <h1 class="text-4xl font-serif text-yellow-500 mb-6">Profile</h1>
      <div class="bg-neutral-800 p-6 rounded">
        <form id="profile-form" class="profile-form space-y-4">
          <div class="flex items-center space-x-4">
            <div>
              <img id="avatar-preview" src="${user.photoURL || ''}" alt="avatar" class="w-20 h-20 rounded-full object-cover ${user.photoURL ? '' : 'hidden'}" />
            </div>
            <div>
              <label class="block text-sm text-gray-300">Change photo</label>
              <input type="file" id="avatar-file" accept="image/*" />
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-300">Email</label>
            <input type="text" name="email" value="${user.email || ''}" disabled class="w-full mt-1 p-2 rounded bg-neutral-900 border border-neutral-700" />
          </div>
          <div>
            <label class="block text-sm text-gray-300">Display name</label>
            <input type="text" name="displayName" value="${user.displayName || (userData.displayName || '')}" class="w-full mt-1 p-2 rounded bg-neutral-900 border border-neutral-700" />
          </div>
          <div>
            <button id="save-profile-btn" class="py-2 px-4 bg-yellow-500 text-black rounded font-bold">Save</button>
          </div>
        </form>
        <p id="profile-message" class="profile-message text-sm text-gray-300 mt-4"></p>
      </div>
    `;

    const form = document.getElementById('profile-form');
    const msg = document.getElementById('profile-message');
    const fileInput = document.getElementById('avatar-file');
    const avatarPreview = document.getElementById('avatar-preview');

    fileInput.addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      avatarPreview.src = url;
      avatarPreview.classList.remove('hidden');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const displayName = form.querySelector('input[name="displayName"]').value.trim();
      const file = fileInput.files && fileInput.files[0];
      try {
        let photoURL = user.photoURL || null;
        if (file) {
          // upload to Firebase Storage
          const sRef = storageRef(storage, `avatars/${user.uid}/${file.name}`);
          await uploadBytes(sRef, file);
          photoURL = await getDownloadURL(sRef);
        }

        // Update Auth profile
        await updateProfile(auth.currentUser, { displayName, photoURL });
        // Update Firestore
        await setDoc(doc(db, 'users', user.uid), {
          displayName,
          photoURL,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // Update UI and message
        msg.textContent = 'Profile updated.';
        // update menu avatar if present
        const menuImg = document.querySelector('#user-menu img.user-avatar');
        if (menuImg && photoURL) menuImg.src = photoURL;
      } catch (err) {
        console.error('Failed to update profile', err);
        msg.textContent = 'Failed to update profile.';
      }
    });
  });
}

export default loadProfilePage;
