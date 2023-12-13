import { openDB } from 'idb';
import { useNetwork } from '@/composables/useNetwork';


const { networkStatus, logCurrentNetworkStatus, showToastBackground } = useNetwork();

// DATABASE PER I COMUNI //
const DATABASE_NAME_STREETS = 'rwd_streets';
const STORE_NAME_STREETS = 'streets';

async function initDB() {
    return openDB(DATABASE_NAME_STREETS, 1, {
        upgrade(db) {
            const store = db.createObjectStore(STORE_NAME_STREETS, { keyPath: 'id' });
            store.createIndex('city_id', 'city_id', { unique: false });
        }
    });
}
export async function saveStreetsToDB(streets) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME_STREETS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_STREETS);
    for (let street of streets) {
        const simplifiedStreets = {
            id: street.id,
            name: street.name,
            city_id: street.city_id,
            sincronizzato: true,
        };
        store.put(simplifiedStreets);
    }
    await tx.done;
}

export async function saveStreetToDB(street) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME_STREETS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_STREETS);

    let sincronizzatoValue = false;
    if (networkStatus.value) {
        sincronizzatoValue = true;
    }

    console.log("Street input:", street);

    const allStreets = await store.getAll();
    console.log("All streets:", allStreets);
    const existingStreet = allStreets.find(s => s.name === street.name && s.city_id === street.city_id);

    let streetId;
    if (existingStreet) {
        // Se la strada esiste già, usa il suo ID
        streetId = existingStreet.id;
    } else {
        // Altrimenti, genera un nuovo ID
        streetId = street.id || Date.now();
    }
    
    const simplifiedStreet = {
        id: streetId,
        name: street.name,
        city_id: street.city_id,
        sincronizzato: sincronizzatoValue,
    };

    console.log("Simplified street:", simplifiedStreet);
    
    store.put(simplifiedStreet);
    
    await tx.done;
    return simplifiedStreet.id;
}

export async function getStreetsFromDB(cityId) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME_STREETS, 'readonly');
    const store = tx.objectStore(STORE_NAME_STREETS);
    const index = store.index('city_id');
    return index.getAll(IDBKeyRange.only(cityId));
}

export async function getAllStreetsFromDB() {
    const db = await initDB();
    return db.getAll(STORE_NAME_STREETS);
}

export async function getUnsynchronizedStreetsFromDB() {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME_STREETS, 'readonly');
    const store = tx.objectStore(STORE_NAME_STREETS);
    return store.getAll().then(streets => streets.filter(street => !street.sincronizzato));
}

export async function markStreetAsSynchronized(localId, serverId) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME_STREETS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_STREETS);
    
    const streetToUpdate = await store.get(localId);
    if (streetToUpdate) {
        // Prima elimina la vecchia voce
        await store.delete(localId);

        localStorage.setItem('addStreet', serverId);

        console.log('SERVERID:', serverId, 'LOCALID:', localId);
        
        // Poi crea una nuova voce con l'ID fornito dal server
        const newStreetEntry = {
            id: serverId,
            name: streetToUpdate.name,
            city_id: streetToUpdate.city_id,
            sincronizzato: true
        };
        store.add(newStreetEntry);

        console.log('LASTSERVERID:', serverId, 'LOCALID:', localId);
    }
}