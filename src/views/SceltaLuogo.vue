<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>SCELTA LUOGO</h1>
      </div>
      <div class="sub-container">
        <ion-label class="choose-client"> Scegli il comune:</ion-label>
        <ion-select v-model="selectedCity" label="Comune selezionato..." label-placement="floating" fill="solid">
          <ion-select-option v-for="city in cities" :key="city.comune_id" :value="city.comune_id">
            {{ city.comune_nome }}
          </ion-select-option>
        </ion-select>
        <div v-if="selectedCity">
          
          <div v-if="streets.length > 0">
            <ion-label class="choose-client"> Scegli la via:</ion-label>
              <ion-select v-model="selectedStreet" label="Via selezionata..." label-placement="floating" fill="solid">
                <ion-select-option v-for="street in streets" :key="street.id" :value="street.id">
                  {{ street.name }}
                </ion-select-option>
              </ion-select>
          </div>

          
          <ion-label> Aggiungi via:</ion-label>
          <ion-input v-model="newStreetName" label="Aggiungi una nuova via..." label-placement="floating" fill="solid"></ion-input>
          <div v-if="newStreetName !== '' && newStreetName !== undefined && newStreetName !== null">
              <ion-button @click="addStreet">Aggiungi Via</ion-button>
          </div>

          <div class="caditoie-box" v-if="caditoieResults.length > 0">
            <div class="caditoia-header" @click="isExpanded = !isExpanded">
              Caditoie scansionate: {{ caditoieResults.length }}
              <div class="icon-expanded">{{ isExpanded ? '▽' : '△' }}</div>
            </div>
            <div class="caditoia-list" v-if="isExpanded">
              <div class="caditoia-item" v-for="caditoia in caditoieResults" :key="caditoia.id">
                <p>
                  Data scansione: {{ caditoia.data_caditoia }}
                </p>
                <p v-if="caditoia.caditoie_civico !== null">
                  Civico: {{ caditoia.caditoie_civico }}
                </p>
                <p>
                  User: {{ caditoia.user }}
                </p>
              </div>
            </div>
          </div>
          
          <div v-if="selectedStreet">
            <router-link :to="{ name: 'IlTuoLuogo'}" @click="removeAddStreetFromLocalStorage">
              <ion-button>
                PROCEDI
              </ion-button>
            </router-link>
          </div>
        </div>
        
        
      </div>
    </ion-content>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>


<script lang="ts">

import { IonPage, IonContent, IonButton, IonSelect, IonSelectOption, IonLabel, IonList, IonItem, IonInput } from '@ionic/vue';
import { ref, defineComponent, onMounted, watch, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';
import { useNetwork } from '@/composables/useNetwork';
import { useRouter } from 'vue-router';
import { saveCitiesToDB, getCitiesFromDB } from '@/services/db_cities.js';
import { saveStreetsToDB, saveStreetToDB, getStreetsFromDB } from '@/services/db_streets.js';

const { networkStatus, logCurrentNetworkStatus, showToastBackground } = useNetwork();

export default defineComponent({
  name: 'SceltaLuogo',
  components: { IonPage, IonContent, IonButton, IonSelect, IonSelectOption, IonLabel, IonList, IonItem, IonInput },
  setup() {
    const selectedCity = ref(null);
    const selectedStreet = ref(null);
    const streets = ref([]);
    const newStreetName = ref('');
    const addStreetResult = ref(null);
    const caditoieResults = ref([]);
    const isExpanded = ref(false);
    const cities = ref([]);
    const store = useStore();
    const router = useRouter();

    const fetchCities = async () => {
      try {
        const apiToken = store.getters.getApiToken;
        console.log(apiToken);
        const response = await axios.get('https://rainwaterdrains.inyourlife.com/api/cities', {
              headers: {
                'Authorization': `Bearer ${apiToken}`
          }
        });
        cities.value = response.data.data;
        await saveCitiesToDB(cities.value);
      } catch (error) {
        console.error('Errore durante il recupero delle città:', error);
        cities.value = await getCitiesFromDB();
      }
    };

    watch(selectedCity, (newValue, oldValue) => {
      console.log('Comune selezionato:', newValue);

      if (newValue !== oldValue) {
        saveCityToLocalStorage();
        handleSelectChange();
      }
    });

    watch(selectedStreet, (newValue, oldValue) => {
      console.log('Via selezionata:', newValue);
      saveStreetToLocalStorage();
      fetchCaditoieScansionatePerVia();
    });

    watch(newStreetName, (newValue, oldValue) => {
      console.log('Via selezionata:', newValue);
    });

    onMounted(async () => {
      await logCurrentNetworkStatus();
      fetchCities();
        restoreDataFromLocalStorage();
    });

    // Funzione per pulire il localStorage prima di chiudere l'app
    const cleanLocalStorageBeforeUnload = () => {
      localStorage.removeItem('savedData');
    };

    // Aggiungi un ascoltatore per l'evento unload
    window.addEventListener('unload', cleanLocalStorageBeforeUnload);

    // Smontare l'ascoltatore dell'evento unload quando il componente viene smontato
    onBeforeUnmount(() => {
      window.removeEventListener('unload', cleanLocalStorageBeforeUnload);
    });

    const saveCityToLocalStorage = () => {
      localStorage.setItem('city', JSON.stringify(selectedCity.value));
    };

    const saveStreetToLocalStorage = () => {
      localStorage.setItem('street', JSON.stringify(selectedStreet.value));
    };

    const removeStreetFromLocalStorage = () => {
      localStorage.removeItem('street');
    };

    const removeAddStreetFromLocalStorage = () => {
      localStorage.removeItem('addStreet');
    };

    const restoreDataFromLocalStorage = () => {
      const savedCity = localStorage.getItem('city');
      const savedStreet = localStorage.getItem('street');

      if (savedCity) {
        selectedCity.value = JSON.parse(savedCity);
      }

      if (savedStreet) {
        selectedStreet.value = JSON.parse(savedStreet);
      }
    };

    const handleSelectChange = async () => {
      console.log('vedemo:', selectedCity.value);

      try {
        const apiToken = store.getters.getApiToken;
        console.log(apiToken);
        const response = await axios.get(`https://rainwaterdrains.inyourlife.com/api/cities/vie/${selectedCity.value}`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });
        streets.value = response.data.data;
        await saveStreetsToDB(streets.value);
        console.log('Vie:', streets.value);
      } catch (error) {
        console.error('Errore durante la chiamata API per le vie:', error);
        streets.value = await getStreetsFromDB(selectedCity.value);
      }
    };

    const addStreet = async () => {
      console.log('Nuova strada:', newStreetName.value);
      console.log('Comune selezionato per la stada:', selectedCity.value);
      try {
        const apiToken = store.getters.getApiToken;
        console.log(apiToken);
        const response = await axios.post('https://rainwaterdrains.inyourlife.com/api/aggiungiVia', {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          },
          id: null,
          name: newStreetName.value,
          city_id: selectedCity.value,
        });
        console.log('response data della via aggiunta da onine:', response.data);
        addStreetResult.value = response.data;
        if(addStreetResult.value.idNew){
            localStorage.setItem('addStreet', JSON.stringify(addStreetResult.value.idNew));
            removeStreetFromLocalStorage();
            router.push({ name: 'IlTuoLuogo' });
        }
        console.log('RISPOSTA DELLA STRADA AGGIUNTA', addStreetResult.value.idNew);
        // Aggiornare la lista delle vie dopo aver aggiunto una nuova via
        handleSelectChange();
      } catch (error) {
        console.error('Errore durante la chiamata API:', error);
        const generatedId = await saveStreetToDB({
            name: newStreetName.value,
            city_id: selectedCity.value
        });

        localStorage.setItem('addStreet', JSON.stringify(generatedId));
        removeStreetFromLocalStorage();

        router.push({ name: 'IlTuoLuogo' });
      }
    };

    const fetchCaditoieScansionatePerVia = async () => {
      try {
        const apiToken = store.getters.getApiToken;

        const payload = {
            data: {
                giorniindietro: 60,
                codice_via: localStorage.getItem('street'),
                user: localStorage.getItem('user'),
            }
        };

        const response = await axios.post('https://rainwaterdrains.inyourlife.com/api/scansioniPerVia', payload, {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });

        if(response.data) {
            caditoieResults.value = response.data.caditoie;
            console.log('Array caditoie:', caditoieResults.value);
        }
        
      } catch (error) {
        console.error('Errore durante la chiamata a scansioniPerVia:', error);
      }
    };

    return { isExpanded, selectedCity, selectedStreet, streets, caditoieResults, newStreetName, addStreetResult, cities, handleSelectChange, addStreet, removeAddStreetFromLocalStorage, fetchCaditoieScansionatePerVia };
  },
});
</script>


<style scoped>
ion-content {
  --background:#370006;
}

.main-container {
  background-color: #A60016;
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

ion-label {
  font-size: 14px;
  font-weight: lighter;
}

ion-select {
  margin-top: 20px;
  background-color: rgb(255, 255, 254);
  color: black;
}

ion-select::part(label) {
  background-color: white;
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
  --background: #A60016;
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

</style>
