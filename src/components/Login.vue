<template>
  <ion-page>
    <ion-content class="ion-padding custom-background">
      <div class="login-container">
        <div class="login-content">
          <ion-header>
            <ion-toolbar>
              <ion-title>
                <img
                  src="https://rainwaterdrains.inyourlife.com/build/assets/logo-zanetti-ambiente-9d418d94.png"
                  alt="Logo"
                  class="logo"
                />
              </ion-title>
            </ion-toolbar>
          </ion-header>
          <form @submit.prevent="login">
            <ion-item lines="full" class="custom-input">
              <ion-label position="floating">Email</ion-label>
              <ion-input type="email" v-model="email"></ion-input>
            </ion-item>
            <ion-item lines="full" class="custom-input">
              <ion-label position="floating">Password</ion-label>
              <ion-input type="password" v-model="password"></ion-input>
            </ion-item>
            <ion-item
              class="authentication-error"
              v-if="authenticationError"
              color="danger"
            >
              <ion-label>{{ errorMessage }}</ion-label>
            </ion-item>
            <ion-button
              expand="full"
              type="submit"
              :disabled="loginClicked"
              class="ion-margin-top custom-button"
            >
              Login
            </ion-button>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
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
      lastLoginTime: null as number | null,
    };
  },
  async mounted() {
    const savedApiToken = localStorage.getItem("apiToken");
    const router = useRouter();
    if (savedApiToken) {
      axios.defaults.headers.common["Authorization"] =
        "Bearer " + savedApiToken;
    }

    // Controlla se le credenziali salvate sono valide per l'autologin
    const savedCredentialsString = localStorage.getItem("savedCredentials");
    if (savedCredentialsString) {
        const savedCredentials = JSON.parse(savedCredentialsString);
        const currentTime = new Date().getTime();
        const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000; // Una settimana in millisecondi

        if (currentTime - savedCredentials.timestamp < oneWeekInMilliseconds) {
            // Le credenziali sono ancora valide, procedi con l'autologin
            this.email = savedCredentials.email;
            this.password = atob(savedCredentials.passwordHash); // Decodifica la password
            this.loginOffline(); // Procedi con il login offline
        } else {
            // Le credenziali non sono valide o sono scadute
            console.log("Credenziali scadute o non presenti, richiesta di autenticazione");
            localStorage.removeItem("savedCredentials");
        }
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
    hashPassword(password: any) {
      return btoa(password);
    },
    async loginOffline() {
      const savedCredentials = JSON.parse(
        localStorage.getItem("savedCredentials")
      );
      if (
        savedCredentials &&
        savedCredentials.email === this.email &&
        savedCredentials.passwordHash === this.hashPassword(this.password)
      ) {
        console.log("Accesso offline riuscito");
        this.$emit("authenticated", true);
        // Prosegui con il login offline
      } else {
        console.log("Credenziali offline non corrispondenti");
        this.authenticationError = true;
        this.errorMessage =
          "Errore di autenticazione offline: email o password errate!";
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

          const currentTime = new Date().getTime();
          localStorage.setItem(
            "savedCredentials",
            JSON.stringify({
              email: this.email,
              passwordHash: this.hashPassword(this.password),
              timestamp: currentTime,
            })
          );

          // Aggiorna il lastLoginTime
          this.lastLoginTime = currentTime;

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
          this.loginOffline();
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
/* Sfondo e stile generale */
.custom-background {
  background: linear-gradient(
    45deg,
    #83a4d4,
    #b6fbff
  ); /* Sfondo con gradiente */
  color: #333; /* Colore del testo */
}

/* Container del login */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.login-content {
  max-width: 300px;
  width: 90%;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.8); /* Sfondo semi-trasparente */
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Stile degli input */
.custom-input {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  margin-bottom: 10px;
}

/* Animazione del logo */
.animated-logo {
  animation: float 3s ease-in-out infinite;
}

/* Animazione */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Bottone personalizzato */
.custom-button {
  background: linear-gradient(
    to right,
    #56ab2f,
    #a8e063
  ); /* Gradiente per il bottone */
  color: white;
}

.custom-button:active {
  transform: scale(0.98); /* Effetto click */
}

/* Messaggio di errore */
.authentication-error {
  font-size: 12px;
  color: #d9534f;
}
</style>
