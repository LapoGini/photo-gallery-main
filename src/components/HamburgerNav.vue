<template>
  <ion-menu content-id="main-content" side="end">
    <ion-header>
      <ion-toolbar color="danger">
        <ion-title>Menu</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="full">
        <router-link to="/" v-slot="{ navigate }">
            <ion-item @click="navigate()">
              <ion-label class="ion-text-bold">Home</ion-label>
            </ion-item>
        </router-link>
        <router-link to="/sceltaLuogo" v-slot="{ navigate }">
          <ion-item @click="navigate()">
            <ion-label class="ion-text-bold">Cambia Luogo</ion-label>
          </ion-item>
        </router-link>
        <router-link to="/sincro" v-slot="{ navigate }">
            <ion-item @click="navigate()">
              <ion-label class="ion-text-bold">Sincro</ion-label>
            </ion-item>
        </router-link>
        <router-link to="/scansioni" v-slot="{ navigate }">
            <ion-item @click="navigate()">
              <ion-label class="ion-text-bold">Scansioni</ion-label>
            </ion-item>
        </router-link>
          <router-link to="/network" v-slot="{ navigate }">
              <ion-item @click="navigate()">
                <ion-label class="ion-text-bold">Network</ion-label>
              </ion-item>
          </router-link>
          <router-link to="/localNotification" v-slot="{ navigate }">
              <ion-item @click="navigate()">
                <ion-label class="ion-text-bold">Local Notification</ion-label>
              </ion-item>
          </router-link>
          <router-link to="/" v-slot="{ navigate }">
            <ion-item @click="handleLogoutClick(navigate)">
              <ion-label class="ion-text-bold">Logout</ion-label>
            </ion-item>
          </router-link>
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
  import { IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonPage, IonTitle, IonToolbar, IonItem, IonList, IonLabel, IonIcon } from '@ionic/vue';
  import { defineComponent, PropType } from 'vue';
  import axios from 'axios';
  import { useStore } from 'vuex';


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

      const handleLogoutClick = async (navigate: () => void) => {
        try {
          const apiToken = store.getters.getApiToken;
          console.log('lo fa:', apiToken);

          props.updateAuthentication(false);

          await axios.post('https://rainwaterdrains.inyourlife.com/api/logout', {
            headers: {
              'Authorization': `Bearer ${apiToken}`
            }
          });

          navigate();
        } catch (error) {
          console.error('Errore durante il logout', error);
        }
      };

      return {
        handleLogoutClick
      };
    }
  });
</script>

<style scoped>

  ion-menu::part(container) {
    border-radius: 20px 0 0 0;

    box-shadow: 4px 0px 16px rgba(100, 100, 100, 0.5);
  }

  ion-item {
      text-decoration: none;
  }

  ion-toolbar {
    background-color: #A60016;
  }

  ion-toolbar ion-title {
    color: white;
  }

  .list-md-lines-full .item-lines-default {
  --inner-border-width: 0px;
  --border-width: 0;
}
</style>


