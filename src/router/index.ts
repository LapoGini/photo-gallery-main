import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Home from '@/views/Home.vue'
import SceltaLuogo from '@/views/SceltaLuogo.vue';
import Camera from '@/views/Camera.vue';
import Network from '@/views/Network.vue';
import LocalNotification from '@/views/LocalNotification.vue';
import IlTuoLuogo from '@/views/IlTuoLuogo.vue';
import Sincro from '@/views/Sincro.vue';
import Elimina from '@/views/Elimina.vue';
import Scansioni from '@/views/Scansioni.vue';
import Specifiche from '@/views/Specifiche.vue';
import FotoMap from '@/views/FotoMap.vue';


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: Home,
    name: 'SceltaCliente',
  },
  {
    path: '/sceltaLuogo',
    component: SceltaLuogo,
    name: 'SceltaLuogo',
  },
  {
    path: '/ilTuoLuogo',
    component: IlTuoLuogo,
    name: 'IlTuoLuogo',
    props: true,
  },
  {
    path: '/fotoMap',
    component: FotoMap,
    name: 'FotoMap',
  },
  {
    path: '/specifiche',
    component: Specifiche,
    name: 'Specifiche',
  },
  {
    path: '/sincro',
    component: Sincro,
    name: 'Sincro',
  },
  {
    path: '/elimina',
    component: Elimina,
    name: 'Elimina',
  },
  {
    path: '/scansioni',
    component: Scansioni,
    name: 'Scansioni',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router