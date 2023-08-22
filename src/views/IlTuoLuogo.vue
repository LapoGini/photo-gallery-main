<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>Il tuo luogo:</h1>
        <h4>Nome comune
            <br>
            Nome strada (XX)
        </h4>
      </div>
      <div class="sub-container">
        <div class="grid-container">
          <div class="camera-box">
            <ion-fab>
              <ion-fab-button @click="takePhoto()">
                <ion-icon class="icon-tag" :icon="camera"></ion-icon>
              </ion-fab-button>
            </ion-fab>
            <div class="text">Scatta Foto</div>
          </div>
          <div class="return-to-via">
            <ion-fab>
              <router-link to="/sceltaLuogo">
                <ion-fab-button>
                  <ion-icon class="icon-tag" :icon="arrowUndoOutline"></ion-icon>
                </ion-fab-button>
              </router-link>
            </ion-fab>
            <div class="text">Cambia Via</div>
          </div>
        </div>
      </div>
      <div class="accuracy">
        <h5>
          Accuratezza posizione:
        </h5>
        <p>
          {{ lowestAccuracy !== null ? lowestAccuracy : 'N/A' }}
        </p>
      </div>
      <div class="procedi-container">
        <router-link to="/ilTuoLuogo" class="router-a">
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
import { IonPage, IonContent, IonIcon, IonButton, IonSelect, IonSelectOption, IonLabel, IonFab, IonFabButton } from '@ionic/vue';
import { arrowRedoCircleSharp, arrowUndoOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { camera } from 'ionicons/icons';
// sto importando la funzione usePhotoGallery per poterla attivare ed essa aprirà la fotocamera del dispositivo e ci permetterà di scattare foto.getPhoto()
import { usePhotoGallery, UserPhoto } from '@/composables/usePhotoGallery';

import { useNetwork } from '@/composables/useNetwork';

const { networkStatus, logCurrentNetworkStatus, showToastBackground } = useNetwork();

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

// Destrutturare la funzione da in modo da poterla usare nel nostro :takePhotousePhotoGallerytemplate
const { photos, takePhoto, accuracy, lowestAccuracy } = usePhotoGallery();

import { ref, onMounted, watch } from 'vue';

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
  --background: #A60016;
  font-weight: bolder;
}

ion-fab-button::part(native) {
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
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
