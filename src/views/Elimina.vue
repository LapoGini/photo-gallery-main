<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="main-container ion-text-center">
        <h1>Elimina dati da telefono</h1>
      </div>
      <ion-button @click="onUserAction">
        Elimina caditoie<i class="fa-regular fa-trash-can icon-trash"></i>
      </ion-button>

      <div v-if="!networkStatus" class="no-connection-message">
        La funzione si abilita solamente con una connessione stabile.
      </div>
      <div v-if="showAlert" class="success-alert">
        <span
          >Le {{ deletedItemCount }} caditoie sono state eliminate con successo
          dal dispositivo e il gestionale è stato aggiornato.</span
        >
      </div>
      <div v-if="showAlertNotFound" class="not-found-alert">
        <span
          >{{ notFoundItemCount }} caditoie non trovate e non eliminate.</span
        >
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
import { nextTick } from "vue";

const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();
const store = useStore();
const router = useRouter();
const deletable = ref([]);
const showAlert = ref(false);
const showAlertNotFound = ref(false);
const allOperationsSuccessful = ref(false);
const isLoading = ref(false);
const deletedItemCount = ref(0);
const notFoundItemCount = ref(0);

const showSuccessAlert = () => {
  showAlert.value = true;
  setTimeout(() => {
    showAlert.value = false;
  }, 5000);
};

const showNotFoundAlert = () => {
  showAlertNotFound.value = true;
  setTimeout(() => {
    showAlertNotFound.value = false;
  }, 5000);
};

const onUserAction = async () => {
  console.log("Inizio onUserAction");
  isLoading.value = true;
  await nextTick();
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
  deletedItemCount.value = 0;
  notFoundItemCount.value = 0;
  allOperationsSuccessful.value = true;
  const deletableItems = deletable.value;
  for (let i = 0; i < deletableItems.length; i++) {
    const id = deletableItems[i];
    try {
      await deleteItemFile(id);
      deletedItemCount.value++;
      console.log(`Item con ID: ${id} eliminato con successo.`);
    } catch (error) {
      console.error(
        `Errore durante l'eliminazione dell'item con ID: ${id}`,
        error
      );
      allOperationsSuccessful.value = false;
    }

    // Attendere 200 millisecondi prima della prossima iterazione
    if (i < deletableItems.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  if (allOperationsSuccessful.value && notFoundItemCount.value === 0) {
    console.log("ORA");
    showSuccessAlert();
  } else if (notFoundItemCount.value > 0) {
    console.log('ci entra????????????????????????????????????????????????????????????????');
    showNotFoundAlert();
  }
  console.log('notFoundItemCount.value', notFoundItemCount.value);
  isLoading.value = false;
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
        notFoundItemCount.value++;
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
    notFoundItemCount.value++;
  }
}

// CHIAMATA API PER ELIMINARE METTERE (delated_at) LA CADITOIA ELIMINATA
async function markItemAsDeleted(id: any): Promise<void> {
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
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers["retry-after"]
        ? parseInt(error.response.headers["retry-after"])
        : 1000;
      console.error("Errore 429, attendere e ritentare...");
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      return markItemAsDeleted(id);
    } else {
      console.error("Errore durante la segnalazione dell'eliminazione:", error);
      throw error;
    }
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
  border-radius: 5px;
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
  --border-width: 1px;
  --border-color: white;
  --border-style: solid;
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

.success-alert, .not-found-alert{
  color: white;
  text-align: center;
  padding: 20px;
  margin-top: 20px;
  border-radius: 15px;
  font-size: 1.1rem; /* Aumenta la dimensione del testo */
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Aggiungi ombra */
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.5s;   /* Animazione di comparsa */
}

.success-alert {
  background: linear-gradient(45deg, #43a047, #66bb6a); /* Sfondo gradient */
}

.not-found-alert{
  background: linear-gradient(45deg, #b80019, #a60016); /* Sfondo gradient */
}

/* Animazione fadeIn */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.icon-trash {
  padding-left: 0.5rem;
}
</style>
