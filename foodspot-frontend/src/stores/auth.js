import {ref} from 'vue'
import {defineStore} from 'pinia'
import {api,session,setSession} from '../services/api.js'
export const useAuth=defineStore('auth',()=>{const me=ref(session());async function login(form,register){me.value=await api.login(form,register);setSession(me.value)}async function logout(){await api.logout();setSession(null);me.value=null}return {me,login,logout}})
