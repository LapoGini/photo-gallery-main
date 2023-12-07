<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="main-container ion-text-center">
        <h1>SCELTA CLIENTE</h1>
      </div>
      <div class="sub-container ion-margin">
        <ion-item lines="none">
          <ion-select
            v-model="selectedClient"
            interface="popover"
            placeholder="Seleziona un cliente"
          >
            <ion-select-option
              v-for="client in clients"
              :key="client.id"
              :value="client.id"
            >
              {{ client.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button @click="onUserAction">Carica Dati</ion-button>

        <ion-button
          expand="block"
          :disabled="
            !permissionsGranted ||
            (selectedClient ? selectedClient.value === null : true)
          "
          @click="proceedToNextRoute"
          class="ion-margin-top"
        >
          PROCEDI
          <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
        </ion-button>
      </div>
    </ion-content>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonLabel,
} from "@ionic/vue";
import { arrowRedoCircleSharp } from "ionicons/icons";
import { useNetwork } from "@/composables/useNetwork";
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { useStore } from "vuex";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Camera, CameraResultType } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "vue-router";
import { saveClientsToDB, getClientsFromDB } from "@/services/db_clients.js";
import { saveCitiesToDB, getCitiesFromDB } from "@/services/db_cities.js";
import { saveStreetsToDB, getStreetsFromDB } from "@/services/db_streets.js";
import { saveTagsToDB, getTagsFromDB } from "@/services/db_tags.js";
import { Filesystem, Directory } from "@capacitor/filesystem";

const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();
const store = useStore();
const router = useRouter();
const clients = ref([]);
const cities = ref([]);
const streets = ref([]);
const tags = ref([]);
const deletable = ref([]);
const selectedClient = ref(null);
const permissionsGranted = ref(false);

const proceedToNextRoute = () => {
  if (permissionsGranted.value) {
    router.push("/sceltaLuogo");
  }
};

const requestNotificationsPermissions = async (): Promise<boolean> => {
  try {
    const notificationsPermission = await LocalNotifications.checkPermissions();
    if (notificationsPermission.display !== "granted") {
      const response = await LocalNotifications.requestPermissions();
      if (response.display !== "granted") {
        console.warn("Permessi per le notifiche non concessi.");
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Errore durante la gestione delle notifiche:", error);
    return false;
  }
};

const requestCameraPermissions = async () => {
  try {
    const cameraPermission = await Camera.checkPermissions();
    if (cameraPermission.camera !== "granted") {
      const { camera } = await Camera.requestPermissions();
      if (camera !== "granted") {
        console.warn("Permessi per le notifiche non concessi.");
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Errore durante la gestione della fotocamera:", error);
    return false;
  }
};

const requestLocationPermissions = async () => {
  try {
    const locationPermission = await Geolocation.checkPermissions();
    if (locationPermission.location !== "granted") {
      const { location } = await Geolocation.requestPermissions();
      if (location !== "granted") {
        console.warn("Permessi per le notifiche non concessi.");
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Errore durante la gestione della posizione:", error);
    return false;
  }
};

const requestFilesystemPermissions = async () => {
  try {
    const filesystemPermission = await Filesystem.checkPermissions();
    console.log("filesystemPermission", filesystemPermission);
    if (filesystemPermission.publicStorage !== "granted") {
      const requestedPermission = await Filesystem.requestPermissions();
      if (requestedPermission.publicStorage !== "granted") {
        console.warn("Permessi per il filesystem non concessi.");
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Errore durante la gestione del filesystem:", error);
    return false;
  }
};

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

watch(selectedClient, (newValue) => {
  console.log("Cliente selezionato:", newValue);
});

const fetchClients = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get(
      "https://rainwaterdrains.inyourlife.com/api/users/Cliente",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    clients.value = response.data.data;
    await saveClientsToDB(clients.value);
    console.log("Clienti:", clients.value);
  } catch (error) {
    console.error("Errore durante il recupero dei clienti:", error);
    clients.value = await getClientsFromDB();
  }
};

const fetchCities = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get(
      "https://rainwaterdrains.inyourlife.com/api/cities",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    cities.value = response.data.data;
    await saveCitiesToDB(cities.value);
    console.log("Cities:", cities.value);
  } catch (error) {
    console.error("Errore durante il recupero delle città:", error);
  }
};

const fetchStreets = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get(
      "https://rainwaterdrains.inyourlife.com/api/allStreets",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    streets.value = response.data.data;
    await saveStreetsToDB(streets.value);
    console.log("Streets:", streets.value);
  } catch (error) {
    console.error("Errore durante il recupero delle strade:", error);
  }
};

const fetchTags = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get(
      "https://rainwaterdrains.inyourlife.com/api/tags/item",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    tags.value = response.data.data;
    await saveTagsToDB(tags.value);
    console.log("Tags:", tags.value);
  } catch (error) {
    console.error("Errore durante il recupero dei tag:", error);
  }
};

// CHIAMATA PER PRENDERE VEDERE QUALI ITEMS SONO CANCELLABILI
const fetchDeletable = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.post(
      "https://rainwaterdrains.inyourlife.com/api/delete_caditoie",
      {
        data: {
          id_user: localStorage.getItem("user"),
          iduserhash: localStorage.getItem("apiToken"),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    deletable.value = response.data.cancellabili;
    console.log("deletable", deletable.value);
    
    await processDeletableItems();
  } catch (error) {
    console.error("Errore durante il recupero dei dati:", error);
    // Gestisci l'errore
  }
};
// Funzione che esegue il processo di eliminazione per ogni item
const processDeletableItems = async () => {
  for (let id of deletable.value) {
    try {
      await deleteItemFile(id);
      console.log(`Item con ID: ${id} eliminato con successo.`);
    } catch (error) {
      console.error(`Errore durante l'eliminazione dell'item con ID: ${id}`, error);
    }
  }
};
// estrae la data dall'id_da_app
function extractDateFromId(id: any) {
  const timestamp = id.split('_')[0];
  const date = new Date(parseInt(timestamp));
  return formatDate(date);
}
// formatta la data per trovare il nome della cartella
function formatDate(date: any) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  return `${year}_${month}_${day}_${hour}`;
}
//CHIAMATA PER CERCARE IL FILE DETRO LA CARTELLA ED ELIMINARLO (in caso eliminando pure la cartella)
async function deleteItemFile(id: any) {
  const folderName = extractDateFromId(id);
  console.log('Inizio deleteItemFile - folderName:', folderName);
  const fileName = `${id}.json`;
  console.log('fileName:', fileName);

  try {
    console.log('Tentativo di lettura directory...');

    // Controlla l'esistenza della cartella
    const directory = await Filesystem.readdir({
      path: `items/${folderName}`,
      directory: Directory.Documents,
    });
    console.log('Contenuto della directory:', directory);

    // Assicurati che directory.files sia un array di stringhe
    if (Array.isArray(directory.files)) {
      console.log('directory.files è un array, procedo con la verifica del file');

      // Utilizza 'some' per verificare se il file esiste nella cartella
      const fileExists = directory.files.some(file => file.name === fileName);
      if (fileExists) {
        console.log(`Trovato il file ${fileName}, procedo con l'eliminazione`);

        // Elimina il file
        await Filesystem.deleteFile({
          path: `items/${folderName}/${fileName}`,
          directory: Directory.Documents,
        });
        console.log(`File ${fileName} eliminato con successo.`);

        // Ricontrolla la cartella
        const updatedDirectory = await Filesystem.readdir({
          path: `items/${folderName}`,
          directory: Directory.Documents,
        });
        console.log('Contenuto aggiornato della directory:', updatedDirectory);

        // Se la cartella è vuota, elimina anche la cartella
        if (updatedDirectory.files.length === 0) {
          console.log(`Cartella ${folderName} vuota, procedo con l'eliminazione`);
          await Filesystem.rmdir({
            path: `items/${folderName}`,
            directory: Directory.Documents,
          });
          console.log(`Cartella ${folderName} eliminata con successo.`);
        }
      } else {
        console.log(`Il file ${fileName} non esiste nella cartella.`);
      }
    } else {
      console.log('directory.files non è un array, impossibile procedere.');
    }

    // Chiamata API per segnalare l'eliminazione
    console.log(`Segnalazione dell'eliminazione dell'elemento con ID: ${id}`);
    await markItemAsDeleted(id);
    console.log(`Elemento con ID: ${id} segnalato come eliminato.`);
  } catch (error) {
    console.error("Errore durante l'eliminazione del file:", error);
    console.error("StackTrace:", error.stack);
  }
}

// CHIAMATA API PER ELIMINARE METTERE (delated_at) LA CADITOIA ELIMINATA
async function markItemAsDeleted(id: any) {
  try {
    const apiToken = store.getters.getApiToken;
    await axios.post(
      'https://rainwaterdrains.inyourlife.com/api/delete_caditoie_id',
      {
        data: {
          caditoia_id: id,
          id_user: localStorage.getItem("user"),
          iduserhash: localStorage.getItem("apiToken"),
        }
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    console.log("Elemento segnato come eliminato:", id);
  } catch (error) {
    console.error("Errore durante la segnalazione dell'eliminazione:", error);
  }
}


const onUserAction = async () => {
  const apiResponse = await fetchDeletable();
  console.log("apiResponse", apiResponse);
};

onMounted(async () => {
  console.log("CLIENTE SELEZIONATO", selectedClient.value === null);
  const notificationsPermission = await requestNotificationsPermissions();
  const cameraPermission = await requestCameraPermissions();
  const locationPermission = await requestLocationPermissions();
  const filesystemPermission = await requestFilesystemPermissions();
  console.log("filesystemPermission", filesystemPermission);
  // Se tutti i permessi sono stati concessi, imposto permissionsGranted su true
  if (
    notificationsPermission &&
    cameraPermission &&
    locationPermission &&
    filesystemPermission
  ) {
    permissionsGranted.value = true;
    console.log("PERMESSO", permissionsGranted);
  }
  await logCurrentNetworkStatus();

  sessionStorage.clear();

  await Promise.all([
    fetchClients(),
    fetchCities(),
    fetchStreets(),
    fetchTags(),
  ]);
});

document.addEventListener("ionFocus", (event) => {
  // Usiamo un'asserzione di tipo qui
  const target = event.target as HTMLElement;

  // Assicuriamoci che l'evento provenga da un ion-select
  if (target && target.tagName.toLowerCase() === "ion-select") {
    // Tentativo di accedere al shadow DOM
    const shadowRoot = (target as any).shadowRoot;
    if (shadowRoot) {
      // Trova l'etichetta all'interno del shadow DOM e modifica lo stile
      const label = shadowRoot.querySelector("label");
      if (label) {
        label.style.backgroundColor = "red"; // O qualsiasi altro colore desiderato
      }
    }
  }
});
</script>


<style scoped>
ion-content {
  --background: #370006;
}

.main-container {
  background-color: #a60016;
  border: 3px solid white;
  width: 100%;
  padding: 20px;
  text-align: center;
  color: white;
  font-weight: bolder;
}

h1 {
  font-weight: bold;
}

.sub-container {
  width: 90%;
  margin: auto;
  margin-top: 50px;
  color: white;
}

ion-item {
  border-radius: 10px;
}

ion-label {
  display: none; /* Rimuove la label */
}

ion-select {
  width: 100%; /* Imposta la larghezza al 100% del genitore */
  margin-left: auto; /* Imposta il margine sinistro automatico */
  margin-right: auto; /* Imposta il margine destro automatico */
  color: black;
  padding-left: 8px; /* Aggiunge un padding a sinistra */
  padding-right: 8px; /* Aggiunge un padding a destra */
  border: 3px solid white;
}

ion-button {
  width: 100%;
  --border-radius: 25px;
  margin-top: 20px;
  --background: #a60016;
  font-weight: bolder;
  font-size: 16px; /* Aumenta la dimensione del testo del pulsante */
}

ion-select::part(icon) {
  position: absolute !important;
  right: 16px !important; /* Regola la posizione a destra */
  top: 50% !important;
  transform: translateY(-50%) !important;
}
</style>
