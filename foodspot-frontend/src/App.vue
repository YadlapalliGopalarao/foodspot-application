<script setup>
import {onMounted} from 'vue'
import {useAuth} from './stores/auth.js'
import {useFood} from './stores/food.js'
import {useCart} from './stores/cart.js'
import {demo} from './services/api.js'
import {useTask} from './composables/useTask.js'
const auth=useAuth(),food=useFood(),cart=useCart();const {error,run}=useTask();onMounted(()=>run(food.load))
</script>
<template><header><div class="wrap nav"><RouterLink class="brand" to="/">foodspot<span>.</span></RouterLink><nav><RouterLink to="/">Menu</RouterLink><RouterLink to="/cart">Cart ({{cart.count}})</RouterLink><RouterLink to="/orders">Orders</RouterLink><RouterLink to="/notifications">Notifications</RouterLink><RouterLink to="/account">{{auth.me?.user?.name||'Account'}}</RouterLink><RouterLink v-if="demo||auth.me?.user?.role==='admin'" to="/admin">Admin</RouterLink></nav></div></header><main class="wrap"><p v-if="demo" class="demo">Demo mode · fictional accounts only · browser storage</p><p v-if="error" role="alert">{{error}} <button @click="run(food.load)">Retry</button></p><RouterView/></main></template>
