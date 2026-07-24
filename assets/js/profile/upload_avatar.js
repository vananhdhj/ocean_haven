// ** upload_avatar.js — Client-side Avatar Upload Logic ** //
import { updateNavbarAvatar } from '../navbar.js';

export function initAvatarUpload({ avatarArea, avatarInput, avatarOverlay, onUpdated }) {
    if (!avatarArea || !avatarInput) return;

    // Hover: reveal camera overlay
    if (avatarOverlay) {
        avatarArea.addEventListener('mouseenter', () => { avatarOverlay.style.opacity = '1'; });
        avatarArea.addEventListener('mouseleave', () => { avatarOverlay.style.opacity = '0'; });
    }

    // Click / keyboard: open file picker
    avatarArea.addEventListener('click', () => avatarInput.click());
    avatarArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            avatarInput.click();
        }
    });

    // File selected: upload file to server via API → update DB and UI
    avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('./api/users/upload_avatar.php', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success && result.avatar_url) {
                applyAvatarToElement(avatarArea, result.avatar_url, avatarOverlay);
                updateNavbarAvatar(result.avatar_url);

                if (typeof onUpdated === 'function') {
                    onUpdated(result.avatar_url);
                }
            } else {
                alert(result.message || 'Failed to upload avatar.');
            }
        } catch (err) {
            console.error('Avatar upload network error:', err);
            alert('A network error occurred while uploading your avatar.');
        } finally {
            // Reset input value so re-selecting the same file triggers change event
            avatarInput.value = '';
        }
    });
}

/** Swaps the avatar element's content for an <img> displaying the avatarUrl. */
export function applyAvatarToElement(avatarArea, avatarUrl, avatarOverlay) {
    let avatarImg = avatarArea.querySelector('img');
    const initSpan = avatarArea.querySelector('span:not(#avatar-upload-overlay span)');
    const initIcon = avatarArea.querySelector('i:not(#avatar-upload-overlay i)');

    if (!avatarImg) {
        avatarImg = document.createElement('img');
        avatarImg.alt = 'Avatar';
        avatarImg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
        if (initSpan) initSpan.replaceWith(avatarImg);
        else if (initIcon) initIcon.replaceWith(avatarImg);
        else avatarArea.insertBefore(avatarImg, avatarOverlay || null);
    }
    avatarImg.src = avatarUrl;
}

export const AvatarUpload = {
    init: initAvatarUpload,
    applyAvatarToElement,
};

window.AvatarUpload = AvatarUpload;
export default AvatarUpload;
