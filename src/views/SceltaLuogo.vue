<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="main-container ion-text-center">
        <h1>SCELTA LUOGO</h1>
      </div>
      <div class="sub-container ion-margin">
        <!-- Selezione del comune -->
        <div class="label-container">
          <ion-label class="custom-label">Seleziona comune:</ion-label>
        </div>
        <ion-item class="custom-item">
          <ion-select
            v-model="selectedCity"
            interface="popover"
            placeholder="Comune selezionato..."
            class="custom-select"
          >
            <ion-select-option
              v-for="city in cities"
              :key="city.comune_id"
              :value="city.comune_id"
            >
              {{ city.comune_nome }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <div v-if="selectedCity">
          <div v-if="!isStreetActionSelected" class="button-container">
            <ion-button
              @click="toggleAddStreetSection"
              class="add-button"
              col="4"
            >
              <i class="fa-solid fa-plus icon-plus"></i>
              Via
            </ion-button>
            <ion-button
              @click="toggleSelectStreetSection"
              class="select-button"
              col="8"
            >
              Seleziona Via
              <i class="fa-regular fa-hand-pointer icon-pointer"></i>
            </ion-button>
          </div>

          <!-- Sezione Selezione della Via -->
          <div v-if="showSelectStreetSection" class="ion-padding-vertical">
            <!-- Selezione della via -->
            <div class="label-container">
              <ion-label class="custom-label">Seleziona via:</ion-label>
            </div>
            <ion-item class="custom-item">
              <ion-select
                v-model="selectedStreet"
                interface="popover"
                placeholder="Via selezionata..."
                class="custom-select"
              >
                <ion-select-option
                  v-for="street in streets"
                  :key="street.id"
                  :value="street.id"
                >
                  {{ street.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <!-- Pulsante per procedere alla vista successiva -->
            <ion-button
              @click="proceedToNextPage"
              :disabled="
                !selectedCity || !selectedStreet || selectedStreet === null
              "
            >
              PROCEDI
              <i class="fa-solid fa-share icon-share"></i>
            </ion-button>
          </div>

          <!-- Sezione Aggiunta di una Nuova Via -->
          <div v-if="showAddStreetSection" class="ion-padding-vertical">
            <!-- Aggiunta di una nuova via -->
            <div class="label-container">
              <ion-label class="custom-label">Aggiungi via:</ion-label>
            </div>
            <ion-item class="custom-item">
              <ion-input
                v-model="newStreetName"
                placeholder="Aggiungi una nuova via..."
                class="custom-input"
              ></ion-input>
            </ion-item>
            <ion-button
              @click="addStreet"
              :disabled="
                newStreetName === '' ||
                newStreetName === undefined ||
                newStreetName === null
              "
            >
              Aggiungi Via
            </ion-button>
          </div>

          <!-- Elenco di caditoie scansionate -->
          <div class="caditoie-box" v-if="caditoieResults.length > 0">
            <div class="caditoia-header" @click="isExpanded = !isExpanded">
              <span v-if="isOfflineMode" class="offline-label"
                >Caditoie scansionate OFFLINE:</span
              >
              <span v-else class="online-label">Caditoie scansionate:</span>
              <span class="caditoie-count">{{ caditoieResults.length }}</span>
              <div class="icon-expanded">{{ isExpanded ? "▼" : "▲" }}</div>
            </div>
            <div class="caditoia-list" v-if="isExpanded">
              <div
                class="caditoia-item ion-padding"
                v-for="caditoia in caditoieResults"
                :key="caditoia.id"
              >
                <p class="caditoia-data">
                  Data scansione: {{ caditoia.dataCaditoia }}
                </p>
                <p v-if="caditoia.caditoieCivico" class="caditoia-civico">
                  Civico: {{ caditoia.caditoieCivico }}
                </p>
                <p class="caditoia-user">User: {{ caditoia.user }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>




<script lang="ts">
import {
  IonPage,
  IonContent,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonList,
  IonItem,
  IonInput,
  IonIcon,
} from "@ionic/vue";
import { ref, defineComponent, onMounted, watch, onBeforeUnmount } from "vue";
import axios from "axios";
import { useStore } from "vuex";
import { useNetwork } from "@/composables/useNetwork";
import { useRouter } from "vue-router";
import { saveCitiesToDB, getCitiesFromDB } from "@/services/db_cities.js";
import {
  getItemsByStreetId,
  getItemsFromDB,
  deleteItemFromDB,
  synchronizeStreetAndItems,
} from "@/services/db_items.js";
import {
  saveStreetsToDB,
  saveStreetToDB,
  getStreetsFromDB,
  getUnsynchronizedStreetsFromDB,
  markStreetAsSynchronized,
} from "@/services/db_streets.js";
import {
  usePhotoGallery,
  UserPhoto,
  uploadPhotoToServer,
} from "@/composables/usePhotoGallery";

const { getPhotoFromDB, blobToBase64 } = usePhotoGallery();
const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();

export default defineComponent({
  name: "SceltaLuogo",
  components: {
    IonPage,
    IonContent,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonList,
    IonItem,
    IonInput,
    IonIcon,
  },
  setup() {
    const selectedCity = ref(null);
    const selectedStreet = ref(null);
    const streets = ref([]);
    const newStreetName = ref("");
    const addStreetResult = ref(null);
    const caditoieResults = ref([]);
    const isExpanded = ref(false);
    const cities = ref([]);
    const store = useStore();
    const router = useRouter();
    const showSelectStreetSection = ref(false);
    const showAddStreetSection = ref(false);
    const isStreetActionSelected = ref(false);
    const isOfflineMode = ref(false);

    const toggleSelectStreetSection = () => {
      isStreetActionSelected.value = true;
      showSelectStreetSection.value = true;
      showAddStreetSection.value = false;
    };

    const toggleAddStreetSection = () => {
      isStreetActionSelected.value = true;
      showAddStreetSection.value = true;
      showSelectStreetSection.value = false;
    };

    const fetchCities = async () => {
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
        await saveCitiesToDB(cities.value);
      } catch (error) {
        console.error("Errore durante il recupero delle città:", error);
        cities.value = await getCitiesFromDB();
      }
    };

    watch(selectedCity, (newValue, oldValue) => {
      console.log("Comune selezionato:", newValue);
      selectedStreet.value = null;
      if (newValue !== oldValue) {
        isStreetActionSelected.value = false;
        showSelectStreetSection.value = false;
        showAddStreetSection.value = false;
        if (networkStatus.value) {
          console.log("entra synchronizeStreetsWithServer");
          synchronizeStreetsWithServer();
        }
        try {
          removeStreetFromLocalStorage();
          saveCityToLocalStorage();
          handleSelectChange();
        } catch {
          console.error("error");
        }
      }
    });

    const synchronizeStreetsWithServer = async () => {
      const unsynchronizedStreets = await getUnsynchronizedStreetsFromDB();
      console.log("Vie NON SINCRONIZZTE", unsynchronizedStreets);
      for (const street of unsynchronizedStreets) {
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
          console.log(
            "STRADA SINCRONIZZATA response.data.idNew",
            response.data
          );
          // Se la strada è stata aggiunta con successo al DB, aggiornala come sincronizzata in IndexedDB
          if (response.data.idNew) {
            await markStreetAsSynchronized(street.id, response.data.idNew);
            console.log(
              "STRADA SINCRONIZZATA CORRETTAMENTE",
              response.data.idNew
            );

            // Aggiorna anche gli items con il nuovo street_id
            await synchronizeStreetAndItems(street.id, response.data.idNew);
            console.log("Items aggiornati con il nuovo street_id");
          }
        } catch (error) {
          console.error("Errore durante la sincronizzazione:", error);
        }
      }
      console.log("FINE DEL CICLO");
    };

    watch(selectedStreet, (newValue, oldValue) => {
      console.log("Via selezionata:", newValue);
      saveStreetToLocalStorage();
      fetchCaditoieScansionatePerVia();
    });

    watch(newStreetName, (newValue, oldValue) => {
      console.log("Via selezionata:", newValue);
    });

    onMounted(async () => {
      await logCurrentNetworkStatus();
      fetchCities();
      restoreDataFromLocalStorage();
    });

    // Funzione per pulire il localStorage prima di chiudere l'app
    const cleanLocalStorageBeforeUnload = () => {
      localStorage.removeItem("savedData");
    };

    // Aggiungi un ascoltatore per l'evento unload
    window.addEventListener("unload", cleanLocalStorageBeforeUnload);

    // Smontare l'ascoltatore dell'evento unload quando il componente viene smontato
    onBeforeUnmount(() => {
      window.removeEventListener("unload", cleanLocalStorageBeforeUnload);
    });

    const saveCityToLocalStorage = () => {
      localStorage.setItem("city", JSON.stringify(selectedCity.value));
    };

    const saveStreetToLocalStorage = () => {
      localStorage.setItem("street", JSON.stringify(selectedStreet.value));
    };

    const removeStreetFromLocalStorage = () => {
      localStorage.removeItem("street");
    };

    const removeAddStreetFromLocalStorage = () => {
      localStorage.removeItem("addStreet");
    };

    const proceedToNextPage = () => {
      if (selectedCity.value && selectedStreet.value) {
        removeAddStreetFromLocalStorage();
        router.push({ name: "IlTuoLuogo" });
      } else {
        // Opzionalmente, mostra un messaggio di errore o un feedback all'utente
        console.log("Seleziona sia la città che la via prima di procedere.");
      }
    };

    const restoreDataFromLocalStorage = () => {
      const savedCity = localStorage.getItem("city");
      const savedStreet = localStorage.getItem("street");

      if (savedCity) {
        selectedCity.value = JSON.parse(savedCity);
      }

      if (savedStreet) {
        selectedStreet.value = JSON.parse(savedStreet);
      }
    };

    const handleSelectChange = async () => {
      console.log("vedemo:", selectedCity.value);

      try {
        const apiToken = store.getters.getApiToken;
        console.log(apiToken);
        const response = await axios.get(
          `https://rainwaterdrains.inyourlife.com/api/cities/vie/${selectedCity.value}`,
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
            },
          }
        );
        streets.value = response.data.data;
        await saveStreetsToDB(streets.value);
        console.log("Vie:", streets.value);
      } catch (error) {
        console.error("Errore durante la chiamata API per le vie:", error);
        const offlineStreets = await getStreetsFromDB(selectedCity.value);
        offlineStreets.sort((a, b) => a.name.localeCompare(b.name));
        streets.value = offlineStreets;
      }
    };

    const addStreet = async () => {
      console.log("Nuova strada:", newStreetName.value);
      console.log("Comune selezionato per la stada:", selectedCity.value);
      try {
        const apiToken = store.getters.getApiToken;
        console.log(apiToken);
        const response = await axios.post(
          "https://rainwaterdrains.inyourlife.com/api/aggiungiVia",
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
            },
            id: null,
            name: newStreetName.value,
            city_id: selectedCity.value,
          }
        );
        console.log(
          "response data della via aggiunta da onine:",
          response.data
        );
        addStreetResult.value = response.data;
        if (addStreetResult.value.idNew) {
          localStorage.setItem(
            "addStreet",
            JSON.stringify(addStreetResult.value.idNew)
          );
          removeStreetFromLocalStorage();
          const newStreet = {
            id: addStreetResult.value.idNew,
            name: newStreetName.value,
          };
          streets.value.push(newStreet);
          await saveStreetToDB(newStreet);
        }
        console.log(
          "RISPOSTA DELLA STRADA AGGIUNTA",
          addStreetResult.value.idNew
        );
        // Aggiornare la lista delle vie dopo aver aggiunto una nuova via
        handleSelectChange();
      } catch (error) {
        console.error("Errore durante la chiamata API:", error);
        console.log("!");
        const generatedId = await saveStreetToDB({
          name: newStreetName.value,
          city_id: selectedCity.value,
        });

        console.log("generatedId", generatedId);

        localStorage.setItem("addStreet", JSON.stringify(generatedId));
        console.log(
          'localStorage.setItem("addStreet", JSON.stringify(generatedId))',
          localStorage.setItem("addStreet", JSON.stringify(generatedId))
        );

        removeStreetFromLocalStorage();
        console.log(
          "removeStreetFromLocalStorage",
          removeStreetFromLocalStorage()
        );

        const newStreet = {
          id: generatedId,
          name: newStreetName.value,
        };
        console.log("newStreet", newStreet);

        streets.value.push(newStreet);
      }
      // Reimposta le variabili di stato
      showSelectStreetSection.value = false;
      showAddStreetSection.value = false;
      isStreetActionSelected.value = false;
      newStreetName.value = "";
    };

    function normalizeCaditoieData(caditoia: any) {
      console.log("caditoia", caditoia);
      return {
        dataCaditoia: caditoia.data_caditoia || caditoia.time_stamp_pulizia,
        caditoieCivico: caditoia.caditoie_civico || caditoia.civic,
        user: caditoia.user || `User ID: ${caditoia.user_id}`,
      };
    }
    const fetchCaditoieScansionatePerVia = async () => {
      try {
        isOfflineMode.value = false;
        const apiToken = store.getters.getApiToken;
        const payload = {
          data: {
            giorniindietro: 60,
            codice_via: localStorage.getItem("street"),
            user: localStorage.getItem("user"),
          },
        };

        const response = await axios.post(
          "https://rainwaterdrains.inyourlife.com/api/scansioniPerVia",
          payload,
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
            },
          }
        );

        if (response.data) {
          caditoieResults.value = response.data.caditoie.map(
            normalizeCaditoieData
          );
          console.log("Array caditoie:", caditoieResults.value);
        }
      } catch (error) {
        console.error("Errore durante la chiamata a scansioniPerVia:", error);
        const streetId = selectedStreet.value;
        console.log("OFFLINE scansioniPerVia:", streetId);
        isOfflineMode.value = true;
        const items = await getItemsByStreetId(streetId);
        console.log("OFFLINE scansioniPerVia:", items);
        caditoieResults.value = items.map(normalizeCaditoieData);
      }
    };

    return {
      isExpanded,
      selectedCity,
      selectedStreet,
      streets,
      caditoieResults,
      newStreetName,
      addStreetResult,
      cities,
      showSelectStreetSection,
      showAddStreetSection,
      isStreetActionSelected,
      toggleSelectStreetSection,
      toggleAddStreetSection,
      handleSelectChange,
      addStreet,
      removeAddStreetFromLocalStorage,
      proceedToNextPage,
      fetchCaditoieScansionatePerVia,
      isOfflineMode,
    };
  },
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

.sub-container {
  width: 90%;
  margin: auto;
  margin-top: 50px;
  color: white;
}

ion-select {
  background-color: rgb(255, 255, 254);
  color: black;
  width: 100%; /* Imposta la larghezza desiderata */
  max-width: 300px; /* Imposta una larghezza massima desiderata */
}

ion-select::part(label) {
  background-color: white;
}

/* Per centrare il menu a discesa */
ion-select::part(popover) {
  text-align: center;
}

/* Per aggiungere spazio tra le select */
ion-item.custom-item + ion-item.custom-item {
  margin-top: 10px; /* Imposta il margine tra le select */
}

ion-item {
  border-radius: 10px;
}

ion-label {
  font-size: 14px;
  font-weight: lighter;
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

.caditoie-box {
  margin-top: 20px;
  background-color: white;
  color: black;
}

.icon-expanded {
  border: 1px solid white;
}

.caditoia-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 20px;
  padding: 0 10px;
}

.caditoia-list {
  max-height: 300px;
  overflow-y: auto;
}

.caditoia-item {
  padding-top: 10px;
  border: 1px solid black;
}

.label-container {
  text-align: center;
  margin-bottom: 10px; /* Aggiungi un margine tra le etichette e le select */
}

.custom-label {
  font-size: 16px; /* Imposta la dimensione del testo per le etichette */
  font-weight: bold;
  color: white;
}

/* Rimuovi il margine superiore per la prima select */
.custom-item:first-child {
  margin-top: 0;
}

.label-container:not(:first-child) {
  margin-top: 15px;
}

.button-container {
  display: flex;
  justify-content: space-between;
}

.select-button {
  flex: 2; /* Pulsante "Seleziona Via" occupa 2/3 dello spazio */
  margin-left: 0.5rem;
}

.add-button {
  flex: 1; /* Pulsante "Aggiungi Via" occupa 1/3 dello spazio */
}

.caditoie-box {
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  margin-top: 20px;
  padding: 10px;
}

.caditoia-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 10px;
}

.offline-label {
  color: #ff5722; /* Colore per lo stato offline */
}

.online-label {
  color: #4caf50; /* Colore per lo stato online */
}

.caditoie-count {
  font-size: 20px;
  margin-left: 10px;
}

.icon-expanded {
  font-size: 20px;
}

.caditoia-list {
  max-height: 300px;
  overflow-y: auto;
}

.caditoia-item {
  background-color: #f5f5f5;
  border-radius: 10px;
  margin-top: 10px;
}

.caditoia-data {
  font-weight: bold;
}

.caditoia-civico {
  font-style: italic;
}

.caditoia-user {
  font-size: 12px;
  color: #777;
}

.icon-plus {
  padding-right: 0.5rem;
}

.icon-pointer,
.icon-share {
  padding-left: 0.5rem;
}

/*.add-buttonion-content {
  --background: linear-gradient(135deg, #370006, #571727);
}

.main-container {
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  text-align: center;
  color: white;
  font-weight: bold;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.main-container:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.sub-container {
  width: 95%;
  margin: 20px auto;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(5px);
}

ion-item {
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  margin-bottom: 15px;
}

ion-select {
  --background: transparent;
  --color: white;
  --placeholder-color: #ccc;
  --padding-start: 10px;
  --border-radius: 10px;
  font-weight: bold;
}

ion-button {
  --background: linear-gradient(45deg, #a60016, #d1473a);
  --background-activated: linear-gradient(45deg, #d1473a, #f47361);
  --border-radius: 10px;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.3s ease;
}

ion-button:hover {
  --background: linear-gradient(45deg, #d1473a, #f47361);
}

.caditoie-box {
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  margin-top: 20px;
  padding: 10px;
}

.caditoia-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  transition: background-color 0.3s ease;
}

.caditoia-header:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.offline-label, .online-label {
  font-weight: bold;
}

.caditoie-count {
  font-size: 20px;
  margin-left: 10px;
}

.caditoia-list {
  max-height: 300px;
  overflow-y: auto;
}

.caditoia-item {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin-top: 10px;
  padding: 10px;
}

.caditoia-data, .caditoia-civico, .caditoia-user {
  font-size: 14px;
  color: white;
}
*/
</style>