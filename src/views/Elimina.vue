<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="main-container ion-text-center">
        <h1>Elimina dati da telefono</h1>
      </div>
      <ion-button @click="onUserAction">Elimina caditoie</ion-button>

      <div v-if="!networkStatus" class="no-connection-message">
        La funzione si abilita solamente con una connessione stabile.
      </div>
      <div v-if="showAlert" class="success-alert">
        Le caditoie sono state eliminate con successo dal dispositivo e il
        gestionale è stato aggiornato.
      </div>
      <ion-loading
        class="loading-backdrop"
        v-if="isLoading"
        :isOpen="true"
        message="Eliminazione..."
      ></ion-loading>
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
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "vue-router";
import { Filesystem, Directory } from "@capacitor/filesystem";

const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();
const store = useStore();
const router = useRouter();
const deletable = ref([]);
const showAlert = ref(false);
const allOperationsSuccessful = ref(false);


const showSuccessAlert = () => {
  showAlert.value = true;
  setTimeout(() => {
    showAlert.value = false;
  }, 5000); // Nasconde l'alert dopo 5 secondi
};

const onUserAction = async () => {
  console.log("Inizio onUserAction");
  try {
    await fetchDeletable();
  } catch (error) {
    console.error("Errore durante l'azione dell'utente", error);
  }
  console.log("Fine onUserAction");
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
  }
};
// Funzione che esegue il processo di eliminazione per ogni item
const processDeletableItems = async () => {
    console.log("Inizio processDeletableItems");

  allOperationsSuccessful.value = true;
  const deletableItems = deletable.value;
  for (let i = 0; i < deletableItems.length; i++) {
    const id = deletableItems[i];
    try {
      await deleteItemFile(id);
      console.log(`Item con ID: ${id} eliminato con successo.`);
    } catch (error) {
      console.error(
        `Errore durante l'eliminazione dell'item con ID: ${id}`,
        error
      );
      allOperationsSuccessful.value = false;
      break;
    }

    // Attendere 200 millisecondi prima della prossima iterazione
    if (i < deletableItems.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  if (allOperationsSuccessful.value) {
    console.log('ORA');
    showSuccessAlert();
  }
    console.log("Fine processDeletableItems");

};

// estrae la data dall'id_da_app
function extractDateFromId(id: any) {
  const timestamp = id.split("_")[0];
  const date = new Date(parseInt(timestamp));
  return formatDate(date);
}
// formatta la data per trovare il nome della cartella
function formatDate(date: any) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  return `${year}_${month}_${day}_${hour}`;
}
//CHIAMATA PER CERCARE IL FILE DETRO LA CARTELLA ED ELIMINARLO (in caso eliminando pure la cartella)
async function deleteItemFile(id: any) {
  const folderName = extractDateFromId(id);
  console.log("Inizio deleteItemFile - folderName:", folderName);
  const fileName = `${id}.json`;
  console.log("fileName:", fileName);

  try {
    console.log("Tentativo di lettura directory...");

    // Controlla l'esistenza della cartella
    const directory = await Filesystem.readdir({
      path: `items/${folderName}`,
      directory: Directory.Documents,
    });
    console.log("Contenuto della directory:", directory);

    // Assicurati che directory.files sia un array di stringhe
    if (Array.isArray(directory.files)) {
      console.log(
        "directory.files è un array, procedo con la verifica del file"
      );

      // Utilizza 'some' per verificare se il file esiste nella cartella
      const fileExists = directory.files.some((file) => file.name === fileName);
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
        console.log("Contenuto aggiornato della directory:", updatedDirectory);

        // Se la cartella è vuota, elimina anche la cartella
        if (updatedDirectory.files.length === 0) {
          console.log(
            `Cartella ${folderName} vuota, procedo con l'eliminazione`
          );
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
      console.log("directory.files non è un array, impossibile procedere.");
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
      "https://rainwaterdrains.inyourlife.com/api/delete_caditoie_id",
      {
        data: {
          caditoia_id: id,
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
    console.log("Elemento segnato come eliminato:", id);
  } catch (error) {
    console.error("Errore durante la segnalazione dell'eliminazione:", error);
  }
}
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

ion-icon {
  color: white;
  padding-left: 0.2rem;
  font-weight: bolder;
}

ion-button {
  width: 100%;
  --border-radius: 25px;
  margin-top: 20px;
  --background: #a60016;
  font-weight: bolder;
}

.loading-backdrop {
  backdrop-filter: blur(5px);
}

.no-connection-message {
  color: white;
  text-align: center;
  padding: 10px;
}

.success-alert {
  color: white;
  text-align: center;
  padding: 10px;
  background-color: #4caf50;
  margin-top: 20px;
  border-radius: 10px;
}
</style>
