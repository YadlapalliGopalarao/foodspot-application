<script setup>
import {money} from '../composables/useTask.js'
defineProps({food:Object});defineEmits(['add'])
</script><template><article class="card"><div class="pic"><img v-if="food.image_url" :src="food.image_url" :alt="food.name"><span v-else>{{food.emoji||'🍽️'}}</span></div><div class="pad"><h3>{{food.name}}</h3><p>{{food.description}}</p><div class="toolbar"><b>{{money(food.price)}}</b><button @click="$emit('add',food.id)">+ Add</button></div></div></article></template>
