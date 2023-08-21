<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Another Component</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-button @click="handleButtonClick">Schedule Notification</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/vue';
import { scheduleLocalNotification, checkPermissions, requestPermissions } from '@/composables/useLocalNotification';

const handleButtonClick = async () => {
  const permissions = await checkPermissions();

  if (permissions) {
    if (permissions.display === 'granted') {
      scheduleLocalNotification();
    } else {
      console.log('Permessi delle notifiche non concessi. Richiesta dei permessi...');
      await requestPermissions();
      // Dopo aver richiesto i permessi, verifica di nuovo lo stato dei permessi
      const updatedPermissions = await checkPermissions();
      if (updatedPermissions && updatedPermissions.display === 'granted') {
        console.log('Permessi delle notifiche concessi. Pianificazione della notifica...');
        scheduleLocalNotification();
      } else {
        console.log('Permessi delle notifiche non concessi.');
      }
    }
  } else {
    console.log('Errore nel controllo dei permessi.');
  }
};
</script>