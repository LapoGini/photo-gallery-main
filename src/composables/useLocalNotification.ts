import { LocalNotifications, ScheduleOptions, ScheduleResult, PermissionStatus } from '@capacitor/local-notifications';

// Funzione per controllare i permessi delle notifiche
const checkPermissions = async (): Promise<PermissionStatus> => {
  try {
    const permissions = await LocalNotifications.checkPermissions();
    console.log('Permissions:', permissions);
    return permissions;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return null;
  }
};

// Funzione per richiedere i permessi delle notifiche
const requestPermissions = async (): Promise<PermissionStatus> => {
  try {
    const permissions = await LocalNotifications.requestPermissions();
    console.log('Requested Permissions:', permissions);
    return permissions;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return null;
  }
};

// Funzione per pianificare una notifica locale
const scheduleLocalNotification = async () => {
  const options: ScheduleOptions = {
    notifications: [
      {
        title: 'TITOLONE',
        body: 'CORPO DELLA NOTIFICA',
        id: 1,
        schedule: { at: new Date(Date.now() + 5000) },
      },
    ],
  };
  try {
    const result: ScheduleResult = await LocalNotifications.schedule(options);
    console.log('Notification scheduled successfully:', result);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

// Esportare le funzioni
export { checkPermissions, scheduleLocalNotification, requestPermissions };
