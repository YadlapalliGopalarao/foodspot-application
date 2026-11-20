import {ref} from 'vue'
import {defineStore} from 'pinia'
import {api} from '../services/api.js'
export const useFood=defineStore('food',()=>{const foods=ref([]);async function load(){foods.value=await api.foods()}async function save(f){await api.saveFood(f);await load()}async function remove(id){await api.deleteFood(id);await load()}return {foods,load,save,remove}})
