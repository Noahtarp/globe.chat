// netlify/functions/_db.js
import { getStore as netlifyGetStore } from '@netlify/blobs';

function getStore() {
  try {
    return netlifyGetStore('gc-users');
  } catch (e) {
    return null;
  }
}

const mem = {};

export async function getUser(email) {
  const key = 'u:' + email.toLowerCase().trim();
  const store = getStore();
  if (store) {
    try { return (await store.get(key, { type: 'json' })) ?? null; }
    catch { return null; }
  }
  return mem[key] ?? null;
}

export async function setUser(email, data) {
  const key = 'u:' + email.toLowerCase().trim();
  const store = getStore();
  if (store) {
    await store.setJSON(key, data);
  } else {
    mem[key] = data;
  }
}

export async function getUserByCode(code) {
  const key = 'c:' + code;
  const store = getStore();
  if (store) {
    try {
      const email = await store.get(key, { type: 'text' });
      if (!email) return null;
      return getUser(email.trim());
    } catch { return null; }
  }
  // mem fallback: scan
  const found = Object.keys(mem).find(k => k.startsWith('u:') && mem[k]?.verifyCode === code);
  return found ? mem[found] : null;
}

export async function setCodeIndex(code, email) {
  const store = getStore();
  if (store) {
    await store.set('c:' + code, email.toLowerCase().trim());
  }
  // mem: no-op, scan works
}

export async function deleteCodeIndex(code) {
  const store = getStore();
  if (store) {
    try { await store.delete('c:' + code); } catch {}
  }
}
