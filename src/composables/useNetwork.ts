import { ref, onMounted, onUnmounted } from 'vue';
import { Network, ConnectionType  } from '@capacitor/network'
/*import { LocalNotifications, ScheduleOptions, ScheduleResult } from '@capacitor/local-notifications';*/
import { toastController } from '@ionic/vue';

// Interfaccia per definire il tipo ConnectionStatus
interface NetworkStatus {
  connected: boolean;
  connectionType: ConnectionType;
}

// Funzione per pianificare una notifica locale
/*const scheduleCustomNotification = async (options: ScheduleOptions): Promise<ScheduleResult> => {
  try {
    const result: ScheduleResult = await LocalNotifications.schedule(options);
    console.log('Notification scheduled successfully:', result);
    return result;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error; // Rilancia l'errore per gestirlo in altre parti del codice, se necessario.
  }
};

// Funzione per inviare una notifica con lo stato della connessione
const sendNetworkStatusNotification = async (connected: boolean): Promise<ScheduleResult | void> => {
  try {
    const options: ScheduleOptions = {
      notifications: [
        {
          title: 'Stato connessione di rete',
          body: `Sei ${connected ? 'Online' : 'Offline'}`,
          id: 100,
          schedule: { at: new Date(Date.now() + 1000) },
          iconColor: connected ? '#00FF00' : '#FF0000',
        },
      ],
    };
    const result = await scheduleCustomNotification(options);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return undefined;
  }
};*/
  
export const useNetwork = () => {
   // Variabile per tenere traccia dello stato della connessione (online/offline)
  const networkStatus = ref<boolean>(true);
  const showToastBackground = ref(false);
  const previousNetworkStatus = ref<boolean>(true);

  // Funzione per ottenere e registrare lo stato della connessione di rete corrente
  const logCurrentNetworkStatus = async () => {
    // Stato della connessione ottenuto dal plugin Capacitor-Network
    const status: NetworkStatus = await Network.getStatus();

    // Aggiorna la variabile (true se online, false se offline)
    networkStatus.value = status.connected;
    console.log('Network status:', status.connected);

   
  };

  // Listener per monitorare gli eventi di cambio dello stato della connessione di rete
  const networkListener = Network.addListener('networkStatusChange', async (status) => {

    if (status.connected !== previousNetworkStatus.value) {
      networkStatus.value = status.connected;
      console.log('Network status changed', status.connected);

      previousNetworkStatus.value = status.connected;

      const toastColor = status.connected ? 'success' : 'danger';
      const toastMessage = `Sei ${status.connected ? 'Online!' : 'Offline!'}`;
      const toast = await toastController.create({
        position: 'middle',
        color: toastColor,
        message: toastMessage,
        duration: 7000,
      });
      showToastBackground.value = true;
      await toast.present();
      await toast.onDidDismiss();
      showToastBackground.value = false;
    } else {
      // Aggiorna solo lo stato attuale
      networkStatus.value = status.connected;
    }

    
  });

  // Esegui la funzione "logCurrentNetworkStatus" all'avvio del composable
  onMounted(() => {
    logCurrentNetworkStatus();
  });

  // Rimuovi il listener quando il composable viene dismesso per evitare memory leak
  onUnmounted(() => {
    networkListener.remove();
  });

  return {
    networkStatus,
    logCurrentNetworkStatus,
    showToastBackground,
  };
};
