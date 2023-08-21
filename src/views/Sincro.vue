<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>Sincronizzazione</h1>
      </div>
      <div class="sub-container">
        <div class="sincro-foto">
            <h5>
                Foto da sincronizzare:
            </h5>
        </div>
        <div class="sincro-caditoie">
            <h5>
                Caditoie da sincronizzare:
            </h5>
        </div>
        
        <router-link to="/">
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
import { useRouter } from 'vue-router';

import { useNetwork } from '@/composables/useNetwork';


const { networkStatus, logCurrentNetworkStatus } = useNetwork();

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
