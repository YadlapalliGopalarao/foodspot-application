import axios from 'axios';
import {createDemoApi} from './demo.js';
export const demo=import.meta.env.VITE_DEMO!=='false';
const mock=demo?createDemoApi(localStorage):null;
// Real bearer tokens remain in memory for now. Refresh requires login in API mode.
// A production session/cookie design will be decided with the Laravel services.
let realSession=null;
export const session=()=>demo?mock.session():realSession;
export function setSession(value){if(demo)mock.setSession(value);else realSession=value}
const client=baseURL=>{
  const c=axios.create({baseURL,timeout:10000,headers:{Accept:'application/json'}});
  c.interceptors.request.use(config=>{const token=session()?.token;if(token)config.headers.Authorization=`Bearer ${token}`;return config});
  return c;
};
const user=client(import.meta.env.VITE_USER_API||'/api/user');
const food=client(import.meta.env.VITE_FOOD_API||'/api/food');
const order=client(import.meta.env.VITE_ORDER_API||'/api/order');
const notification=client(import.meta.env.VITE_NOTIFICATION_API||'/api/notification');
const data=async p=>(await p).data;
const list=async p=>{const result=await data(p);if(Array.isArray(result))return result;if(Array.isArray(result?.data))return result.data;throw Error('Unexpected API response shape.');};
const remote={
 async login(form,register){return data(user.post(register?'/register':'/login',register?form:{email:form.email,password:form.password}))},
 async logout(){await user.post('/logout')},
 async foods(){return list(food.get('/foods'))},
 async saveFood(f){return data(f.id?food.put('/foods/'+encodeURIComponent(f.id),f):food.post('/foods',f))},
 async deleteFood(id){return data(food.delete('/foods/'+encodeURIComponent(id)))},
 async orders(){return session()?list(order.get('/orders')):[]},
 async place(items){return data(order.post('/orders',{items:items.map(x=>({food_id:x.id,quantity:x.quantity}))}))},
 async cancel(id){return data(order.patch('/orders/'+encodeURIComponent(id)+'/cancel'))},
 async notifications(){return session()?list(notification.get('/notifications')):[]},
 // The Laravel order service owns real order notifications.
 async notify(){}
};
export const api=demo?mock:remote;
