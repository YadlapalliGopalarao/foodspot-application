import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoApi } from '../src/services/demo.js';
function storage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
const alice={name:'Alice',email:'alice@example.invalid',password:'demo-alice-1'};
const bob={name:'Bob',email:'bob@example.invalid',password:'demo-bob-1'};
test('registration, wrong password, logout and returning login',async()=>{
 const s=storage(),api=createDemoApi(s),account=await api.login(alice,true);
 api.setSession(account);assert.equal(api.session().user.name,'Alice');
 assert.ok(!s.getItem('foodspot-r4:accounts').includes(alice.password));
 await api.logout();assert.equal(api.session(),null);
 await assert.rejects(api.login({...alice,password:'wrongpassword'}),/Incorrect/);
 await assert.rejects(api.login(alice,true),/registered/);
 const again=await createDemoApi(s).login(alice);assert.equal(again.user.id,account.user.id);
});
test('food CRUD and validation',async()=>{
 const api=createDemoApi(storage());assert.equal((await api.foods()).length,6);
 const f=await api.saveFood({name:'Tea',category:'Drinks',price:20});
 await api.saveFood({...f,price:25});assert.equal((await api.foods()).find(x=>x.id===f.id).price,25);
 await assert.rejects(api.saveFood({...f,price:-1}),/positive/);
 await api.deleteFood(f.id);assert.equal((await api.foods()).length,6);
});
test('server-like price lookup, validation, ownership, persistence, cancellation and notifications',async()=>{
 const s=storage(),api=createDemoApi(s);await assert.rejects(api.place([]),/sign in/);
 const a=await api.login(alice,true);api.setSession(a);
 await assert.rejects(api.place([{id:1,quantity:-1}]),/Invalid/);
 const order=await api.place([{id:1,quantity:2,price:1}]);assert.equal(order.total,398);
 await api.notify('Placed');assert.equal((await api.notifications()).length,1);
 await api.logout();const b=await api.login(bob,true);api.setSession(b);assert.deepEqual(await api.orders(),[]);
 assert.deepEqual(await api.notifications(),[]);await assert.rejects(api.cancel(order.id),/cannot/);
 await api.logout();const restored=createDemoApi(s);restored.setSession(await restored.login(alice));
 assert.equal((await restored.orders())[0].id,order.id);await restored.cancel(order.id);
 assert.equal((await restored.orders())[0].status,'Cancelled');await assert.rejects(restored.cancel(order.id),/cannot/);
});
