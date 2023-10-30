<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>Il tuo luogo:</h1>
        <h4>
          {{ cityName }} ({{ cityDistrict }})
          <br />
          {{ streetName }}
        </h4>
      </div>
      <div class="sub-container">
        <div class="grid-container">
          <div class="camera-box">
            <ion-fab>
              <ion-fab-button @click="handlePhoto()">
                <ion-icon class="icon-tag" :icon="camera"></ion-icon>
              </ion-fab-button>
            </ion-fab>
            <div class="text">Scatta Foto</div>
          </div>
          <div class="return-to-via">
            <ion-fab>
              <router-link to="/sceltaLuogo">
                <ion-fab-button>
                  <ion-icon
                    class="icon-tag"
                    :icon="arrowUndoOutline"
                  ></ion-icon>
                </ion-fab-button>
              </router-link>
            </ion-fab>
            <div class="text">Cambia Via</div>
          </div>
        </div>
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
  IonFab,
  IonFabButton,
} from "@ionic/vue";
import { arrowRedoCircleSharp, arrowUndoOutline } from "ionicons/icons";
import { useRouter } from "vue-router";
import { camera } from "ionicons/icons";
import {
  usePhotoGallery,
  UserPhoto,
  uploadPhotoToServer,
} from "@/composables/usePhotoGallery";
import { useStore } from "vuex";
import { useNetwork } from "@/composables/useNetwork";
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { getCitiesFromDB } from "@/services/db_cities.js";
import {
  getAllStreetsFromDB,
  getUnsynchronizedStreetsFromDB,
  saveStreetsToDB,
} from "@/services/db_streets.js";
import { getItemsFromDB, deleteItemFromDB } from "@/services/db_items.js";
import { deleteDB } from "idb";

const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();
const router = useRouter();
const store = useStore();
const props = defineProps({
  selectedCityName: String,
  selectedStreetName: String,
});
const { photos, takePhoto, accuracy, getPhotoFromDB, blobToBase64 } =
  usePhotoGallery();
const cities = ref([]);
const streets = ref([]);
const cityName = ref("");
const cityDistrict = ref("");
const streetName = ref("");
console.log("Nome Comune:", localStorage.getItem("city"));
console.log(
  "Nome Strada:",
  localStorage.getItem("street") || localStorage.getItem("addStreet")
);

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

const handlePhoto = async () => {
  const photo: UserPhoto = await takePhoto();
  if (photo) {
    // Conferma foto scattata
    localStorage.setItem("photoTimestamp", Date.now().toString());
    localStorage.setItem("photoTitle", photo.title ? photo.title : "N/A");
    localStorage.setItem(
      "photoAltitude",
      photo.coordinates?.coords?.altitude?.toString() || "N/A"
    );
    localStorage.setItem(
      "photoLatitude",
      photo.coordinates?.coords?.latitude?.toString() || "N/A"
    );
    localStorage.setItem(
      "photoLongitude",
      photo.coordinates?.coords?.longitude?.toString() || "N/A"
    );
    localStorage.setItem(
      "photoAccuracy",
      photo.coordinates?.coords?.accuracy?.toString() || "N/A"
    );
    localStorage.setItem("photoPath", photo.filepath.toString() || "N/A");

    /*
      if(networkStatus.value) {
        console.log(networkStatus);
        const base64Data = localStorage.getItem('base64Data');
        await uploadPhotoToServer(base64Data);
      }
*/
    console.log("va avanti");
    // Navigare alla rotta successiva dopo aver confermato la foto
    router.push("/fotoMap");
  }
};

const fetchCity = async () => {
  const storedCityId = localStorage.getItem("city");
  try {
    const apiToken = store.getters.getApiToken;
    console.log(apiToken);
    const response = await axios.get(
      "https://rainwaterdrains.inyourlife.com/api/cities",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    cities.value = response.data.data;

    console.log("LE CITTA CHE MI PIGLIO IN IL TUO LUOGO", cities.value);

    const selectedCity = cities.value.find(
      ({ comune_id }) => comune_id == storedCityId
    );

    console.log("CITTA SELEZIONATA = ", selectedCity);

    if (selectedCity) {
      cityName.value = selectedCity.comune_nome;
      cityDistrict.value = selectedCity.provincia_id;

      console.log("Questo è il nome della citta:", cityName.value);
      console.log("Questo è il nome del district:", cityDistrict.value);
    }
  } catch (error) {
    console.error("Errore durante il recupero delle città:", error);

    cities.value = await getCitiesFromDB();

    const selectedCity = cities.value.find(
      ({ comune_id }) => comune_id == storedCityId
    );
    if (selectedCity) {
      cityName.value = selectedCity.comune_nome;
      cityDistrict.value = selectedCity.provincia_id;
    }
  }
};

const fetchStreet = async () => {
  const storedStreetId =
    localStorage.getItem("street") || localStorage.getItem("addStreet");
  try {
    const apiToken = store.getters.getApiToken;
    console.log(apiToken);
    const response = await axios.get(
      "https://rainwaterdrains.inyourlife.com/api/streets",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    const streets = response.data.data;

    console.log("LE VIE CHE MI PIGLIO", streets);

    const selectedStreet = streets.find(({ id }) => id == storedStreetId);

    console.log("VIA SELEZIONATA = ", selectedStreet);

    if (selectedStreet) {
      streetName.value = selectedStreet.name;
      console.log("Questo è il nome della via:", streetName.value);
    } else {
      // Se non è stata trovata una strada dalla richiesta iniziale, cerca in IndexedDB
      streets.value = await getAllStreetsFromDB();
      const dbSelectedStreet = streets.value.find(
        ({ id }) => id == storedStreetId
      );

      if (dbSelectedStreet) {
        streetName.value = dbSelectedStreet.name;
        console.log("Strada trovata nell'IndexedDB:", streetName.value);
      } else {
        console.error(
          "Strada non trovata né nella richiesta API né nell'IndexedDB"
        );
      }
    }
  } catch (error) {
    console.error("Errore durante il recupero delle vie:", error);

    streets.value = await getAllStreetsFromDB();
    const selectedStreet = streets.value.find(({ id }) => id == storedStreetId);
    if (selectedStreet) {
      streetName.value = selectedStreet.name;
    }
  }
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
async function deleteLocalDB() {
  console.log("Inizio deleteLocalDB");
  await deleteDB("rwd_streets");
}

const synchronizeItemsWithServer = async () => {
  const unsynchronizedItems = await getItemsFromDB();
  console.log("Items NON SINCRONIZZTi", unsynchronizedItems);
  for (const item of unsynchronizedItems) {
    console.log(item);
    const picTitle = item.pic;
    const parts = picTitle.split(".");
    parts.pop();
    const baseName = parts.join(".");
    console.log(baseName); // Stampa: img_2023-10-30T14_35_27.012Z
    const photo = await getPhotoFromDB(baseName);
    console.log(photo);
    if (!photo || !photo.base64Data) {
      console.error("Photo non trovata in indexedDB");
      return;
    }
    const base64ImageString = await blobToBase64(photo.base64Data);
    try {
      const apiToken = store.getters.getApiToken;
      const responsePhoto = await uploadPhotoToServer(base64ImageString);
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
  }
};

onMounted(async () => {
  fetchCity();
  fetchStreet();

  await logCurrentNetworkStatus();
  if (networkStatus.value) {
    await synchronizeStreetsWithServer();
  }
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
  display: flex;
  justify-content: center;
  align-items: center;
}

ion-label {
  font-size: 14px;
  font-weight: lighter;
}

ion-select {
  margin-top: 20px;
  background-color: rgb(255, 255, 254);
  color: black;
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

ion-fab-button::part(native) {
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3),
    0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  color: black;
}

ion-fab-button::part(native):hover::after {
  background-color: #cdcdcd;
}

ion-fab-button::part(native):active::after {
  background-color: #cdcdcd;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 80px;
  margin: 0 auto;
}

.camera-box,
.return-to-via {
  display: flex;
  align-items: center;
}

.text {
  margin-left: 80px;
}

.procedi-container {
  display: flex;
  justify-content: center;
}

.router-a {
  width: 90%;
}

.accuracy {
  color: white;
  padding: 20px;
  margin-top: 2rem;
}

.icon-tag {
  color: black;
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
</style>
