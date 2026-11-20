// Browser-only data adapter. Never use for real authentication or authorization.
const seed = [
  ['Chicken Biryani',199,'🍛','Rice','Aromatic rice with spiced chicken'],
  ['Classic Burger',129,'🍔','Fast food','Crispy patty with fresh vegetables'],
  ['Margherita Pizza',249,'🍕','Fast food','Mozzarella, tomato and basil'],
  ['Masala Dosa',89,'🥞','South Indian','Crispy dosa with potato masala'],
  ['Paneer Fried Rice',159,'🍚','Rice','Wok-tossed rice and paneer'],
  ['Cold Coffee',79,'🥤','Drinks','Chilled creamy coffee']
].map(([name,price,emoji,category,description],i)=>({id:i+1,name,price,emoji,category,description,image_url:''}));
const prefix='foodspot-r4:';
const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
async function digest(password,salt){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256);
  return hex(new Uint8Array(bits));
}
const cleanUser=({id,name,email})=>({id,name,email});
export function createDemoApi(storage){
  const read=(key,fallback)=>{try{const value=storage.getItem(prefix+key);return value===null?structuredClone(fallback):JSON.parse(value)}catch{return structuredClone(fallback)}};
  const write=(key,value)=>storage.setItem(prefix+key,JSON.stringify(value));
  const session=()=>read('session',null);
  const setSession=value=>value===null?storage.removeItem(prefix+'session'):write('session',value);
  const identity=()=>{const id=session()?.user?.id;if(!id)throw Error('Please sign in first.');return id};
  const notify=message=>{const list=read('notifications',[]);list.unshift({id:crypto.randomUUID(),user_id:identity(),message,created_at:new Date().toISOString()});write('notifications',list)};
  return {
    session,setSession,
    async login(form,register=false){
      const email=String(form.email??'').trim().toLowerCase(), password=String(form.password??'');
      if(!email.includes('@')||password.length<8)throw Error('Enter an email and a password of at least 8 characters.');
      const accounts=read('accounts',[]);let account=accounts.find(x=>x.email===email);
      if(register){
        if(account)throw Error('This demo email is already registered.');
        const name=String(form.name??'').trim();if(!name)throw Error('Name is required.');
        const salt=hex(crypto.getRandomValues(new Uint8Array(16)));
        account={id:crypto.randomUUID(),name,email,salt,hash:await digest(password,salt)};
        accounts.push(account);write('accounts',accounts);
      }else if(!account||await digest(password,account.salt)!==account.hash){throw Error('Incorrect demo email or password.');}
      return {user:cleanUser(account),token:'demo-only'};
    },
    async logout(){setSession(null)},
    async foods(){return read('foods',seed)},
    async saveFood(input){
      const name=String(input.name??'').trim(),category=String(input.category??'').trim(),price=Number(input.price);
      if(!name||!category||!Number.isFinite(price)||price<=0)throw Error('Name, category and a positive price are required.');
      const list=read('foods',seed), item={id:input.id??crypto.randomUUID(),name,category,price:Math.round(price*100)/100,emoji:input.emoji||'🍽️',description:String(input.description??''),image_url:String(input.image_url??'')};
      if(input.id){const index=list.findIndex(x=>x.id===input.id);if(index<0)throw Error('Food item not found.');list[index]=item}else list.push(item);
      write('foods',list);return item;
    },
    async deleteFood(id){write('foods',read('foods',seed).filter(f=>f.id!==id))},
    async orders(){const id=session()?.user?.id;return id?read('orders',[]).filter(o=>o.user_id===id):[]},
    async place(items){
      const user_id=identity();if(!Array.isArray(items)||!items.length)throw Error('Your cart is empty.');
      const foods=read('foods',seed), seen=new Set();
      const lines=items.map(({id,quantity})=>{const f=foods.find(x=>x.id===id);if(!f||seen.has(id)||!Number.isInteger(quantity)||quantity<1||quantity>99)throw Error('Invalid food or quantity.');seen.add(id);return {id:f.id,name:f.name,price:f.price,quantity}});
      const total=lines.reduce((sum,f)=>sum+Math.round(f.price*100)*f.quantity,0)/100;
      const order={id:crypto.randomUUID(),user_id,items:lines,total,status:'Placed',created_at:new Date().toISOString()};
      const list=read('orders',[]);list.unshift(order);write('orders',list);return order;
    },
    async cancel(id){const owner=identity(), list=read('orders',[]), order=list.find(o=>o.id===id&&o.user_id===owner);if(!order||order.status!=='Placed')throw Error('This order cannot be cancelled.');order.status='Cancelled';write('orders',list);return order},
    async notifications(){const id=session()?.user?.id;return id?read('notifications',[]).filter(n=>n.user_id===id):[]},
    async notify(message){notify(message)}
  };
}
