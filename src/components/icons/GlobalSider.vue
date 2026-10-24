<template>
  <div id="globalSider">
    <!-- 左侧导航栏 -->
    <a-layout-sider
      v-if="loginUserStore.loginUser.id"
      class="sider"
      width="200"
      breakpoint="lg"
      :collapsed-width="0"
      theme="light"
    >
      <a-menu
        v-model:selectedKeys="current"
        mode="inline"
        :items="menuItems"
        @click="doMenuClick"
      />
    </a-layout-sider>
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch } from 'vue'
import { PictureOutlined, UserOutlined } from '@ant-design/icons-vue'
import { type MenuProps } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

// 一、获取路由和用户状态
const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

// 二、左侧菜单
const menuItems: MenuProps['items'] = [
  {
    key: '/',
    label: '公共图库',
    icon: () => h(PictureOutlined),
  },
  {
    key: '/my_space',
    label: '我的空间',
    icon: () => h(UserOutlined),
  },
]

// 三、当前选中的菜单
const current = ref<string[]>([route.path])

// 四、监听路由变化
watch(
  () => route.path,
  (newPath) => {
    current.value = [newPath]
  },
  { immediate: true },
)

// 五、点击菜单跳转
const doMenuClick: MenuProps['onClick'] = ({ key }) => {
  void router.push({ path: String(key) })
}
</script>

<style scoped>
#globalSider {
  height: 100%;
  background: #fff;
}

#globalSider .sider {
  height: 100%;
  min-height: calc(100vh - 128px);
  background: #fff;
  padding-top: 20px;
  border-right: 1px solid #eee;
}

#globalSider :deep(.ant-menu-root) {
  border-bottom: none !important;
  border-inline-end: none !important;
}

#globalSider :deep(.ant-menu-item) {
  margin: 4px 8px;
  width: calc(100% - 16px);
  border-radius: 4px;
}
</style>
