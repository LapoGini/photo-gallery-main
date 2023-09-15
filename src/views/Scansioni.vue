<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>Scansioni</h1>
      </div>
      <div class="sub-container">
        <div class="input-buttons">
          <div class="date-buttons">
            <ion-button @click="setToday">Oggi</ion-button>
            <ion-button @click="setYesterday">Ieri</ion-button>
            <h2>
              Scegli la data:
            </h2>
            <input class="input-date" id="dateInput" type="date" v-model="rawSelectedDate" ref="datePicker">
          </div>
        </div>
        <div class="scansioni" v-if="selectedDate !== null">
          <div class="box-title">
              <h5>
                Visualizza le caditoie scansionate il:
              </h5>
              <p class="choose-date">
                {{formattedSelectedDate}}
              </p>
          </div>
        </div>
          <ion-button @click="getCaditoieScansionate()">
            SCANSIONA
            <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
          </ion-button>
      </div>
      <div class="caditoie-scansionate">
          <div class="card" v-for="caditoia in caditoie" :key="caditoia.id">
              <div class="card-header">
                <div class="address">
                  <span class="street-name">{{ caditoia.strada_nome }}</span> - <span class="city-name">{{ caditoia.comune_nome }}</span>
                </div>
                <span class="date">{{ caditoia.data_caditoia }}</span>
              </div>
              <div class="card-body">
                  <div class="card-image">
                      <img :src="caditoia.foto_id" alt="Foto caditoia">
                  </div>
                  <div class="card-details">
                      <div class="coordinates">
                          Lat: <span class="latitude">{{ caditoia.caditoie_lat }}</span>,
                          Lng: <span class="longitude">{{ caditoia.caditoie_lng }}</span>
                      </div>
                      <div class="tipologia">{{ caditoia.tipologia_tag_id }}</div>
                      <div class="ubicazione">{{ caditoia.ubicazione || 'N/A' }}</div>
                      <div class="stato">{{ caditoia.stato_tag_id }}</div>
                  </div>
              </div>
              <div class="card-footer">
                  Note: <span class="notes">{{ caditoia.caditoie_note || 'Nessuna nota' }}</span>
              </div>
          </div>
      </div>

    </ion-content>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>


<script setup lang="ts">
import { IonPage, IonContent, IonIcon, IonButton, IonSelect, IonSelectOption, IonLabel, IonDatetime } from '@ionic/vue';
import { arrowRedoCircleSharp } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useNetwork } from '@/composables/useNetwork';
import { ref, watch  } from 'vue';
import { useStore } from 'vuex';

const formatDate = (date: Date) => {
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0'); // i mesi vanno da 0 a 11, quindi aggiungo 1
  const yyyy = date.getFullYear().toString();
  return `${dd}/${mm}/${yyyy}`;
}

const datePicker = ref<HTMLInputElement | null>(null);
const rawSelectedDate = ref<string | null>(new Date().toISOString().slice(0, 10));
const formattedSelectedDate = ref<string | null>(formatDate(new Date()));
const store = useStore();
const caditoie = ref<Array<any>>([]);


watch(rawSelectedDate, (newValue) => {
    if (newValue) {
        const parts = newValue.split('-');
        const dateObj = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        formattedSelectedDate.value = formatDate(dateObj);
    } else {
        formattedSelectedDate.value = null;
    }
});


const setToday = () => {
    const today = new Date();
    rawSelectedDate.value = today.toISOString().slice(0, 10);
}

const setYesterday = () => {
    const yesterday = new Date(Date.now() - 86400000);
    rawSelectedDate.value = yesterday.toISOString().slice(0, 10);
}

const openDatePicker = () => {
  datePicker.value?.focus();
}


const getCaditoieScansionate = async () => {
  try {
    const apiToken = store.getters.getApiToken;
        const payload = {
            data: {
                giorno: formattedSelectedDate,
                user: localStorage.getItem('user'),
            }
        };
        const response = await axios.post('https://rainwaterdrains.inyourlife.com/api/scansioni', payload, {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });

    if (response.data.result) {
      caditoie.value = response.data.caditoie;

      console.log(caditoie);

    } else {
      console.error('Errore nella risposta dell\'API:', response.data.error);
    }
  } catch (error) {
    console.error('Errore durante la chiamata API:', error);
  }
};


const { networkStatus, logCurrentNetworkStatus, showToastBackground } = useNetwork();

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

</script>


<style scoped>
ion-content {
  --background:#370006;
}

.main-container {
  background-color: #A60016;
  border-top: 3px solid rgb(255, 255, 255);
  border-bottom: 3px solid rgb(255, 255, 255);
  width: 100%;
  padding: 20px;
  text-align: center;
  color: white;
  font-weight: bolder;
}

h1 {
  font-weight: bold;
}

.sub-container {
  width: 90%;
  margin: auto;
  margin-top: 50px;
  color: white;
}

ion-label {
  font-size: 14px;
  font-weight: lighter;
}

ion-select {
  margin-top: 20px;
  background-color: rgb(255, 255, 254);
  color: black;
}

ion-datetime {
background-color: rgb(33, 33, 33);
max-width: 100%;
}

ion-icon {
  color: white;
  padding-left: 0.2rem;
  font-weight: bolder;
}

ion-button {
  width: 100%;
  --border-radius: 25px;
  margin-top: 20px;
  --background: #A60016;
  font-weight: bolder;
}

.toast-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

h2 {
  text-align: center;
}

.box-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.choose-date {
  padding: 5px;
  border: 1px solid white;
  border-radius: 5px;
}

.input-date {
  width: 100%;
  --border-radius: 25px;
  margin-top: 20px;
  --background: #A60016;
  font-weight: bolder;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
}

.input-date:focus {
    outline: none;
    --background: #A60016;
}

.caditoie-scansionate {
  margin-top: 30px;
}

.card {
    background-color: #d9d9d9;
    border: 1px solid #ccc;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.address {
  display: block;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-body {
    display: flex;
    gap: 15px;
}

.card-image img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
}

.card-details {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.notes {
    color: #777;
}

</style>
