
<template>
  <div id="userManagePage">
    <!-- 一、搜索表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="账号">
        <a-input v-model:value="searchParams.userAccount" placeholder="输入账号" allow-clear />
      </a-form-item>

      <a-form-item label="用户名">
        <a-input v-model:value="searchParams.userName" placeholder="输入用户名" allow-clear />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>

    <div style="margin-bottom: 35px"></div>

    <!-- 二、用户管理表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      :loading="loading"
      row-key="id"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">

        <!-- 1. 用户头像 -->
        <template v-if="column.dataIndex === 'userAvatar'">
          <a-image v-if="record.userAvatar" :src="record.userAvatar" :width="120" />
          <span v-else>暂无头像</span>
        </template>

        <!-- 2. 用户角色 -->
        <template v-else-if="column.dataIndex === 'userRole'">
          <a-tag :color="record.userRole === 'admin' ? 'green' : 'blue'">
            {{ record.userRole === 'admin' ? '管理员' : '普通用户' }}
          </a-tag>
        </template>

        <!-- 3. 创建时间 -->
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ record.createTime ? dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
        </template>

        <!-- 4. 删除操作 -->
        <template v-else-if="column.key === 'action'">
          <a-popconfirm
            title="确定要删除这个用户吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="doDelete(record.id)"
          >
            <a-button danger>删除</a-button>
          </a-popconfirm>
        </template>

      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { listUserVoByPageUsingPost, deleteUserUsingPost } from '@/api/userController'

// 一、表格列配置
const columns = [
  { title: 'id', dataIndex: 'id' },
  { title: '账号', dataIndex: 'userAccount' },
  { title: '用户名', dataIndex: 'userName' },
  { title: '头像', dataIndex: 'userAvatar' },
  { title: '简介', dataIndex: 'userProfile' },
  { title: '用户角色', dataIndex: 'userRole' },
  { title: '创建时间', dataIndex: 'createTime' },
  { title: '操作', key: 'action' },
]

// 二、用户数据列表
const dataList = ref<API.UserVO[]>([])

// 三、数据总数
const total = ref(0)

// 四、加载状态
const loading = ref(false)

// 五、搜索条件
const searchParams = reactive<API.UserQueryRequest>({
  current: 1,
  pageSize: 5,
  userAccount: '',
  userName: '',
})

// 六、分页配置
const pagination = computed(() => ({
  current: searchParams.current,
  pageSize: searchParams.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
}))

// 七、从后端获取用户列表
const fetchData = async () => {
  loading.value = true

  try {
    const res = await listUserVoByPageUsingPost({
      ...searchParams,
    })

    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []

      // 转换成数字，解决分页 total 类型报错
      total.value = Number(res.data.data.total ?? 0)
    } else {
      message.error('获取数据失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error) {
    console.error('获取用户列表失败：', error)
    message.error('请求失败，请检查后端服务或接口权限')
  } finally {
    loading.value = false
  }
}

// 八、切换分页
const doTableChange = (page: any) => {
  searchParams.current = page.current ?? 1
  searchParams.pageSize = page.pageSize ?? 5
  fetchData()
}

// 九、搜索用户
const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

// 十、删除用户
const doDelete = async (id: string | number | undefined) => {
  if (id === undefined || id === null || id === '') {
    message.error('用户 ID 不能为空')
    return
  }

  try {
    // 调用后端删除接口
    const res = await deleteUserUsingPost({
      id: String(id),
    })

    if (res.data.code === 0 && res.data.data === true) {
      message.success('删除成功')

      // 如果当前页最后一条数据被删除，返回上一页
      if (dataList.value.length === 1 && (searchParams.current ?? 1) > 1) {
        searchParams.current = (searchParams.current ?? 1) - 1
      }

      // 删除成功后重新获取数据
      await fetchData()
    } else {
      message.error('删除失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error) {
    console.error('删除用户失败：', error)
    message.error('删除请求失败，请检查后端接口或权限')
  }
}

// 十一、页面加载时获取用户数据
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
#userManagePage {
  padding: 24px;
  background: #fff;
}
</style>
