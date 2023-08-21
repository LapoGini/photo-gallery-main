<template>
  <ion-app>
    <HamburgerNav v-if="isAuthenticated" :update-authentication="updateAuthentication" />
    <Login v-else @authenticated="updateAuthentication"/>
  </ion-app>
</template>

<script lang="ts">
import { IonApp  } from '@ionic/vue';

import { defineComponent } from 'vue';

import HamburgerNav from '@/components/HamburgerNav.vue';
import Login from '@/components/Login.vue';


export default defineComponent({
  name: 'App',
  components: { IonApp, HamburgerNav, Login },
  data() {
    return {
      isAuthenticated: false,
    };
  },
  methods: {
    updateAuthentication(authenticated: boolean) {
      this.isAuthenticated = authenticated;
      console.log('è questo qua:', this.isAuthenticated);
    }
  }
});


</script>