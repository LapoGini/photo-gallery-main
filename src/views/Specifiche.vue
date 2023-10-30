<template>
  <ion-page>
    <ion-content>
      <div class="main-container">
        <h1>Specifiche:</h1>
      </div>
      <div class="sub-container">
        <div
          class="box-select"
          v-for="tagType in tags"
          :key="tagType.tag_type_id"
        >
          <ion-label class="choose-client">
            {{ tagType.tag_type_name }}:
          </ion-label>
          <ion-select
            class="my-select"
            v-model="selectedTags[tagType.tag_type_id]"
            :label="tagType.tag_type_name"
          >
            <ion-select-option
              v-for="option in tagType.tags"
              :key="option.tag_id"
              :value="option.tag_id"
            >
              {{ option.tag_name }}
            </ion-select-option>
          </ion-select>
        </div>

        <div class="grglia-selected" v-if="isGrigliaSelected">
          <div class="input-container">
            <ion-label>Altezza:</ion-label>
            <ion-input
              class="input-box"
              v-model="height"
              placeholder="Altezza..."
            ></ion-input>
          </div>
          <div class="input-container">
            <ion-label>Larghezza:</ion-label>
            <ion-input
              class="input-box"
              v-model="width"
              placeholder="Larghezza..."
            ></ion-input>
          </div>
          <div class="input-container">
            <ion-label>Profondità:</ion-label>
            <ion-input
              class="input-box"
              v-model="depth"
              placeholder="Profondità..."
            ></ion-input>
          </div>
        </div>

        <div class="input-container">
          <ion-label> Civico/Ubicazione:</ion-label>
          <ion-input
            class="input-box"
            v-model="address"
            placeholder="Inserisci numero civico / ubicazione"
          ></ion-input>
        </div>

        <div class="input-container">
          <ion-label>Note:</ion-label>
          <ion-textarea
            class="input-box"
            v-model="notes"
            placeholder="Inserisci le tue note qui"
          ></ion-textarea>
        </div>

        <ion-button @click="goBack">
          ANNULLA
          <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
        </ion-button>
        <ion-button @click="saveItem">
          SALVA
          <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
        </ion-button>
      </div>
      <ion-alert
        class="alert"
        :is-open="isOpen"
        header="Successo"
        :sub-header="connection"
        message="La caditoia è stata salvata correttamente!"
        :buttons="alertButtons"
      ></ion-alert>
    </ion-content>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>


<script setup lang="ts">
import {
  IonPage,
  IonContent,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonInput,
  IonTextarea,
  IonAlert,
} from "@ionic/vue";
import { arrowRedoCircleSharp } from "ionicons/icons";
import { useRouter } from "vue-router";
import {
  usePhotoGallery,
  UserPhoto,
  uploadPhotoToServer,
} from "@/composables/usePhotoGallery";
import { useNetwork } from "@/composables/useNetwork";
import axios from "axios";
import { ref, onMounted, watch, computed } from "vue";
import { useStore } from "vuex";
import { getTagsFromDB } from "@/services/db_tags.js";
import { saveItemToDB } from "@/services/db_items.js";

interface TagType {
  tag_type_id: string;
  tag_type_name: string;
  tags: Array<{ tag_id: string | number; tag_name: string }>;
}

const { networkStatus, logCurrentNetworkStatus, showToastBackground } =
  useNetwork();
const { getPhotoFromDB, blobToBase64 } = usePhotoGallery();
const tags = ref<TagType[]>([]);
const store = useStore();
const router = useRouter();
const address = ref("");
const notes = ref("");
const height = ref("");
const width = ref("");
const depth = ref("");
const selectedTags = ref<Record<string, any>>({});
const isOpen = ref(false);
const savedLocally = ref(false);
const alertButtons = ["OK"];

const getNetworkStatus = async () => {
  await logCurrentNetworkStatus();
};

const goBack = () => {
  router.go(-1);
};

const fetchTags = async () => {
  try {
    const apiToken = store.getters.getApiToken;
    const response = await axios.get(
      "https://rainwaterdrains.inyourlife.com/api/tags/item",
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    tags.value = response.data.data;
    console.log("Tags:", tags.value);
  } catch (error) {
    console.error("Errore durante il recupero dei tag:", error);
    tags.value = await getTagsFromDB();
  }
};

const isGrigliaSelected = computed(() => {
  for (let key in selectedTags.value) {
    const selectedTagId = selectedTags.value[key];
    const tagType = tags.value.find((t) => t.tag_type_id == key);
    if (tagType) {
      const tag = tagType.tags.find((t) => t.tag_id == selectedTagId);
      if (tag !== undefined) {
        if (tag.tag_name === "Griglia") {
          console.log("qua funzia");
          return true;
        }
      }
    }
  }
  return false;
});

watch(
  selectedTags,
  (newValue) => {
    console.log("selectedTags changed:", newValue);
    localStorage.setItem("selectedTags", JSON.stringify(newValue));
  },
  { deep: true }
);

watch(address, (newValue) => {
  console.log("Address changed:", newValue);
  localStorage.setItem("address", newValue);
});

watch(notes, (newValue) => {
  console.log("Notes changed:", newValue);
  localStorage.setItem("notes", newValue);
});

watch(height, (newValue) => {
  console.log("height changed:", newValue);
  localStorage.setItem("height", newValue);
});

watch(width, (newValue) => {
  console.log("width changed:", newValue);
  localStorage.setItem("width", newValue);
});

watch(depth, (newValue) => {
  console.log("depth changed:", newValue);
  localStorage.setItem("depth", newValue);
});

watch(isGrigliaSelected, (newValue) => {
  if (!newValue) {
    localStorage.removeItem("width");
    localStorage.removeItem("height");
    localStorage.removeItem("depth");

    width.value = "";
    height.value = "";
    depth.value = "";
  }
});

onMounted(async () => {
  await Promise.all([fetchTags()]);
});

const timestampString = localStorage.getItem("photoTimestamp");
const timestampInMilliseconds = Number(timestampString);
const date = new Date(timestampInMilliseconds);
const formattedDate = date.toISOString().slice(0, 19).replace("T", " ");

const streetValue = localStorage.getItem("street");
const addStreetValue = localStorage.getItem("addStreet");

const user_id = localStorage.getItem("user");
const lat = localStorage.getItem("photoLatitude");
const long = localStorage.getItem("photoLongitude");
const id_da_app = `${formattedDate}-${user_id}-${lat}-${long}`;

const tagsFromLocalStorage = JSON.parse(
  localStorage.getItem("selectedTags") || "{}"
);
console.log("Tags from localStorage:", tagsFromLocalStorage);

const clearLocalStorageExceptUser = () => {
  for (let key in localStorage) {
    if (
      key !== "user" &&
      key !== "apiToken" &&
      key !== "city" &&
      key !== "street" &&
      key !== "addStreet"
    ) {
      localStorage.removeItem(key);
    }
  }
};

const connection = computed(() => {
  return savedLocally.value ? "Non sei connesso" : "Sei connesso";
});

const saveItem = async () => {
  const picTitle = localStorage.getItem("photoTitle");
  console.log(picTitle);
  const photo = await getPhotoFromDB(picTitle);
  console.log(photo);

  if (!photo || !photo.base64Data) {
    console.error("Photo non trovata in indexedDB");
    return;
  }

  const base64ImageString = await blobToBase64(photo.base64Data);
  const itemData = {
    user_id: user_id,
    latitude: lat,
    longitude: long,
    altitude: localStorage.getItem("photoAltitude"),
    accuracy: localStorage.getItem("photoAccuracy"),
    time_stamp_pulizia: formattedDate,
    pic: localStorage.getItem("photoTitle") + ".jpg",
    street_id: streetValue ? streetValue : addStreetValue,
    height: localStorage.getItem("height"),
    width: localStorage.getItem("width"),
    depth: localStorage.getItem("depth"),
    civic: localStorage.getItem("address"),
    note: localStorage.getItem("notes"),
    id_da_app: id_da_app,
    tags: localStorage.getItem("selectedTags")
      ? localStorage.getItem("selectedTags")
      : null,
  };
  try {
    console.log("ITEM DATA", itemData);
    const apiToken = store.getters.getApiToken;
    const responsePhoto = await uploadPhotoToServer(base64ImageString);
    const response = await axios.post(
      "https://rainwaterdrains.inyourlife.com/api/item",
      itemData,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    console.log(
      "RISPOSTA DELLA CHIAMATA API PER SALVARE L'ITEM",
      response.data
    );
    if (response.data) {
      console.log("Item saved:", response.data);
      isOpen.value = true;
      savedLocally.value = false;
      clearLocalStorageExceptUser();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      router.push("/ilTuoLuogo");
    }
  } catch (error) {
    console.error("Error saving item:", error);
    await saveItemToDB(itemData);
    isOpen.value = true;
    savedLocally.value = true;
    clearLocalStorageExceptUser();
    router.push("/ilTuoLuogo");
  }
};
</script>


<style scoped>
ion-content {
  --background: #370006;
}

.main-container {
  background-color: #a60016;
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
  font-size: 20px;
  font-weight: bolder;
  margin-top: 10px;
}

ion-select {
  background-color: rgb(255, 255, 254);
  color: black;
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
  --background: #a60016;
  font-weight: bolder;
}

.box-select,
.input-container {
  margin-top: 20px;
}

.input-box {
  background-color: white;
  color: black;
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

.alert {
  text-align: center;
}
</style>