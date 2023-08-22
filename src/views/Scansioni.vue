<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>Scansioni</h1>
      </div>
      <div class="sub-container">
        <div class="filter-data">
            <h5>
                Scegli la data:
            </h5>
              <ion-datetime :show-default-buttons="true">
                <span slot="title">Select a Reservation Date</span>
              </ion-datetime>
        </div>
        
        <router-link to="/">
          <ion-button>
            PROCEDI
            <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
          </ion-button>
        </router-link>
      </div>
    </ion-content>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>


<script setup lang="ts">
import { IonPage, IonContent, IonIcon, IonButton, IonSelect, IonSelectOption, IonLabel, IonDatetime } from '@ionic/vue';
import { arrowRedoCircleSharp } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useNetwork } from '@/composables/useNetwork';

const getCaditoieScansionate = async () => {

  console.log('ci va');
  try {
    const response = await axios.post('https://rainwaterdrains.inyourlife.com/api/scansioni/', {
      data: {
        id_user: 3,
        iduserhash: '',
        giorno: null
      }
    }, {
      headers: {
        'Authorization': 'Bearer 2DId7834t4ULSrEeZKVzQZpFe6FTI7z1cS0uve8XxKdgnFUAwfN5gO8RVUmAHHxsPmbz9k39hXugWYAX'
      }
    });

    if (response.data.result) {
      const caditoie = response.data.caditoie;
      const aggregato = response.data.aggregato;

      console.log(response.data.result);

    } else {
      console.error('Errore nella risposta dell\'API:', response.data.error);
    }
  } catch (error) {
    console.error('Errore durante la chiamata API:', error);
  }
};


const { networkStatus, logCurrentNetworkStatus, showToastBackground } = useNetwork();

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

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

ion-datetime {
background-color: rgb(33, 33, 33);
max-width: 100%;
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
