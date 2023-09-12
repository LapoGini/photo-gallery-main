<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>SCELTA CLIENTE</h1>
      </div>
      <div class="sub-container">
        <ion-label class="choose-client"> Scegli il cliente:</ion-label>
        <ion-select v-model="selectedClient" label="Cliente selezionato..." label-placement="floating" fill="solid">
          <ion-select-option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.name }}
          </ion-select-option>
        </ion-select>
        <!-- Verifica se soo state consentiti: arrivo delle notiiche, camera e localizzazione-->
          <ion-button :disabled="!permissionsGranted || (selectedClient ? selectedClient.value === null : true)" @click="proceedToNextRoute">
            PROCEDI
            <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
          </ion-button>
      </div>
    </ion-content>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>


<script setup lang="ts">
import { IonPage, IonContent, IonIcon, IonButton, IonSelect, IonSelectOption, IonLabel } from '@ionic/vue';
import { arrowRedoCircleSharp } from 'ionicons/icons';
import { useNetwork } from '@/composables/useNetwork';
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'vue-router';
import { saveClientsToDB, getClientsFromDB } from '@/services/db_clients.js';
import { saveCitiesToDB, getCitiesFromDB } from '@/services/db_cities.js';
import { saveStreetsToDB, getStreetsFromDB } from '@/services/db_streets.js';
import { saveTagsToDB, getTagsFromDB } from '@/services/db_tags.js';

const { networkStatus, logCurrentNetworkStatus, showToastBackground } = useNetwork();
const store = useStore();
const router = useRouter();
const clients = ref([]);
const cities = ref([]);
const streets = ref([]);
const tags = ref([]);
const selectedClient = ref(null);
const permissionsGranted = ref(false);

const proceedToNextRoute = () => {
    if (permissionsGranted.value) {
        router.push('/sceltaLuogo');
    }
};

const requestNotificationsPermissions = async (): Promise<boolean> => {
  try {
    const notificationsPermission = await LocalNotifications.checkPermissions();
    if (notificationsPermission.display !== "granted") {
      const response = await LocalNotifications.requestPermissions();
      if (response.display !== "granted") {
        console.warn('Permessi per le notifiche non concessi.');
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Errore durante la gestione delle notifiche:', error);
    return false;
  }
};

const requestCameraPermissions = async () => {
  try {
    const cameraPermission = await Camera.checkPermissions();
    if (cameraPermission.camera !== 'granted') {
      const { camera } = await Camera.requestPermissions();
      if (camera !== "granted") {
        console.warn('Permessi per le notifiche non concessi.');
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Errore durante la gestione della fotocamera:', error);
    return false;
  }
};

const requestLocationPermissions = async () => {
  try {
    const locationPermission = await Geolocation.checkPermissions();
    if (locationPermission.location !== 'granted') {
      const { location } = await Geolocation.requestPermissions();
      if (location !== "granted") {
        console.warn('Permessi per le notifiche non concessi.');
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Errore durante la gestione della posizione:', error);
    return false;
  }
}

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

watch(selectedClient, (newValue) => {
  console.log('Cliente selezionato:', newValue);
});

const fetchClients = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get('https://rainwaterdrains.inyourlife.com/api/users/Cliente', {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    clients.value = response.data.data;
    await saveClientsToDB(clients.value);
    console.log('Clienti:', clients.value);
  } catch (error) {
    console.error('Errore durante il recupero dei clienti:', error);
    clients.value = await getClientsFromDB();
  }
};

const fetchCities = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get('https://rainwaterdrains.inyourlife.com/api/cities', {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    cities.value = response.data.data;
    await saveCitiesToDB(cities.value);
    console.log('Cities:', cities.value);
  } catch (error) {
    console.error('Errore durante il recupero delle città:', error);
  }
};

const fetchStreets = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get('https://rainwaterdrains.inyourlife.com/api/allStreets', {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    streets.value = response.data.data;
    await saveStreetsToDB(streets.value);
    console.log('Streets:', streets.value);
  } catch (error) {
    console.error('Errore durante il recupero delle strade:', error);
  }
};

const fetchTags = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get('https://rainwaterdrains.inyourlife.com/api/tags/item', {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    tags.value = response.data.data;
    await saveTagsToDB(tags.value);
    console.log('Tags:', tags.value);
  } catch (error) {
    console.error('Errore durante il recupero dei tag:', error);
  }
};

onMounted(async () => {
  console.log('CLIENTE SELEZIONATO', selectedClient.value === null);
  const notificationsPermission = await requestNotificationsPermissions();
  const cameraPermission = await requestCameraPermissions();
  const locationPermission = await requestLocationPermissions();
  // Se tutti i permessi sono stati concessi, imposto permissionsGranted su true
  if (notificationsPermission && cameraPermission && locationPermission) {
    permissionsGranted.value = true;
    console.log('PERMESSO', permissionsGranted);
  }
  await logCurrentNetworkStatus();

  sessionStorage.clear();

  await Promise.all([
    fetchClients(),
    fetchCities(),
    fetchStreets(),
    fetchTags()
  ]);
});



document.addEventListener('ionFocus', (event) => {
    // Usiamo un'asserzione di tipo qui
    const target = event.target as HTMLElement;

    // Assicuriamoci che l'evento provenga da un ion-select
    if (target && target.tagName.toLowerCase() === 'ion-select') {
        // Tentativo di accedere al shadow DOM
        const shadowRoot = (target as any).shadowRoot;
        if (shadowRoot) {
            // Trova l'etichetta all'interno del shadow DOM e modifica lo stile
            const label = shadowRoot.querySelector('label');
            if (label) {
                label.style.backgroundColor = 'red'; // O qualsiasi altro colore desiderato
            }
        }
    }
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
  --background: #A60016;
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
</style>
