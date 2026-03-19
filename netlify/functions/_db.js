// netlify/functions/_db.js
// Simple user store using Netlify Blobs (built-in KV, no external DB needed).
// Falls back to in-memory for local dev if blobs aren't available.

let blobStore = null;

async function getStore() {
  if (blobStore) return blobStore;
  try {
    const { getStore } = await import('@netlify/blobs');
    blobStore = getStore('users');
    return blobStore;
  } catch (e) {
    // local dev fallback — in-memory
    return null;
  }
}

// In-memory fallback for local dev
const memStore = {};

export async function getUser(email) {
  const key = email.toLowerCase().trim();
  const store = await getStore();
  if (store) {
    try {
      const raw = await store.get(key, { type: 'json' });
      return raw || null;
    } catch { return null; }
  }
  return memStore[key] || null;
}

export async function setUser(email, data) {
  const key = email.toLowerCase().trim();
  const store = await getStore();
  if (store) {
    await store.setJSON(key, data);
  } else {
    memStore[key] = data;
  }
}

export async function getUserByToken(token) {
  // We store a lookup index: token -> email
  const store = await getStore();
  if (store) {
    try {
      const email = await store.get(`tok:${token}`, { type: 'text' });
      if (!email) return null;
      return getUser(email);
    } catch { return null; }
  }
  // fallback: scan mem
  return Object.values(memStore).find(u => u.verifyToken === token) || null;
}

export async function setTokenIndex(token, email) {
  const store = await getStore();
  if (store) {
    await store.set(`tok:${token}`, email.toLowerCase().trim());
  }
  // mem fallback: no-op, getUserByToken scans
}
