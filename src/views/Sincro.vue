<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>Da sincronizzare</h1>
      </div>
      <div class="sincro-caditoie">
        <h5>Caditoie da sincronizzare: {{ caditoieCount }}</h5>
      </div>
      <ion-button @click="synchronizeStreetsWithServer()">
        SINCRONIZZA CADITOIE
        <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
      </ion-button>
      <ion-loading
        class="custom-loading"
        v-if="isLoading"
        :isOpen="true"
        message="Synchronizing..."
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
  IonLoading,
} from "@ionic/vue";
import { arrowRedoCircleSharp } from "ionicons/icons";
import { useRouter } from "vue-router";
import { onMounted, ref, watch, defineComponent } from "vue";
import {
  countItemsInDB,
  getItemsFromDB,
  deleteItemFromDB,
} from "@/services/db_items.js";
import {
  usePhotoGallery,
  UserPhoto,
  uploadPhotoToServer,
} from "@/composables/usePhotoGallery";
import {
  getUnsynchronizedStreetsFromDB,
  saveStreetsToDB,
} from "@/services/db_streets.js";
import { useNetwork } from "@/composables/useNetwork";
import { useStore } from "vuex";
import axios from "axios";
import { deleteDB } from "idb";

const caditoieCount = ref(0);
const isLoading = ref(false);
const store = useStore();
const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();
const { getPhotoFromDB, blobToBase64 } = usePhotoGallery();
const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};
const loadCaditoieCount = async () => {
  caditoieCount.value = await countItemsInDB();
};

const fetchAllStreets = async () => {
  console.log("Inizio fetchAllStreets");
  try {
    const apiToken = store.getters.getApiToken;
    console.log(apiToken);
    const response = await axios.get(
      "https://rainwaterdrains.inyourlife.com/api/allStreets",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    if (response.data) {
      console.log(response.data);
      await saveStreetsToDB(response.data.data);
    }
  } catch (error) {
    console.error("Errore durante il recupero delle vie:", error);
  }
};
const deleteLocalDB = async () => {
  console.log("Inizio deleteLocalDB");
  try {
    await deleteDB("rwd_streets", {
      blocked: () => {
        console.warn(
          "Database deletion is blocked. Retrying in 3 seconds..."
        );
        setTimeout(deleteLocalDB, 3000);
      },
    });
  } catch (error) {
    console.error("Errore durante l'eliminazione del DB:", error);
  }
}

const synchronizeItemsWithServer = async () => {
  const unsynchronizedItems = await getItemsFromDB();
  console.log("Items NON SINCRONIZZTi", unsynchronizedItems);
  for (const item of unsynchronizedItems) {
    console.log("ITEM", item);
    const picTitle = item.pic;
    const parts = picTitle.split(".");
    parts.pop();
    const baseName = parts.join(".");
    console.log("basename", baseName);
    const photo = await getPhotoFromDB(baseName);
    console.log(photo);
    if (!photo || !photo.base64Data) {
      console.error("Photo non trovata in indexedDB");
      return;
    }
    const base64ImageString = await blobToBase64(photo.base64Data);
    try {
      const apiToken = store.getters.getApiToken;
      const responsePhoto = await uploadPhotoToServer(
        base64ImageString,
        item.pic
      );
      const response = await axios.post(
        "https://rainwaterdrains.inyourlife.com/api/item",
        item,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        }
      );
      //se l'item è stato aggiunto con successo, eliminare l'item dall'indexedDB
      if (response.data) {
        console.log(
          "responde data degli items:",
          response.data.success.id_da_app
        );
        // eliminare l'item da locale
        await deleteItemFromDB(response.data.success.id_da_app);
      }
    } catch (error) {
      console.error("Errore durante la sincronizzazione:", error);
    }
  }
};

const synchronizeStreetsWithServer = async () => {
  isLoading.value = true;
  console.log(isLoading.value);
  const unsynchronizedStreets = await getUnsynchronizedStreetsFromDB();
  console.log("Vie NON SINCRONIZZTE", unsynchronizedStreets);
  for (const street of unsynchronizedStreets) {
    console.log(street);
    try {
      const apiToken = store.getters.getApiToken;
      const response = await axios.post(
        "https://rainwaterdrains.inyourlife.com/api/aggiungiVia",
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
          id: street.id,
          name: street.name,
          city_id: street.city_id,
        }
      );
      // Se la strada è stata aggiunta con successo al DB, aggiornala come sincronizzata in IndexedDB
      if (response.data.idNew) {
        //await markStreetAsSynchronized(street.id, response.data.idNew);
        console.log("STRADA SINCRONIZZATA CORRETTAMENTE", response.data.idNew);
      }
    } catch (error) {
      console.error("Errore durante la sincronizzazione:", error);
    }
  }
  console.log("FINE DEL CICLO");
  try {
    await deleteLocalDB();
    console.log("ELIMINATE LE STRADE DALL'INDEXEDDB");
  } catch (error) {
    console.error("Errore in deleteLocalDB:", error);
  }

  try {
    await fetchAllStreets();
    console.log("RIMESSE LE STRADE NALL'INDEXEDDB");
  } catch (error) {
    console.error("Errore in fetchAllStreets:", error);
  }

  try {
    await synchronizeItemsWithServer();
    console.log("Items sincronizzati");
  } catch (error) {
    console.error("Errore in synchronizeItemsWithServer:", error);
  } finally {
    isLoading.value = false;
    window.location.reload();
  }
};

/*
watch(caditoieCount, (newValue, oldValue) => {
  console.log("Caditoie da sincronizzare:", newValue);
  loadCaditoieCount();
});
*/

onMounted(async () => {
  loadCaditoieCount();
});
</script>


<style scoped>
ion-content {
  --background: #370006;
}

.main-container {
  background-color: #a60016;
  border-top: 3px solid rgb(255, 255, 255);
  border-bottom: 3px solid rgb(255, 255, 255);
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

.toast-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.sincro-caditoie {
  color: white;
}

ion-loading.custom-loading {
  --background: #a6001689;
  --spinner-color: #ffffff;
  color: #ffffff;
}
</style>
