// ** Avatar upload logic ** //
import { updateNavbarAvatar } from '../navbar.js';

export function initAvatarUpload({ avatarArea, avatarInput, avatarOverlay, userEmail, onUpdated }) {
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

    // File selected: resize via canvas → save to localStorage → update UI
    avatarInput.addEventListener('change', () => {
        const file = avatarInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const tempImg = new Image();
            tempImg.onload = () => {
                const dataUrl = cropAndResizeToSquare(tempImg, 200);

                if (userEmail) {
                    saveAvatarToStorage(userEmail, dataUrl);
                }

                applyAvatarToElement(avatarArea, dataUrl, avatarOverlay);

                if (typeof onUpdated === 'function') {
                    onUpdated(dataUrl);
                }

                updateNavbarAvatar(dataUrl);
            };
            tempImg.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Crops an image to a centered square and resizes it to `size`x`size`.
 * Returns a JPEG data URL.
 */
export function cropAndResizeToSquare(img, size = 200) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cropSize = Math.min(img.width, img.height);
    ctx.drawImage(
        img,
        (img.width - cropSize) / 2, (img.height - cropSize) / 2,
        cropSize, cropSize,
        0, 0, size, size
    );
    return canvas.toDataURL('image/jpeg', 0.85);
}

/** Persists an avatar dataUrl in localStorage, keyed by user email. */
export function saveAvatarToStorage(userEmail, dataUrl) {
    localStorage.setItem('ocean_haven_avatar_' + userEmail, dataUrl);
}

/** Reads a previously saved avatar dataUrl for a given email, or null. */
export function getAvatarFromStorage(userEmail) {
    return userEmail ? localStorage.getItem('ocean_haven_avatar_' + userEmail) : null;
}

/** Swaps the avatar element's content (span/icon) for an <img> showing dataUrl. */
export function applyAvatarToElement(avatarArea, dataUrl, avatarOverlay) {
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
    avatarImg.src = dataUrl;
}

export const AvatarUpload = {
    init: initAvatarUpload,
    cropAndResizeToSquare,
    saveAvatarToStorage,
    getAvatarFromStorage,
    applyAvatarToElement,
};

window.AvatarUpload = AvatarUpload;
export default AvatarUpload;