import { openDB } from 'idb';

const DATABASE_NAME_ITEMS = 'rwd_items';
const STORE_NAME_ITEMS = 'items';

async function initItemsDB() {
    return openDB(DATABASE_NAME_ITEMS, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME_ITEMS, { keyPath: 'id_da_app' });
        }
    });
}

export async function saveItemToDB(item) {
    const db = await initItemsDB();
    const tx = db.transaction(STORE_NAME_ITEMS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_ITEMS);
    store.put(item);
    await tx.done;
}

export async function getItemsFromDB() {
    const db = await initItemsDB();
    return db.getAll(STORE_NAME_ITEMS);
}

export async function deleteItemFromDB(id_da_app) {
    const db = await initItemsDB();
    const tx = db.transaction(STORE_NAME_ITEMS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_ITEMS);
    await store.delete(id_da_app);
    await tx.done;
}

export async function getAllItemsFromDB() {
    const db = await initItemsDB();
    const tx = db.transaction(STORE_NAME_ITEMS, 'readonly');
    const store = tx.objectStore(STORE_NAME_ITEMS);
    return store.openCursor();
}
