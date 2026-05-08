import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const SECRET_KEY = 'sanito-ergo-sum';
const STORAGE_KEY = 'permissions';  // Key to store in cookie

// Encrypt data
const encrypt = (data) => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

// Decrypt data
const decrypt = (ciphertext) => {
  return CryptoJS.AES.decrypt(ciphertext, SECRET_KEY).toString(CryptoJS.enc.Utf8);
};

// Save permissions in cookies with encryption
export const savePermissions = (permissions) => {
  try {
    const json = JSON.stringify(permissions);
    const encrypted = encrypt(json);
    // Store the encrypted permissions in cookies, with a 7-day expiry
    Cookies.set(STORAGE_KEY, encrypted, { expires: 7 });
  } catch (error) {
    console.error('Failed to save permissions in cookies:', error);
  }
};

// Get permissions from cookies and decrypt them
export const getPermissions = () => {
  const encrypted = Cookies.get(STORAGE_KEY);
  if (!encrypted) return null;

  try {
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to decrypt permissions from cookies:', error);
    return null;
  }
};

// Clear permissions from cookies
export const clearPermissionsStorage = () => {
  Cookies.remove(STORAGE_KEY);
};
