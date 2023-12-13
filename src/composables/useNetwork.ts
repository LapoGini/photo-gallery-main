import { ref, onMounted, onUnmounted } from 'vue';
import { Network, ConnectionType } from '@capacitor/network'
/*import { LocalNotifications, ScheduleOptions, ScheduleResult } from '@capacitor/local-notifications';*/
import { toastController } from '@ionic/vue';

// Interfaccia per definire il tipo ConnectionStatus
interface NetworkStatus {
  connected: boolean;
  connectionType: ConnectionType;
}

interface ExtendedNavigator extends Navigator {
  connection?: {
    type: string;
  };
}

export const useNetwork = () => {
  // Variabile per tenere traccia dello stato della connessione (online/offline)
  const networkStatus = ref<boolean>(true);
  const showToastBackground = ref(false);
  const previousNetworkStatus = ref<boolean>(true);

  // Funzione per ottenere e registrare lo stato della connessione di rete corrente
  const logCurrentNetworkStatus = async () => {
    const status: NetworkStatus = await Network.getStatus();
    const connectionType = getConnectionType();
    console.log('connectionType', connectionType);

    const getUserAgent = () => {
      return navigator.userAgent;
    };

    const userAgent = getUserAgent();
    console.log('userAgent', userAgent);

    const connectionTypeUA = getConnectionTypeFromUserAgent(userAgent);
    console.log('connectionTypeUA', connectionTypeUA);

    /*
    const networkInfo = await getNetworkInfo();
    console.log('Network info from IP:', networkInfo);
    */
  
    networkStatus.value = status.connected && connectionType !== 'Cell 2G connection';
    console.log('Network status:', networkStatus.value);
  };

  const getConnectionTypeFromUserAgent = (userAgent:any) => {
    // Verifica se l'User-Agent contiene indicazioni sul tipo di connessione
    if (userAgent.includes('Mobile') && userAgent.includes('LTE')) {
      return '4G';
    } else if (userAgent.includes('Mobile') && userAgent.includes('3G')) {
      return '3G';
    } else if (userAgent.includes('Mobile') && userAgent.includes('2G')) {
      return '2G';
    } else if (userAgent.includes('WiFi')) {
      return 'WiFi';
    } else {
      return 'Unknown';
    }
  };

  /*
  const getNetworkInfo = async () => {
    const apiKey = '93b4a38a79cd3d'; // Inserisci la tua chiave API reale qui
    try {
      const response = await fetch(`https://ipinfo.io/json?token=${apiKey}`);
      const data = await response.json();
      console.log('Network info:', data);
      return data;
    } catch (error) {
      console.error('Error fetching network info:', error);
      return null;
    }
  };
  */
  

  const getConnectionType = () => {
    const extendedNavigator = navigator as ExtendedNavigator;
    console.log('extendedNavigator', extendedNavigator);
    const networkState = extendedNavigator.connection?.type;
    console.log('networkState', networkState);
  
    const states = {
      'unknown': 'Unknown connection',
      'ethernet': 'Ethernet connection',
      'wifi': 'WiFi connection',
      '2g': 'Cell 2G connection',
      '3g': 'Cell 3G connection',
      '4g': 'Cell 4G connection',
      'cellular': 'Cell generic connection',
      'none': 'No network connection'
    };
  
    if (networkState && states[networkState]) {
      return states[networkState];
    }
    return 'Unknown';
  }

  // Listener per monitorare gli eventi di cambio dello stato della connessione di rete
  const networkListener = Network.addListener('networkStatusChange', async (status) => {

    console.log('Listener networkStatusChange attivato', status);


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
