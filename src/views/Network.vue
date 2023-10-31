<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Network</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <h3>PAGINA 2</h3>
      <p>Sei {{ networkStatus ? "Online" : "Offline" }}</p>
    </ion-content>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
} from "@ionic/vue";
import { useNetwork } from "@/composables/useNetwork";

// Usa il composable
const { networkStatus, logCurrentNetworkStatus } = useNetwork();

// Funzione per ottenere lo stato della connessione di rete
const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};
</script>