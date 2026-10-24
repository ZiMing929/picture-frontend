<template>
  <div id="app">
    <BasicLayout />
  </div>
</template>

<script setup lang="ts">
import BasicLayout from '@/layouts/BasicLayout.vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { healthUsingGet } from '@/api/mainController'

healthUsingGet().then((res) => {
  //健康接口的调用，便于做前后端的测试连接，看前端的点击，能否返回正常的后端代码！
  console.log(res)
})

const loginUserStore = useLoginUserStore()
loginUserStore.fetchLoginUser()
</script>
