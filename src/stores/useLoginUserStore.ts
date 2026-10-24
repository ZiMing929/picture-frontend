import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLoginUserUsingGet } from '@/api/userController'

export const useLoginUserStore = defineStore('loginUser', () => {
  // 当前登录用户，默认未登录
  const loginUser = ref<API.LoginUserVO>({
    userName: '未登录',
  })

  // 从后端获取当前登录用户信息
  async function fetchLoginUser() {
    try {
      const res = await getLoginUserUsingGet()

      if (res.data.code === 0 && res.data.data) {
        // 已登录，保存真实用户信息
        loginUser.value = res.data.data
      } else {
        // 未登录
        loginUser.value = { userName: '未登录' }
      }
    } catch (error) {
      console.error('获取登录用户信息失败：', error)
      loginUser.value = { userName: '未登录' }
    }
  }

  // 手动更新登录用户信息
  function setLoginUser(newLoginUser: API.LoginUserVO) {
    loginUser.value = newLoginUser
  }

  return { loginUser, setLoginUser, fetchLoginUser }
})
