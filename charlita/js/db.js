// Tiny IndexedDB wrapper. Stores: items (SRS state per item key), kv (profile, settings, deck, log), words (user-added words).
const DB_NAME = 'charlita';
const VERSION = 1;
const STORES = ['items', 'kv', 'words'];
let dbp;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('words')) db.createObjectStore('words', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
function tx(store, mode, fn) {
  return open().then(db => new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let out;
    Promise.resolve(fn(s)).then(v => { out = v; });
    t.oncomplete = () => res(out);
    t.onerror = () => rej(t.error);
  }));
}
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export const db = {
  get: (store, key) => open().then(d => req(d.transaction(store).objectStore(store).get(key))),
  all: (store) => open().then(d => req(d.transaction(store).objectStore(store).getAll())),
  allKeys: (store) => open().then(d => req(d.transaction(store).objectStore(store).getAllKeys())),
  put: (store, val, key) => tx(store, 'readwrite', s => { key === undefined ? s.put(val) : s.put(val, key); }),
  putMany: (store, vals) => tx(store, 'readwrite', s => { vals.forEach(v => s.put(v)); }),
  del: (store, key) => tx(store, 'readwrite', s => { s.delete(key); }),
  clear: (store) => tx(store, 'readwrite', s => { s.clear(); }),
  async exportAll() {
    const out = { app: 'charlita', format: 1, exported: new Date().toISOString(), stores: {} };
    for (const st of STORES) {
      if (st === 'kv') {
        const keys = await db.allKeys('kv'); const vals = await db.all('kv');
        out.stores.kv = Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
      } else out.stores[st] = await db.all(st);
    }
    return out;
  },
  async importAll(data) {
    if (!data || data.app !== 'charlita' || !data.stores) throw new Error('formato');
    for (const st of STORES) await db.clear(st);
    await db.putMany('items', data.stores.items || []);
    await db.putMany('words', data.stores.words || []);
    await tx('kv', 'readwrite', s => { for (const [k, v] of Object.entries(data.stores.kv || {})) s.put(v, k); });
  },
  async wipe() { for (const st of STORES) await db.clear(st); },
};
