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
        <router-link to="/sceltaLuogo">
          <ion-button>
            PROCEDI
            <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
          </ion-button>
        </router-link>
      </div>
    </ion-content>
  </ion-page>
</template>


<script setup lang="ts">
import { IonPage, IonContent, IonIcon, IonButton, IonSelect, IonSelectOption, IonLabel } from '@ionic/vue';
import { arrowRedoCircleSharp } from 'ionicons/icons';
import { useNetwork } from '@/composables/useNetwork';
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';

const store = useStore();

const { networkStatus, logCurrentNetworkStatus } = useNetwork();


const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

const clients = ref([]);
const selectedClient = ref(null);

watch(selectedClient, (newValue) => {
  console.log('Cliente selezionato:', newValue);
});

onMounted(async () => {
  try {
    const apiToken = store.getters.getApiToken;
    //const apiToken = localStorage.getItem('apiToken');
    console.log(apiToken);
    const response = await axios.get('https://rainwaterdrains.inyourlife.com/api/users/Cliente', {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    clients.value = response.data.data;
    console.log('Clienti:', clients.value);
  } catch (error) {
    console.error('Errore durante la chiamata API:', error);
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
  --background: #A60016;
  font-weight: bolder;
}
</style>
