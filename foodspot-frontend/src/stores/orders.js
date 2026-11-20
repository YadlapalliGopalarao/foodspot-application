import {ref} from 'vue'
import {defineStore} from 'pinia'
import {api} from '../services/api.js'
export const useOrders=defineStore('orders',()=>{
 const orders=ref([])
 async function load(){orders.value=await api.orders()}
 async function place(items){const created=await api.place(items);try{await api.notify('Your order was placed.')}catch(e){console.warn('Notification unavailable',e)}return created}
 async function cancel(id){await api.cancel(id);try{await api.notify('Order cancelled.')}catch(e){console.warn('Notification unavailable',e)}await load()}
 function clear(){orders.value=[]}
 return {orders,load,place,cancel,clear}
})
