<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Network</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <h3>PAGINA 2</h3>
      <p>
        Sei {{ networkStatus ? 'Online' : 'Offline' }}
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from '@ionic/vue';
import { useNetwork } from '@/composables/useNetwork';

// Usa il composable
const { networkStatus, logCurrentNetworkStatus } = useNetwork();

// Funzione per ottenere lo stato della connessione di rete
const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};
</script>

<!-- In caso di connessione debole o assente devo salvare i dati nell'indexedDB 

Quando si ristabiolizza la connessione fare la chiamata API per mandare i dati al server ed

Eliminare i dati dall'indexedDB nel caso in cui siano già stati inviati al server

 -->