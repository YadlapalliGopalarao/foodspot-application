import {ref} from 'vue'
export function useTask(){const busy=ref(false),error=ref('');async function run(fn){if(busy.value)return;busy.value=true;error.value='';try{await fn()}catch(e){error.value=e.response?.data?.message||e.message}finally{busy.value=false}}return {busy,error,run}}
export const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n)
