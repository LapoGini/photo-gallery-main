<template>
  <div v-if="!hasApiToken">
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>Login</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <form>
          <ion-item>
            <ion-input
              label="Inserisci l'email..."
              label-placement="floating"
              fill="solid"
              v-model="email"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-input
              label="Inserisci la password..."
              label-placement="floating"
              fill="solid"
              type="password"
              v-model="password"
            ></ion-input>
          </ion-item>
          <ion-item
            class="authentication-error"
            v-if="authenticationError"
            color="danger"
          >
            <ion-label>{{ errorMessage }}</ion-label>
          </ion-item>
          <router-link to="/">
            <ion-button @click="login" :disabled="loginClicked"
              >Login</ion-button
            >
          </router-link>
        </form>
        <p v-if="!networkStatus">Stabilisci una connessione per effettuare il login.</p>
      </ion-content>
    </ion-page>
  </div>
</template>
  
<script lang="ts">
import { defineComponent } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
} from "@ionic/vue";
import { mapActions } from "vuex";
import { deleteDB } from "idb";
import axios from "axios";
import { useRouter } from "vue-router";
import { useNetwork } from "@/composables/useNetwork";

const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();

export default defineComponent({
  setup() {
    const { networkStatus } = useNetwork();
    console.log("Network status (component setup):", networkStatus.value);
    return {
      networkStatus,
    };
  },
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
  },
  data() {
    return {
      email: "",
      password: "",
      loginClicked: false,
      authenticationError: false,
      hasApiToken: !!localStorage.getItem("apiToken"),
      errorMessage: "",
    };
  },
  async mounted() {
    const savedApiToken = localStorage.getItem("apiToken");
    const router = useRouter();
    if (savedApiToken) {
      axios.defaults.headers.common["Authorization"] =
        "Bearer " + savedApiToken;
    }
    if (this.hasApiToken) {
      console.log(localStorage.getItem("apiToken"));
      try {
        const response = await axios.post(
          "https://rainwaterdrains.inyourlife.com/api/login",
          {
            apiToken: localStorage.getItem("apiToken"),
          }
        );
        if (response.data.result) {
          this.saveApiToken(localStorage.getItem("apiToken"));
          this.$emit("authenticated", true);
          console.log("ariva:", response.data);
        } else {
          localStorage.removeItem("apiToken");
          this.hasApiToken = false;
        }
      } catch (error) {
        console.error("Errore nella validazione del token:", error);
        localStorage.removeItem("apiToken");
        this.hasApiToken = false;
      }
    }
  },
  methods: {
    ...mapActions(["saveApiToken"]),
    async eliminaDatabase(databaseName: string) {
      try {
        await deleteDB(databaseName);
        console.log(`Database ${databaseName} eliminato con successo`);
      } catch (errore) {
        console.error(
          `Errore nell'eliminazione del database ${databaseName}:`,
          errore
        );
      }
    },
    async login() {
      this.errorMessage = "";
      try {
        this.authenticationError = false;
        this.loginClicked = true;
        const response = await axios.post(
          "https://rainwaterdrains.inyourlife.com/api/login",
          {
            email: this.email,
            password: this.password,
          }
        );

        if (response.data.result) {
          console.log("Response:", response.data.user);
          const user = response.data.user;
          localStorage.setItem("user", JSON.stringify(user.id));

          this.$emit("authenticated", true);

          const apiToken = response.data.user.api_token;
          localStorage.setItem("apiToken", apiToken);

          this.saveApiToken(apiToken);
          console.log(apiToken);

          this.eliminaDatabase("rwd_clients");
          this.eliminaDatabase("rwd_cities");
          this.eliminaDatabase("rwd_tags");
        } else {
          console.log("Autenticazione fallita");
        }
      } catch (error) {
        console.log("Errore qua:", error);
        this.authenticationError = true;
        if (error && error.message === "Network Error") {
          this.errorMessage =
            "É richiesta una connessione ad internet per effettuare il login!";
        } else {
          this.errorMessage =
            "Errore di autenticazione: email o password errate!";
        }
      } finally {
        this.loginClicked = false;
      }
    },
  },
});
</script>

<style scoped>
.authentication-error {
  font-size: 12px;
}
</style>
