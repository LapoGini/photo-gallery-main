<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="main-container ion-text-center">
        <h1>IL TUO LUOGO</h1>
        <h4 class="location-details">
          {{ cityName }} ({{ cityDistrict }})
          <br />
          {{ streetName }}
        </h4>
      </div>
      <div class="sub-container ion-margin">
        <div class="grid-container">
          <div class="camera-box" @click="handlePhoto()">
            <ion-fab>
              <ion-fab-button class="camera-button">
                <i class="fa-solid fa-camera"></i>
              </ion-fab-button>
            </ion-fab>
            <div class="text">Scatta Foto</div>
          </div>
          <div class="return-to-via" @click="goToIlTuoLuogo">
            <ion-fab>
              <router-link>
                <ion-fab-button class="return-button">
                  <i class="fa-regular fa-share-from-square fa-flip-horizontal"></i>
                </ion-fab-button>
              </router-link>
            </ion-fab>
            <div class="text">Cambia Via</div>
          </div>
        </div>
      </div>
    </ion-content>
    <div v-if="isLoading" class="loading-overlay">
      Salvataggio immagine in corso...
    </div>
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
import { useRouter } from "vue-router";
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
const isLoading = ref(false);

const showLoading = () => {
  isLoading.value = true;
};

const hideLoading = () => {
  isLoading.value = false;
};

console.log("Nome Comune:", localStorage.getItem("city"));
console.log(
  "Nome Strada:",
  localStorage.getItem("street") || localStorage.getItem("addStreet")
);

const goToIlTuoLuogo = () => {
  router.push("/sceltaLuogo");
};

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

const handlePhoto = async () => {
  const loadingTimeout = setTimeout(showLoading, 1000);
  const photo = await takePhoto();
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

    console.log("va avanti");
    clearTimeout(loadingTimeout);

    hideLoading();
    // Naviga immediatamente alla pagina /specifiche
    router.push("/specifiche");
  } else {
    clearTimeout(loadingTimeout);

    hideLoading();
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

onMounted(async () => {
  fetchCity();
  fetchStreet();

  await logCurrentNetworkStatus();
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
  border-radius: 5px;
}

h1 {
  font-weight: bold;
}

.location-details {
  margin-top: 10px;
  font-size: 18px; /* Dimensione dei dettagli sulla posizione */
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 20px; /* Spazio tra le due colonne */
  margin-top: 20px;
}

.camera-box,
.return-to-via {
  background-color: #f4f4f4; /* Sfondo delle caselle */
  border: 1px solid #ddd; /* Bordo delle caselle */
  border-radius: 10px; /* Angoli arrotondati delle caselle */
  text-align: center;
  padding: 25px;
  cursor: pointer;
}

.camera-button,
.return-button {
  background-color: #a60016; /* Colore del pulsante */
  border: none;
  border-radius: 50%; /* Pulsante circolare */
  padding: 10px;
  font-size: 24px;
  color: white;
  cursor: pointer;
}

.text {
  font-size: 16px; /* Dimensione del testo nella casella */
  color: black;
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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #370006;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 20px;
  z-index: 1000;
}
</style>
