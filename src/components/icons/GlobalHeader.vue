<template>
  <div id="globalHeader">
    <a-row :wrap="false" align="middle">
      <!-- 左侧：Logo 和项目名称 -->
      <a-col flex="220px">
        <div class="title-bar" @click="router.push('/')">
          <img class="logo" src="@/assets/my-logo.png" alt="logo" />
          <span class="title">王子茗的云图库</span>
        </div>
      </a-col>

      <!-- 中间：导航菜单 -->
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="items"
          @click="doMenuClick"
        />
      </a-col>

      <!-- 右侧：用户登录状态 -->
      <a-col flex="180px">
        <div class="user-login-status">
          <!-- 已登录 -->
          <a-dropdown v-if="loginUserStore.loginUser.id">

            <a-space class="user-info">
              <a-avatar :size="36" :src="myLove" />
              <span>{{ loginUserStore.loginUser.userName || '王子茗' }}</span>
            </a-space>

            <template #overlay>
              <a-menu>
                <a-menu-item>
                  <router-link to="/my_space">
                    <UserOutlined />
                    我的空间
                  </router-link>
                </a-menu-item>
                <a-menu-item key="logout" @click="doLogout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>

          <!-- 未登录 -->
          <a-button v-else type="primary" @click="router.push('/user/login')"> 登录 </a-button>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { HomeOutlined, LogoutOutlined } from '@ant-design/icons-vue'
import { type MenuProps, message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { userLogoutUsingPost } from '@/api/userController'
import myLove from '@/assets/my-love.png'

// 一、获取路由和用户状态
const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

// 二、当前选中的菜单
const current = ref<string[]>([route.path])

// 三、定义原始导航菜单
const originItems: MenuProps['items'] = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
  },

  {
    key: '/admin/spaceManage',
    label: '空间管理',
    title: '空间管理',
  },

  {
    key: '/add_picture',
    label: '创建图片',
    title: '创建图片',
  },
  {
    key: 'others',
    label: h(
      'a',
      {
        href: 'https://www.codefather.cn',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      '编程导航',
    ),
    title: '编程导航',
  },
]

// 四、根据用户角色过滤菜单
const filterMenus = (menus: MenuProps['items']): MenuProps['items'] => {
  return menus?.filter((menu) => {
    if (!menu) {
      return false
    }

    // 管理员菜单只对管理员显示
    if (String(menu.key).startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser

      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }

    return true
  })
}

// 五、计算实际展示的菜单
// 注意：这里只声明一次 items，解决重复定义报错
const items = computed<MenuProps['items']>(() => {
  return filterMenus(originItems)
})

// 六、点击导航菜单进行路由跳转
const doMenuClick: MenuProps['onClick'] = ({ key }) => {
  if (key === 'others') {
    return
  }

  router.push({ path: String(key) })
}

// 七、监听路由变化，自动高亮菜单
watch(
  () => route.path,
  (newPath) => {
    current.value = [newPath]
  },
  { immediate: true },
)

// 八、用户退出登录
const doLogout = async () => {
  try {
    const res = await userLogoutUsingPost()

    if (res.data.code === 0) {
      // 清空前端登录用户信息
      loginUserStore.setLoginUser({
        userName: '未登录',
      })

      message.success('退出登录成功')

      // 跳转登录页面
      await router.push('/user/login')
    } else {
      message.error('退出登录失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error) {
    console.error('退出登录失败：', error)
    message.error('退出登录请求失败，请检查后端服务')
  }
}
</script>

<style scoped>
#globalHeader {
  background: #fff;
  padding: 0 20px;
}

#globalHeader .title-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}

#globalHeader .logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

#globalHeader .title {
  font-size: 20px;
  font-weight: 500;
  color: #111;
  white-space: nowrap;
}

#globalHeader .user-login-status {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

#globalHeader .user-info {
  cursor: pointer;
}

#globalHeader :deep(.ant-menu-horizontal) {
  border-bottom: none;
  line-height: 64px;
}
</style>
