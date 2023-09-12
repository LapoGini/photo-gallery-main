import { openDB } from 'idb';


// DATABASE PER I CLIENTI //
const DATABASE_NAME_TAGS = 'rwd_tags';
const STORE_NAME_TAGS = 'tags';

async function initDB() {
    return openDB(DATABASE_NAME_TAGS, 1, {
        upgrade(db) {
        db.createObjectStore(STORE_NAME_TAGS, { keyPath: 'tag_type_id' });
        }
    });
}
export async function saveTagsToDB(tagGroups) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME_TAGS, 'readwrite');
    const store = tx.objectStore(STORE_NAME_TAGS);
  
    for (let group of tagGroups) {
      const simplifiedGroup = {
        tag_type_id: group.tag_type_id,
        tag_type_name: group.tag_type_name,
        tags: group.tags.map(tag => ({
          tag_id: tag.tag_id,
          tag_name: tag.tag_name,
          description: tag.description,
          domain: tag.domain
        }))
      };
      store.put(simplifiedGroup);
    }
  
    await tx.done;
  }
  export async function getTagsFromDB() {
    const db = await initDB();
    return db.getAll(STORE_NAME_TAGS);
  }
