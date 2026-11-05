// Tarayıcının yerleşik IndexedDB veritabanını kullanarak sesleri cihaz hafızasında saklar
const DB_NAME = 'VoiceCRM_Audio_DB';
const STORE_NAME = 'audio_blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sesi kullanıcının cihazına (IndexedDB) kaydeder.
 */
export async function saveLocalAudio(planId: string, audioBlob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(audioBlob, planId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cihaz hafızasındaki sesi oynatılabilir URL olarak getirir.
 */
export async function getLocalAudioUrl(planId: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(planId);
    request.onsuccess = () => {
      const blob = request.result as Blob;
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}
/**
 * Cihaz hafızasındaki (IndexedDB) tüm ses kayıtlarını tamamen temizler.
 */
export async function clearAllLocalAudio(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}