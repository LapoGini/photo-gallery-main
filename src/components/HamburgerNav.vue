<template>
  <ion-menu content-id="main-content" side="end" ref="menu" type="push">
    <ion-header>
      <ion-toolbar color="danger">
        <ion-title>Menu</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="full">
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/')" :class="{ 'ion-text-bold': currentRoute === '/' }">
            <ion-icon name="home" slot="start"></ion-icon>
            <ion-label>Home</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/sceltaLuogo')" :class="{ 'ion-text-bold': currentRoute === '/sceltaLuogo' }">
            <ion-icon name="location" slot="start"></ion-icon>
            <ion-label>Cambia Luogo</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/sincro')" :class="{ 'ion-text-bold': currentRoute === '/sincro' }">
            <ion-icon name="sync" slot="start"></ion-icon>
            <ion-label>Sincro</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/scansioni')" :class="{ 'ion-text-bold': currentRoute === '/scansioni' }">
            <ion-icon name="scan" slot="start"></ion-icon>
            <ion-label>Scansioni</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/elimina')" :class="{ 'ion-text-bold': currentRoute === '/elimina' }">
            <ion-icon name="scan" slot="start"></ion-icon>
            <ion-label>Elimina</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="handleLogoutClick">
            <ion-icon name="log-out" slot="start"></ion-icon>
            <ion-label>Logout</ion-label>
          </ion-item>
        </ion-menu-toggle>
      </ion-list>
    </ion-content>
  </ion-menu>
  <ion-page id="main-content">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <router-view />
    </ion-content>
  </ion-page>
</template>



<script lang="ts">
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenu,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonList,
  IonLabel,
  IonIcon,
} from "@ionic/vue";
import { defineComponent, PropType, ref, Ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default defineComponent({
  components: {
    IonButtons,
    IonContent,
    IonHeader,
    IonMenu,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar,
    IonItem,
    IonList,
    IonLabel,
    IonIcon,
  },
  props: {
    updateAuthentication: {
      type: Function as PropType<(authenticated: boolean) => void>,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const menu: Ref<any> = ref(null);
    const currentRoute = ref(router.currentRoute.value.path);

    // Aggiorna currentRoute quando l'URL cambia
    const updateCurrentRoute = () => {
      currentRoute.value = router.currentRoute.value.path;
    };

    onMounted(() => {
      // Assicurati che il riferimento al menu sia disponibile
      menu.value = document.querySelector('ion-menu');
      updateCurrentRoute(); // Inizializza currentRoute all'avvio del componente
      router.afterEach(updateCurrentRoute); // Aggiorna currentRoute dopo ogni cambio di rotta
    });

    onBeforeUnmount(() => {
      router.afterEach(updateCurrentRoute); // Rimuovi l'hook afterEach prima della distruzione del componente
    });

    const navigateAndCloseMenu = (path: string) => {
      console.log("navigateAndCloseMenu chiamato con path:", path);
      router.push(path).then(() => {
        if (menu.value) {
          menu.value.close(); // Chiude il menu dopo la navigazione
        }
      });
    };

    const handleLogoutClick = async () => {
      try {
        const apiToken = store.getters.getApiToken;
        console.log("ApiToken prelevato:", apiToken);
        localStorage.clear();
        props.updateAuthentication(false);
        navigateAndCloseMenu("/");
        await axios.post("https://rainwaterdrains.inyourlife.com/api/logout", null, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });
      } catch (error) {
        console.error("Errore durante il logout", error);
      }
    };

    return {
      handleLogoutClick,
      navigateAndCloseMenu,
      menu,
      currentRoute,
    };
  },
});
</script>



<style scoped>
ion-menu::part(container) {
  border-radius: 20px 0 0 0;

  box-shadow: 4px 0px 16px rgba(100, 100, 100, 0.5);
}

ion-item {
  text-decoration: none;
  --border-width: 0;
}

ion-toolbar {
  background-color: #a60016;
}

ion-toolbar ion-title {
  color: white;
}

.list-md-lines-full .item-lines-default {
  --inner-border-width: 0px;
  --border-width: 0;
}

.ion-text-bold{
  font-weight: bolder;
  color: #a60016;
}

</style>


