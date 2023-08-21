<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>Login</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <form >
            <ion-item>
                <ion-input label="Inserisci l'email..." label-placement="floating" fill="solid" v-model="email"></ion-input>
            </ion-item>
            <ion-item>
                <ion-input label="Inserisci la password..." label-placement="floating" fill="solid" type="password" v-model="password"></ion-input>
            </ion-item>
            <ion-button @click="login" :disabled="loginClicked">Login</ion-button>
        </form>
      </ion-content>
    </ion-page>
</template>
  
<script lang="ts">
  import { defineComponent } from 'vue';
  import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton } from '@ionic/vue';
  import { mapActions } from 'vuex';
  import axios from 'axios';
  
  export default defineComponent({
    components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonInput, IonButton },
    data() {
      return {
        email: '',
        password: '',
        loginClicked: false,
      };
    },
    methods: {
      ...mapActions(['saveApiToken']),
      async login() {
        try {
          this.loginClicked = true;
          const response = await axios.post('https://rainwaterdrains.inyourlife.com/api/login', {
            email: this.email,
            password: this.password
          });
  
          if (response.data.result) {
            console.log('Response:', response.data);
            this.$emit('authenticated', true);
  
            const apiToken = response.data.user.api_token;

            this.saveApiToken(apiToken);
            console.log(apiToken);

            //this.saveApiToken(apiToken);
            //localStorage.setItem('apiToken', apiToken);
            //console.log(apiToken);
  
          } else {
            console.log('Autenticazione fallita');
            // Autenticazione fallita, gestisci l'errore
          }
        } catch (error) {
          console.log('Errore qua:', error);
        } finally {
            this.loginClicked = false;
        }
      }
    }
  });
</script>
