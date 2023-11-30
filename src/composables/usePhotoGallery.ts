import { ref, onMounted, watch } from 'vue';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { openDB } from 'idb';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications, ScheduleOptions, ScheduleResult, PermissionStatus } from '@capacitor/local-notifications';
import axios from 'axios';
import { Filesystem, Directory } from "@capacitor/filesystem";


export const uploadPhotoToServer = async (imageBlob: Blob, itemPic?: string) => {
  try {
    const apiToken = localStorage.getItem('apiToken');
    const base64ImageString = await imageBlob;

    const pic = localStorage.getItem('photoTitle') ? localStorage.getItem('photoTitle') + '.jpg' : itemPic;

    const data = {
      imagedata: base64ImageString,
      imageName: pic,
      cartellaDelGiorno: new Date().toISOString().split('T')[0]
    };

    const response = await axios.post('https://rainwaterdrains.inyourlife.com/api/saveImage', data, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Errore durante l’upload della foto:', error);
    throw error;

  }
};

function blobToBase64(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function () {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const usePhotoGallery = () => {

  // REDIMENSIONAMENTO IMMAGINE DA MB A KB
  const resizeImage = async (blob: Blob, maxWidth: number = 1024, maxHeight: number = 768): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx === null) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        const aspectRatio = img.width / img.height;
        if (img.width > img.height) {
          canvas.width = maxWidth;
          canvas.height = maxWidth / aspectRatio;
        } else {
          canvas.height = maxHeight;
          canvas.width = maxHeight * aspectRatio;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((resizedBlob: Blob | null) => {
          if (resizedBlob) {
            resolve(resizedBlob);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  }


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

  // RECUPERO IL TITOLO PER SALVARE LA FOTO NEL SERVER
  const getPhotoFromDB = async (title: string) => {
    // Apri il database
    const db = await photoGalleryDBPromise;

    // Apri una transazione di lettura
    const tx = db.transaction('photos', 'readonly');

    // Ottieni lo store per le foto
    const store = tx.objectStore('photos');

    // Recupera tutte le foto
    const allPhotos = await store.getAll();

    // Filtra l'array per il titolo specifico
    const desiredPhoto = allPhotos.find(photo => photo.title === title);

    // Chiudi la transazione
    await tx.done;

    return desiredPhoto;
  };



  const getCurrentPosition = async () => {
    const options = {
      enableHighAccuracy: true, // Accuratezza del (GPS)
    };
    const coordinates = await Geolocation.getCurrentPosition(options);
    return coordinates;
  };

  const accuracy = ref<string | number>('N/A');

  const takePhoto = async () => {
    //const stopMonitoringAccuracy = startAccuracyMonitoring();
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 30,
    });

    // Prendere le cordinate dalla funzione getCurrrentPosition()
    const coordinates = await getCurrentPosition();

    const accuracy = coordinates?.coords?.accuracy || 'N/A';

    //crea un nome univoco per il file della foto
    const imageTitle = `img_${new Date().toISOString().replace(/:/g, "_")}`;
    const savedFileImage = await savePicture(photo, imageTitle, coordinates);

    //stopMonitoringAccuracy();

    await checkPermissions();
    await requestPermissions();
    await scheduleLocalNotification(imageTitle, accuracy);

    //aggiunge l'oggetto savedFileImage all'array photos
    photos.value = [savedFileImage, ...photos.value];

    return savedFileImage;
  };

  const getCurrentHourFolderPath = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
  
    return `${year}_${month}_${day}_${hour}`;
  };
  
  const createDirectoryIfNotExists = async (directory: Directory, path: string) => {
    try {
      await Filesystem.stat({ directory, path });
    } catch (e) {
      await Filesystem.mkdir({ directory, path, recursive: true });
    }
  };

  const savePicture = async (photo: Photo, title: string, coordinates: any): Promise<UserPhoto> => {
    // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    // Resize the image blob
    const resizedBlob = await resizeImage(blob);

    // Convert the resized blob to base64
    const base64Data = (await blobToBase64(resizedBlob)) as string;

    localStorage.setItem('base64Data', base64Data);

    const hourFolderPath = getCurrentHourFolderPath();
    const photosFolderPath = `Pictures/${hourFolderPath}`;
    const photoFileName = `${title}.jpg`;

    await createDirectoryIfNotExists(Directory.Documents, photosFolderPath);

    if (photo.path) {
        const originalFile = await Filesystem.readFile({ path: photo.path });

        await Filesystem.writeFile({
            path: `${photosFolderPath}/${photoFileName}`,
            data: originalFile.data,
            directory: Directory.Documents,
            recursive: true
        });
    } else {
        console.error("Percorso della foto non trovato");
    }
    
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
    getPhotoFromDB,
    blobToBase64,
    //lowestAccuracy,
  };
};

interface Coordinates {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
  };
}


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
  // Coordinate
  coordinates?: Coordinates;
}