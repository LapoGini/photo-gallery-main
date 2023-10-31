import { ref, onMounted, onUnmounted } from 'vue';
import { Network, ConnectionType  } from '@capacitor/network'
/*import { LocalNotifications, ScheduleOptions, ScheduleResult } from '@capacitor/local-notifications';*/
import { toastController } from '@ionic/vue';

// Interfaccia per definire il tipo ConnectionStatus
interface NetworkStatus {
  connected: boolean;
  connectionType: ConnectionType;
}
  
export const useNetwork = () => {
   // Variabile per tenere traccia dello stato della connessione (online/offline)
  const networkStatus = ref<boolean>(true);
  const showToastBackground = ref(false);
  const previousNetworkStatus = ref<boolean>(true);

  // Funzione per ottenere e registrare lo stato della connessione di rete corrente
  const logCurrentNetworkStatus = async () => {
    // Stato della connessione ottenuto dal plugin Capacitor-Network
    const status: NetworkStatus = await Network.getStatus();

    // Aggiornare la variabile (true se online, false se offline)
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
        mode: 'ios',   
        color: toastColor,
        message: toastMessage,
        duration: 1000,
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

  // Eseguire la funzione "logCurrentNetworkStatus" all'avvio del composable
  onMounted(() => {
    logCurrentNetworkStatus();
  });

  // Rimuovere il listener quando il composable viene dismesso per evitare memory leak
  onUnmounted(() => {
    networkListener.remove();
  });

  return {
    networkStatus,
    logCurrentNetworkStatus,
    showToastBackground,
  };
};
