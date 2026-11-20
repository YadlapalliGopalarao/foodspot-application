import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useFood } from './food.js'
export const useCart=defineStore('cart',()=>{
 const quantities=ref({}),food=useFood()
 const items=computed(()=>food.foods.filter(f=>quantities.value[f.id]>0).map(f=>({...f,quantity:quantities.value[f.id]})))
 const count=computed(()=>items.value.reduce((s,f)=>s+f.quantity,0))
 const total=computed(()=>items.value.reduce((s,f)=>s+Math.round(Number(f.price)*100)*f.quantity,0)/100)
 function change(id,n){const next=Math.min(99,Math.max(0,(quantities.value[id]||0)+n));if(next)quantities.value[id]=next;else delete quantities.value[id]}
 function clear(){quantities.value={}}
 return {quantities,items,count,total,change,clear}
})
