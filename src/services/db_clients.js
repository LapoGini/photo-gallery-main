import { openDB } from 'idb';


// DATABASE PER I CLIENTI //
const DATABASE_NAME_CLIENT = 'rwd_clients';
const STORE_NAME_CLIENT = 'clients';

async function initDB() {
    return openDB(DATABASE_NAME_CLIENT, 1, {
        upgrade(db) {
        db.createObjectStore(STORE_NAME_CLIENT, { keyPath: 'id' });
        }
    });
}
export async function saveClientsToDB(clients) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME_CLIENT, 'readwrite');
  const store = tx.objectStore(STORE_NAME_CLIENT);
  for (let client of clients) {
    const simplifiedClients = {
      id: client.id,
      name: client.name
    };
    store.put(simplifiedClients);
  }
  await tx.done;
}
export async function getClientsFromDB() {
  const db = await initDB();
  return db.getAll(STORE_NAME_CLIENT);
}



