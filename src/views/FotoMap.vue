<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>Foto</h1>
      </div>
      <div class="sub-container">
        <div class="box-image">
          <h4>Accuratezza posizione:</h4>
          <h6>
            {{ formattedPhotoAccuracy }}
          </h6>
          <img :src="photoFilePath" alt="Foto utente" />
          <div class="photo-data">
            <div class="cooridnates">
              <p>Lat: {{ photoLatitude }}</p>
              <p>Long: {{ photoLongitude }}</p>
            </div>
          </div>
        </div>
        <div class="box-map">
          <div id="map"></div>
        </div>

        <ion-button @click="goBack">
          ANNULLA
          <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
        </ion-button>
        <router-link to="/specifiche">
          <ion-button>
            SALVA
            <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
          </ion-button>
        </router-link>
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
  IonInput,
  IonTextarea,
} from "@ionic/vue";
import { arrowRedoCircleSharp } from "ionicons/icons";
import { useRouter } from "vue-router";
import { useNetwork } from "@/composables/useNetwork";
import axios from "axios";
import { Ref, ref, computed, onMounted } from "vue";
import { useStore } from "vuex";

const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();
const store = useStore();
const router = useRouter();
const photoFilePath = ref(localStorage.getItem("photoPath"));
const photoTitle = ref(localStorage.getItem("photoTitle"));
const photoAccuracy = ref(localStorage.getItem("photoAccuracy"));
const photoLatitude = ref(localStorage.getItem("photoLatitude"));
const photoLongitude = ref(localStorage.getItem("photoLongitude"));

const photoAccuracyNumber = parseFloat(photoAccuracy.value || "0");
const formattedPhotoAccuracy = !isNaN(photoAccuracyNumber)
  ? photoAccuracyNumber.toFixed(2)
  : "N/A";

const initMap = async () => {
  const position = {
    lat: parseFloat(photoLatitude.value || "0"),
    lng: parseFloat(photoLongitude.value || "0"),
  };

  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const map = new Map(document.getElementById("map"), {
    zoom: 21,
    center: position,
    mapId: "mappa_foto",
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    rotateControl: false,
    streetViewControl: false,
    mapTypeControl: false,
  });

  const marker = new AdvancedMarkerElement({
    map: map,
    position: position,
    title: "Posizione della foto",
  });
};

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

const goBack = () => {
  router.go(-1);
};

onMounted(async () => {
  if (typeof google === "undefined" || !google.maps) {
    setTimeout(() => {
      initMap();
    }, 1000);
  } else {
    initMap();
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

.box-image {
  text-align: center;
}

.cooridnates {
  display: flex;
  justify-content: space-around;
}

capacitor-google-map {
  display: inline-block;
  width: 275px;
  height: 400px;
}

#map {
  height: 400px;
  width: 100%;
}
</style>
