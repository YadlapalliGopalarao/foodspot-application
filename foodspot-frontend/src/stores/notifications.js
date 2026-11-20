import {ref} from 'vue'
import {defineStore} from 'pinia'
import {api} from '../services/api.js'
export const useNotifications=defineStore('notifications',()=>{const items=ref([]);async function load(){items.value=await api.notifications()}function clear(){items.value=[]}return {items,load,clear}})
