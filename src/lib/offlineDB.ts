// Native IndexedDB — no external dependencies

const DB_NAME = 'pos-bakery-offline'
const DB_VERSION = 1
const TX_STORE = 'offlineTransactions'

export interface OfflineTransaction {
  id: string
  payload: {
    shiftId: string
    outletId: string
    items: { productId: string; quantity: number; unitPrice: number; notes?: string }[]
    paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'SPLIT'
    paidAmount: number
    discount?: number
    notes?: string
  }
  total: number
  createdAt: string
  synced: boolean
  syncError?: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(TX_STORE)) {
        const store = db.createObjectStore(TX_STORE, { keyPath: 'id' })
        store.createIndex('by-synced', 'synced', { unique: false })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function dbGet<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

function dbPut(db: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function dbGetAllByIndex<T>(db: IDBDatabase, store: string, index: string, value: IDBValidKey): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, 'readonly')
      .objectStore(store)
      .index(index)
      .getAll(value)
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

function dbCountByIndex(db: IDBDatabase, store: string, index: string, value: IDBValidKey): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(store, 'readonly')
      .objectStore(store)
      .index(index)
      .count(value)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function saveOfflineTransaction(
  payload: OfflineTransaction['payload'],
  total: number
): Promise<string> {
  const db = await openDB()
  const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  await dbPut(db, TX_STORE, {
    id,
    payload,
    total,
    createdAt: new Date().toISOString(),
    synced: false,
  })
  return id
}

export async function getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
  const db = await openDB()
  return dbGetAllByIndex<OfflineTransaction>(db, TX_STORE, 'by-synced', 0) // IDB stores booleans as 0/1
}

export async function markTransactionSynced(id: string): Promise<void> {
  const db = await openDB()
  const tx = await dbGet<OfflineTransaction>(db, TX_STORE, id)
  if (tx) await dbPut(db, TX_STORE, { ...tx, synced: true })
}

export async function markTransactionError(id: string, error: string): Promise<void> {
  const db = await openDB()
  const tx = await dbGet<OfflineTransaction>(db, TX_STORE, id)
  if (tx) await dbPut(db, TX_STORE, { ...tx, syncError: error })
}

export async function countUnsynced(): Promise<number> {
  const db = await openDB()
  // Try index first, fall back to manual count
  try {
    return await dbCountByIndex(db, TX_STORE, 'by-synced', 0)
  } catch {
    const all = await dbGetAllByIndex<OfflineTransaction>(db, TX_STORE, 'by-synced', 0)
    return all.length
  }
}
