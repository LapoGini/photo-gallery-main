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
          <ion-label> {{ tagType.tag_type_name }}: </ion-label>
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
            class="input-box-textarea"
            v-model="notes"
            placeholder="Inserisci le tue note qui"
            auto-grow="true"
          ></ion-textarea>
        </div>

        <ion-button @click="goBack">
          ANNULLA
          <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
        </ion-button>
        <ion-button :disabled="isSaving" @click="saveItem">
          SALVA
          <ion-icon :icon="arrowRedoCircleSharp"></ion-icon>
        </ion-button>
      </div>
      <ion-alert
        class="alert"
        :is-open="isOpen"
        header="Errore"
        :sub-header="connection"
        message="Errore durante il salvataggio della caditoia!"
        :buttons="alertButtons"
      ></ion-alert>
    </ion-content>
    <ion-loading
      class="loading-backdrop"
      :is-open="showLoading"
      message="Salvataggio in corso..."
    ></ion-loading>
    <div class="toast-background" v-if="showToastBackground"></div>
  </ion-page>
</template>


<script setup lang="ts">
declare var cordova: any;
declare var window: any;

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
import { IonLoading } from "@ionic/vue";
import axios from "axios";
import { ref, onMounted, watch, computed } from "vue";
import { useStore } from "vuex";
import { getTagsFromDB } from "@/services/db_tags.js";
import { saveItemToDB } from "@/services/db_items.js";
import { Filesystem, Directory } from "@capacitor/filesystem";
import imageCompression from "browser-image-compression";

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
const isSaving = ref(false);
const showLoading = ref(false);

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
    localStorage.setItem("selectedTags", JSON.stringify(newValue));
  },
  { deep: true }
);

watch(address, (newValue) => {
  localStorage.setItem("address", newValue);
});

watch(notes, (newValue) => {
  localStorage.setItem("notes", newValue);
});

watch(height, (newValue) => {
  localStorage.setItem("height", newValue);
});

watch(width, (newValue) => {
  localStorage.setItem("width", newValue);
});

watch(depth, (newValue) => {
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
const unixTimestamp = date.getTime();

const streetValue = localStorage.getItem("street");
const addStreetValue = localStorage.getItem("addStreet");

const user_id = localStorage.getItem("user");
const lat = localStorage.getItem("photoLatitude");
const long = localStorage.getItem("photoLongitude");
const id_da_app = `${unixTimestamp}_${user_id}_${lat}_${long}`;

const tagsFromLocalStorage = JSON.parse(
  localStorage.getItem("selectedTags") || "{}"
);

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

const getCurrentHourFolderPath = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");

  return `${year}_${month}_${day}_${hour}`;
};

const createDirectoryIfNotExists = async (
  directory: Directory,
  path: string
) => {
  try {
    await Filesystem.stat({ directory, path });
  } catch (e) {
    await Filesystem.mkdir({ directory, path, recursive: true });
  }
};

const saveItemToDeviceMemory = async (data: any) => {
  const hourFolderPath = getCurrentHourFolderPath();
  const itemsFolderPath = `items/${hourFolderPath}`;
  const fileName = `${itemsFolderPath}/${id_da_app}.json`;

  // Assicurati che la cartella esista
  await createDirectoryIfNotExists(Directory.Documents, itemsFolderPath);
  // await createDirectoryIfNotExists(Directory.External, itemsFolderPath);

  //listFiles();
  //readFromSDCard();

  // Funzione di utilità per effettuare il salvataggio
  const saveToDirectory = async (directory: Directory) => {
    try {
      const base64Data = stringToBase64(JSON.stringify(data));
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: directory,
        recursive: true,
      });

      if (result.uri) {
        console.log(`Item saved to ${directory} at:`, result.uri);
      } else {
        console.warn(
          `File might not have been saved successfully to ${directory}.`,
          result
        );
      }
    } catch (err) {
      if (err.message === "FILE_NOTCREATED") {
        alert(
          `Errore: Impossibile creare il file in ${directory}. Controlla i permessi o lo spazio disponibile.`
        );
      } else {
        console.error(`Error saving item to ${directory}:`, err.message || err);
      }
    }
  };

  // Salva in memoria interna
  await saveToDirectory(Directory.Documents);
  await verifyFileSaved(fileName, Directory.Documents);
};

const verifyFileSaved = async (path: any, directory: any) => {
  try {
    // Tenta di leggere il file appena salvato
    const file = await Filesystem.readFile({ path, directory });
    if (file.data) {
      console.log(`Verifica superata: il file esiste in ${directory}`);
    } else {
      console.warn(`Verifica fallita: il file non esiste in ${directory}`);
    }
  } catch (err) {
    console.error(`Errore durante la verifica del file in ${directory}:`, err);
  }
};

// Funzione per convertire una stringa in base64
const stringToBase64 = (str: string) => {
  let encoded = "";
  try {
    let encoder = new TextEncoder();
    let data = encoder.encode(str);
    encoded = btoa(String.fromCharCode.apply(null, data as any));
  } catch (e) {
    console.error("Failed to convert string to base64:", e);
  }
  return encoded;
};

// FUNZIONE PER COMPRIMERE L'IMMAGINE IN BASE&$
const compressImage = async (imageBlob: Blob): Promise<Blob> => {
  const options = {
    maxSizeMB: 0.08,
    maxWidthOrHeight: 600,
    useWebWorker: true,
  };

  const imageFile = new File([imageBlob], "compressedImage.jpeg", {
    type: "image/jpeg",
  });

  try {
    return await imageCompression(imageFile, options);
  } catch (error) {
    console.error("Error compressing the image:", error);
    return imageBlob;
  }
};

// CREA LA CARTELLA ITEMS NELLA MEOMRIA INTERNA ED ESTRENA
const createItemsDirectory = async (directory: Directory) => {
  const path = "items";
  try {
    // Controlla prima se la directory esiste
    const info = await Filesystem.stat({ path: path, directory: directory });
    if (info.type === "directory") {
      console.log(`Directory 'items' già esistente in ${directory}.`);
      return; // Se esiste, esce dalla funzione
    }
  } catch (err) {
    // Se la directory non esiste, il codice continuerà dopo questo blocco catch
    console.log(
      `La directory 'items' non esiste in ${directory}, procedo con la creazione.`
    );
  }

  try {
    // Ora tenta di creare la directory
    const result = await Filesystem.mkdir({
      path: path,
      directory: directory,
      recursive: true,
    });
    console.log("Risultato Filesystem.mkdir:", result);
  } catch (err) {
    console.error(
      `Errore durante la creazione della directory 'items' in ${directory}:`,
      err.message || err
    );
  }
};

// Funzione per gestire gli errori
const onError = (error: any) => {
  console.error("Error:", error);
};

const saveItem = async () => {
  isSaving.value = true;
  showLoading.value = true;

  const picTitle = localStorage.getItem("photoTitle");
  const photo = await getPhotoFromDB(picTitle);
  if (!photo || !photo.base64Data) {
    return;
  }
  const compressedImageBlob = await compressImage(photo.base64Data);
  const base64ImageStringCompressed = await blobToBase64(compressedImageBlob);
  const base64ImageStringOriginal = await blobToBase64(photo.base64Data);

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
    base64ImageString: base64ImageStringOriginal,
    tags: localStorage.getItem("selectedTags")
      ? localStorage.getItem("selectedTags")
      : null,
  };

  await createItemsDirectory(Directory.Documents);
  //await createItemsDirectory(Directory.External);

  await saveItemToDeviceMemory({
    ...itemData,
    base64ImageString: base64ImageStringCompressed,
  });

  console.log("Original length:", JSON.stringify(itemData).length);

  try {
    const apiToken = store.getters.getApiToken;
    const responsePhoto = await uploadPhotoToServer(base64ImageStringOriginal);
    const response = await axios.post(
      "https://rainwaterdrains.inyourlife.com/api/item",
      itemData,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );
    if (response.data) {
      showLoading.value = false;
      savedLocally.value = false;
      isSaving.value = false;

      clearLocalStorageExceptUser();
      //await new Promise((resolve) => setTimeout(resolve, 3000));

      router.push("/ilTuoLuogo");
    }
  } catch (error) {
    console.error("Error during remote saving:", error);
    try {
      // Tentativo di salvataggio locale in caso di fallimento del salvataggio remoto
      await saveItemToDB(itemData);
      showLoading.value = false;
      savedLocally.value = true;
      isSaving.value = false;
      clearLocalStorageExceptUser();
      router.push("/ilTuoLuogo");
    } catch (errorLocalSave) {
      console.error("Error during local saving:", errorLocalSave);
      // Mostra l'alert solo se anche il salvataggio locale fallisce
      showLoading.value = false;
      isOpen.value = true;
      isSaving.value = false;
      router.push("/ilTuoLuogo");
    }
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

ion-select.my-select {
  background-color: rgb(255, 255, 254);
  color: black;
  padding-left: 10px;
  padding-right: 10px;
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

.input-box-textarea {
  max-height: 130px;
  overflow-y: auto;
  padding: 10px;
  background-color: white;
  color: black;
}

.box-select,
.input-container {
  margin-top: 20px;
}

.input-box {
  background-color: white;
  color: black;
}

.alert {
  text-align: center;
}

.loading-backdrop {
  backdrop-filter: blur(5px);
}
</style>