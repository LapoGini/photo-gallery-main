import { ref, onMounted, watch } from 'vue';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { openDB } from 'idb';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications, ScheduleOptions, ScheduleResult, PermissionStatus } from '@capacitor/local-notifications';


const convertBlobToBase64 = (blob: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

export const usePhotoGallery = () => {

  // Funzione per controllare i permessi delle notifiche
  const checkPermissions = async (): Promise<PermissionStatus> => {
    try {
      const permissions = await LocalNotifications.checkPermissions();
      console.log('Permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return null;
    }
  };

  // Funzione per richiedere i permessi delle notifiche
  const requestPermissions = async (): Promise<PermissionStatus> => {
      try {
        const permissions = await LocalNotifications.requestPermissions();
        console.log('Requested Permissions:', permissions);
        return permissions;
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return null;
      }
    };

  // Funzione per pianificare una notifica locale
  const scheduleLocalNotification = async (imageTitle: string, accuracy: number | string) => {
    const options: ScheduleOptions = {
      notifications: [
        {
          title: 'Nuova Foto Scattata',
          body: `Titolo: ${imageTitle}\nAccuratezza delle coordinate: ${Number(accuracy).toFixed(2)}`,
          id: 1,
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    };
    try {
      const result: ScheduleResult = await LocalNotifications.schedule(options);
      console.log('Notification scheduled successfully:', result);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

    // array utilizzato per memorizzare tutte le foto in maniera REATTIVA
    const photos = ref<UserPhoto[]>([]);

    //API delle preferenze
    const PHOTO_STORAGE = 'photos';

    // Aprire il database e lo store per le foto all'avvio dell'applicazione
    const openPhotoGalleryDB = async () => {
      const db = await openDB('photo_gallery_db', 1, {
          upgrade(db) {
              if (!db.objectStoreNames.contains('photos')) {
                  db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
              }
          },
      });
      return db;
    };

    // La promessa viene risolta con il database aperto
    const photoGalleryDBPromise = openPhotoGalleryDB();

    const getCurrentPosition = async () => {
      const options = {
        enableHighAccuracy: true, // Accuratezza del (GPS)
      };
      const coordinates = await Geolocation.getCurrentPosition(options);
      return coordinates;
    };

    const accuracy = ref<string | number>('N/A');
    const lowestAccuracy = ref<number | null>(null);

    const getRealTimeAccuracy = async () => {
      try {
        const coordinates = await getCurrentPosition();
        const currentAccuracy = coordinates?.coords?.accuracy;
        
        if (currentAccuracy !== null) {
          accuracy.value = currentAccuracy;
          console.log('accuracy', accuracy.value);
          
          if (lowestAccuracy.value === null || currentAccuracy < lowestAccuracy.value) {
            lowestAccuracy.value = currentAccuracy;
            console.log('lowest accuracy', lowestAccuracy.value);
          }
        } else {
          accuracy.value = 'N/A';
        }
      } catch (error) {
        console.error('Errore:', error);
        accuracy.value = 'N/A';
      }
    }

    const startAccuracyMonitoring = () => {
      const intervalId = setInterval(getRealTimeAccuracy, 1500);
      const stopMonitoring = () => clearInterval(intervalId);
      return stopMonitoring;
    }

    const takePhoto = async () => {
      const stopMonitoringAccuracy = startAccuracyMonitoring();
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100,
        });

        // Prendere le cordinate dalla funzione getCurrrentPosition()
        const coordinates = await getCurrentPosition();

        const accuracy = coordinates?.coords?.accuracy || 'N/A';


        //crea un nome univoco per il file della foto
        const imageTitle = Date.now() + '- title';
        const savedFileImage = await savePicture(photo, imageTitle, coordinates);

        stopMonitoringAccuracy();

        await checkPermissions();
        await requestPermissions();
        await scheduleLocalNotification(imageTitle, accuracy);

        //aggiunge l'oggetto savedFileImage all'array photos
        photos.value = [savedFileImage, ...photos.value];
    };

    const savePicture = async (photo: Photo, title: string, coordinates: any): Promise<UserPhoto> => {
        // Fetch the photo, read as a blob, then convert to base64 format
        const response = await fetch(photo.webPath!);
        const blob = await response.blob();
        const base64Data = (await convertBlobToBase64(blob)) as string;
        
        // Aprire il database
        const db = await photoGalleryDBPromise;

        // Aprire una transazione di scrittura
        const tx = db.transaction('photos', 'readwrite');

        // Ottenere lo store per le foto
        const store = tx.objectStore('photos');

        // Inserire la foto nell'IndexedDB
        const id = await store.add({ filepath: photo.webPath, base64Data: blob, title, coordinates });

        // Chiudere la transazione
        await tx.done;

        return { id, filepath: photo.webPath, title, coordinates };
    };

    const cachePhotos = () => {
      Preferences.set({
        key: PHOTO_STORAGE,
        value: JSON.stringify(photos.value),
      });
    };

    watch(photos, cachePhotos);

    const loadSaved = async () => {

      // Aprire il database
      const db = await photoGalleryDBPromise;

      // Aprire una transazione di lettura
      const tx = db.transaction('photos', 'readonly');

      // Ottenere lo store per le foto
      const store = tx.objectStore('photos');

      // Recuperare tutte le foto dallo store
      const photosFromDB: UserPhoto[] = await store.getAll();

      // Converti i dati del blob in un URL Blob e assegnali a webviewPath
      for (const photo of photosFromDB) {
        if (photo.base64Data instanceof Blob) {
          photo.webviewPath = URL.createObjectURL(photo.base64Data);
        }
      }

      // Chiudere la transazione
      await tx.done;

      // Inverti l'array delle foto per visualizzare l'ultima foto scattata come prima
      photosFromDB.reverse();

      // Aggiornare l'array di foto con i dati di IndexedDB
      photos.value = photosFromDB;
    };

    onMounted(loadSaved);

    return {
        photos,
        takePhoto,
        accuracy,
        lowestAccuracy,
    };
};


// definita l'interfaccia UserPhoto che rappresenta una singola foto con i suoi metadati
export interface UserPhoto {
    //id generato da IndexedDB
    id?: number;
    //percorso del file della foto
    filepath: string;
    //specifica del tipo di dato 'Blob' che arriva in formato base64Data
    base64Data: Blob;
    //percorso della foto visualizzabile nel webview
    webviewPath?: string;
    // titolo foto
    title?: string;
}