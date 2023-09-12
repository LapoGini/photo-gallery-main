import { openDB } from 'idb';


// DATABASE PER I COMUNI //
const DATABASE_NAME_CITIES = 'rwd_cities';
const STORE_NAME_CITIES = 'cities';

async function initDB() {
    return openDB(DATABASE_NAME_CITIES, 1, {
        upgrade(db) {
        db.createObjectStore(STORE_NAME_CITIES, { keyPath: 'comune_id' });
        }
    });
}
export async function saveCitiesToDB(cities) {
const db = await initDB();
const tx = db.transaction(STORE_NAME_CITIES, 'readwrite');
const store = tx.objectStore(STORE_NAME_CITIES);
for (let city of cities) {
    const simplifiedCities = {
        comune_id: city.comune_id,
        comune_nome: city.comune_nome,
        provincia_id: city.provincia_id,
        CLIENTE: city.CLIENTE,
    };
    store.put(simplifiedCities);
}
await tx.done;
}

export async function getCitiesFromDB() {
const db = await initDB();
return db.getAll(STORE_NAME_CITIES);
}