import {createRouter,createWebHashHistory} from 'vue-router'
import Menu from './pages/Menu.vue'
import Cart from './pages/Cart.vue'
import Orders from './pages/Orders.vue'
import Account from './pages/Account.vue'
import Admin from './pages/Admin.vue'
import Notifications from './pages/Notifications.vue'
export default createRouter({history:createWebHashHistory(),routes:[{path:'/',component:Menu},{path:'/cart',component:Cart},{path:'/orders',component:Orders},{path:'/account',component:Account},{path:'/admin',component:Admin},{path:'/notifications',component:Notifications},{path:'/:pathMatch(.*)*',redirect:'/'}]})
