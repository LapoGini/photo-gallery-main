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
          <ion-item button @click="navigateAndCloseMenu('/')">
            <ion-icon name="home" slot="start"></ion-icon>
            <ion-label class="ion-text-bold">Home</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/sceltaLuogo')">
            <ion-icon name="location" slot="start"></ion-icon>
            <ion-label class="ion-text-bold">Cambia Luogo</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/sincro')">
            <ion-icon name="sync" slot="start"></ion-icon>
            <ion-label class="ion-text-bold">Sincro</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/scansioni')">
            <ion-icon name="scan" slot="start"></ion-icon>
            <ion-label class="ion-text-bold">Scansioni</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="navigateAndCloseMenu('/elimina')">
            <ion-icon name="scan" slot="start"></ion-icon>
            <ion-label class="ion-text-bold">Elimina</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle auto-hide="false">
          <ion-item button @click="handleLogoutClick">
            <ion-icon name="log-out" slot="start"></ion-icon>
            <ion-label class="ion-text-bold">Logout</ion-label>
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
import { defineComponent, PropType, ref, Ref, onMounted } from "vue"; // Aggiungi ref qui
import axios from "axios";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { mapActions } from "vuex";

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

    onMounted(() => {
      // Assicurati che il riferimento al menu sia disponibile
      menu.value = document.querySelector('ion-menu');
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
        console.log("ApiToken prelevato:", apiToken); // Stampa l'apiToken
        localStorage.clear();
        props.updateAuthentication(false);
        navigateAndCloseMenu("/");
        await axios.post("https://rainwaterdrains.inyourlife.com/api/logout", {
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
</style>


