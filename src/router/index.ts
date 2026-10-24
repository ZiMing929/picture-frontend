import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import UserLoginPage from '@/pages/user/UserLoginPage.vue'
import UserRegisterPage from '@/pages/user/UserRegisterPage.vue'
import UserManagePage from '@/pages/admin/UserManagePage.vue'
import PictureManagePage from '@/pages/admin/PictureManagePage.vue'
import AddPicturePage from '@/pages/AddPicturePages.vue'
import AddPictureBatchPage from '@/pages/AddPictureBatchPage.vue'
import PictureDetailPage from '@/pages/PictureDetailPage.vue'
import SpaceManagePage from '../pages/admin/SpaceManagePage.vue'
import AddSpacePage from '@/pages/AddSpacePages.vue'
import MySpacePage from '@/pages/MySpacePage.vue'
import SpaceDetailPage from '@/pages/SpaceDetailPage.vue'

// 创建 Vue Router 路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    // 一、首页
    { path: '/', name: '主页', component: HomePage },

    // 二、用户管理
    { path: '/user/login', name: '用户登录', component: UserLoginPage },
    { path: '/user/register', name: '用户注册', component: UserRegisterPage },
    { path: '/admin/userManage', name: '用户管理', component: UserManagePage },

    // 三、图片管理
    { path: '/admin/pictureManage', name: '图片管理', component: PictureManagePage },

    // 空间管理
    {
      path: '/admin/spaceManage',
      name: '空间管理',
      component: SpaceManagePage,
    },

    // 创建单张图片
    { path: '/add_picture', name: '创建图片', component: AddPicturePage },

    // 批量创建图片
    { path: '/add_picture/batch', name: '批量创建图片', component: AddPictureBatchPage },

    // 六、图片详情
    { path: '/picture/:id', name: '图片详情', component: PictureDetailPage, props: true },

    // 创建空间
    {
      path: '/add_space',
      name: '创建空间',
      component: AddSpacePage,
    },

    {
      path: '/my_space',
      name: '我的空间',
      component: MySpacePage,
    },

    {
      path: '/space/:id',
      name: '空间详情',
      component: SpaceDetailPage,
      props: true,
    },






    // 七、关于页面
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
  ],
})

export default router
