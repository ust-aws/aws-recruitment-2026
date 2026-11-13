const DB_NAME = "aws-ust-apply-draft-files"
const STORE = "files"
const DB_VERSION = 1

export type DraftDocumentKey = "resume" | "registration"

type StoredFile = {
  name: string
  type: string
  data: ArrayBuffer
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error("Could not open draft file storage."))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = run(tx.objectStore(STORE))
        request.onerror = () => reject(request.error ?? new Error("Draft file storage failed."))
        request.onsuccess = () => resolve(request.result as T)
        tx.oncomplete = () => db.close()
        tx.onerror = () => reject(tx.error ?? new Error("Draft file storage failed."))
      }),
  )
}

export async function saveDraftDocument(key: DraftDocumentKey, file: File): Promise<void> {
  const data = await file.arrayBuffer()
  const stored: StoredFile = { name: file.name, type: file.type, data }
  await runTransaction("readwrite", (store) => store.put(stored, key))
}

export async function deleteDraftDocument(key: DraftDocumentKey): Promise<void> {
  try {
    await runTransaction("readwrite", (store) => store.delete(key))
  } catch {
    // ignore
  }
}

export async function loadDraftDocument(key: DraftDocumentKey): Promise<File | null> {
  try {
    const stored = await runTransaction<StoredFile | undefined>("readonly", (store) => store.get(key))
    if (!stored?.data) return null
    return new File([stored.data], stored.name, { type: stored.type })
  } catch {
    return null
  }
}

export async function loadAllDraftDocuments(): Promise<
  Partial<Record<DraftDocumentKey, File>>
> {
  const keys: DraftDocumentKey[] = ["resume", "registration"]
  const entries = await Promise.all(
    keys.map(async (key) => [key, await loadDraftDocument(key)] as const),
  )
  return Object.fromEntries(entries.filter(([, file]) => file != null))
}

export async function clearDraftDocuments(): Promise<void> {
  try {
    await runTransaction("readwrite", (store) => store.clear())
  } catch {
    // ignore
  }
}
