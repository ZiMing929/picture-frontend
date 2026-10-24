<template>
  <div id="SpaceManagePage">
    <!-- 一、页面标题和创建按钮 -->
    <a-flex justify="space-between" align="center" class="table-header">
      <h2>空间管理</h2>
      <a-space>
        <a-button type="primary" @click="goToAddSpace"> + 创建空间 </a-button>
      </a-space>
    </a-flex>

    <!-- 二、搜索表单 -->
    <a-form layout="inline" :model="searchParams" class="search-form" @finish="doSearch">
      <a-form-item label="空间名称" name="spaceName">
        <a-input v-model:value="searchParams.spaceName" placeholder="请输入空间名称" allow-clear />
      </a-form-item>

      <a-form-item label="空间级别" name="spaceLevel">
        <a-select
          v-model:value="searchParams.spaceLevel"
          :options="SPACE_LEVEL_OPTIONS"
          placeholder="请选择空间级别"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="用户 ID" name="userId">
        <a-input v-model:value="searchUserId" placeholder="请输入用户 ID" allow-clear />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit"> 搜索 </a-button>
      </a-form-item>

      <a-form-item>
        <a-button @click="doReset"> 重置 </a-button>
      </a-form-item>
    </a-form>

    <!-- 三、空间管理表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      :loading="loading"
      :scroll="{ x: 1200 }"
      row-key="id"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <!-- 空间级别 -->
        <template v-if="column.dataIndex === 'spaceLevel'">
          <a-tag color="blue">
            {{ SPACE_LEVEL_MAP[Number(record.spaceLevel)] ?? '未知级别' }}
          </a-tag>
        </template>

        <!-- 使用情况 -->
        <template v-else-if="column.dataIndex === 'spaceUseInfo'">
          <div>
            大小：
            {{ formatSize(record.totalSize) }}
            /
            {{ formatSize(record.maxSize) }}
          </div>
          <div>
            数量：
            {{ record.totalCount ?? 0 }}
            /
            {{ record.maxCount ?? 0 }}
          </div>
        </template>

        <!-- 创建时间 -->
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ formatTime(record.createTime) }}
        </template>

        <!-- 编辑时间 -->
        <template v-else-if="column.dataIndex === 'editTime'">
          {{ formatTime(record.editTime) }}
        </template>

        <!-- 操作 -->
        <template v-else-if="column.key === 'action'">
          <a-space wrap>
            <a-button type="link" @click="doEdit(record)"> 编辑 </a-button>

            <a-popconfirm
              title="确定要删除这个空间吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="doDelete(record.id)"
            >
              <a-button type="link" danger> 删除 </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

import { listSpaceByPageUsingPost, deleteSpaceUsingPost } from '@/api/spaceController'

// 一、路由
const router = useRouter()

// 二、空间级别
// 对应后端 SpaceLevelEnum 的实际 value
// 如果后端枚举值不同，需要同步调整
const SPACE_LEVEL_MAP: Record<number, string> = {
  0: '普通版',
  1: '专业版',
  2: '旗舰版',
}

const SPACE_LEVEL_OPTIONS = Object.entries(SPACE_LEVEL_MAP).map(([value, label]) => ({
  label,
  value: Number(value),
}))

// 三、表格列
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 190,
    ellipsis: true,
  },
  {
    title: '空间名称',
    dataIndex: 'spaceName',
    width: 180,
  },
  {
    title: '空间级别',
    dataIndex: 'spaceLevel',
    width: 120,
  },
  {
    title: '使用情况',
    dataIndex: 'spaceUseInfo',
    width: 260,
  },
  {
    title: '用户 ID',
    dataIndex: 'userId',
    width: 190,
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right' as const,
  },
]

// 四、数据状态
const dataList = ref<API.Space[]>([])
const total = ref(0)
const loading = ref(false)

// 用户 ID 单独使用字符串接收，避免输入超长 ID 时丢失精度
const searchUserId = ref('')

// 五、搜索条件
const searchParams = reactive<API.SpaceQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
  spaceName: '',
  spaceLevel: undefined,
})

// 六、分页参数
const pagination = computed(() => ({
  current: searchParams.current ?? 1,
  pageSize: searchParams.pageSize ?? 10,
  total: total.value,
  showSizeChanger: true,
  showTotal: (count: number) => `共 ${count} 条`,
}))

// 七、格式化空间大小
const formatSize = (size: unknown): string => {
  if (size === null || size === undefined || size === '') {
    return '-'
  }

  const bytes = Number(size)

  if (!Number.isFinite(bytes) || bytes < 0) {
    return '-'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// 八、格式化时间
const formatTime = (time: unknown): string => {
  if (!time) {
    return '-'
  }

  const date = dayjs(String(time))
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 九、获取空间列表
const fetchData = async () => {
  loading.value = true

  try {
    // 管理员空间列表接口：/space/list/page
    const res = await listSpaceByPageUsingPost({
      ...searchParams,
      userId: searchUserId.value.trim()
        ? (searchUserId.value.trim() as unknown as number)
        : undefined,
    })

    console.log('管理员空间列表响应：', res.data)

    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = Number(res.data.data.total ?? 0)
    } else {
      dataList.value = []
      total.value = 0
      message.error('获取空间失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error: unknown) {
    console.error('获取空间列表失败：', error)
    message.error('获取空间失败，请检查后端服务和管理员权限')
  } finally {
    loading.value = false
  }
}

// 十、搜索
const doSearch = () => {
  searchParams.current = 1
  void fetchData()
}

// 十一、重置搜索条件
const doReset = () => {
  searchParams.spaceName = ''
  searchParams.spaceLevel = undefined
  searchUserId.value = ''
  searchParams.current = 1

  void fetchData()
}

// 十二、表格分页变化
const doTableChange = (page: { current?: number; pageSize?: number }) => {
  searchParams.current = page.current ?? 1
  searchParams.pageSize = page.pageSize ?? 10

  void fetchData()
}

// 十三、创建空间
const goToAddSpace = () => {
  void router.push('/add_space')
}

// 十四、编辑空间
const doEdit = (record: API.Space) => {
  if (record.id === undefined || record.id === null) {
    message.error('空间 ID 不存在')
    return
  }

  void router.push({
    path: '/add_space',
    query: {
      id: String(record.id),
    },
  })
}

// 十五、删除空间
const doDelete = async (id: string | number | undefined) => {
  if (id === undefined || id === null || id === '') {
    message.error('空间 ID 不能为空')
    return
  }

  try {
    const res = await deleteSpaceUsingPost({
      id: String(id) as unknown as number,
    })

    if (res.data.code === 0) {
      message.success('删除成功')

      // 如果当前页只剩一条数据，删除后返回上一页
      if (dataList.value.length === 1 && (searchParams.current ?? 1) > 1) {
        searchParams.current = (searchParams.current ?? 1) - 1
      }

      await fetchData()
    } else {
      message.error('删除失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error: unknown) {
    console.error('删除空间失败：', error)
    message.error('删除失败，请检查后端接口或权限')
  }
}

// 十六、页面加载时获取数据
onMounted(() => {
  void fetchData()
})
</script>

<style scoped>
#spaceManagePage {
  padding: 24px;
  background: #fff;
  min-height: 100%;
}

.search-form {
  margin-bottom: 28px;
  row-gap: 12px;
}

.table-header {
  margin-bottom: 20px;
}

.table-header h2 {
  margin: 0;
}

#spaceManagePage :deep(.ant-table-cell) {
  vertical-align: middle;
}

#spaceManagePage :deep(.ant-table-cell img) {
  max-height: 100px;
  object-fit: contain;
}
</style>
