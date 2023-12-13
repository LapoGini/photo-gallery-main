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

export async function countItemsInDB() {
    const db = await initItemsDB();
    return db.count(STORE_NAME_ITEMS);
}

export async function getItemsByStreetId(streetId) {
    const db = await initItemsDB();
    const tx = db.transaction(STORE_NAME_ITEMS, 'readonly');
    const store = tx.objectStore(STORE_NAME_ITEMS);
    
    const items = [];
    let cursor = await store.openCursor();
    console.log('cursor', cursor);
    
    while (cursor) {
        console.log(`Comparing: ${cursor.value.street_id} to ${streetId}`);
        if (cursor.value.street_id.toString() === streetId.toString()) {
            items.push(cursor.value);
        }
        cursor = await cursor.continue();
    }

    console.log('items scansionati da OFFFLINE', items);

    return items;
}

export async function synchronizeStreetAndItems(localId, serverId) {
    // Ottieni tutti gli items con lo stesso street_id del localId
    const itemsToUpdate = await getItemsByStreetId(localId);
  
    // Aggiorna e salva gli items con il nuovo street_id
    const db = await initItemsDB();
    const tx = db.transaction(STORE_NAME_ITEMS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_ITEMS);
  
    for (const item of itemsToUpdate) {
      // Aggiorna il campo street_id con il nuovo serverId
      item.street_id = serverId;
  
      // Salva l'item aggiornato nell'IndexedDB
      store.put(item);
    }
  
    await tx.done;
  }
  

