<template>
  <div id="pictureManagePage">
    <a-flex justify="space-between">
      <h2>图片管理</h2>
      <a-space>
        <a-button type="primary" href="/add_picture" target="_blank">+ 创建图片</a-button>
        <a-button type="primary" href="/add_picture/batch" target="_blank" ghost>+ 批量创建图片</a-button>
      </a-space>
    </a-flex>
    <!-- 一、搜索表单 -->
    <a-form layout="inline" :model="searchParams" class="search-form" @finish="doSearch">
      <a-form-item label="关键词" name="searchText">
        <a-input
          v-model:value="searchParams.searchText"
          placeholder="从名称和简介搜索"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="类型" name="category">
        <a-input v-model:value="searchParams.category" placeholder="请输入类型" allow-clear />
      </a-form-item>

      <a-form-item label="标签" name="tags">
        <a-select
          v-model:value="searchParams.tags"
          mode="tags"
          placeholder="请输入标签"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>

      <!-- 审核状态筛选 -->
      <a-form-item label="审核状态" name="reviewStatus">
        <a-select
          v-model:value="searchParams.reviewStatus"
          :options="PIC_REVIEW_STATUS_OPTIONS"
          placeholder="请选择审核状态"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit"> 搜索 </a-button>
      </a-form-item>

      <a-form-item>
        <a-button @click="doReset"> 重置 </a-button>
      </a-form-item>
    </a-form>

    <!-- 二、标题和创建图片 -->
    <a-flex justify="space-between" align="center" class="table-header">
      <h2>图片管理</h2>

      <a-button type="primary" @click="goToAddPicture"> + 创建图片 </a-button>
    </a-flex>

    <!-- 三、图片管理表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      :loading="loading"
      :scroll="{ x: 1800 }"
      row-key="id"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <!-- 图片预览 -->
        <template v-if="column.dataIndex === 'url'">
          <a-image v-if="record.url" :src="record.url" :width="100" />
          <span v-else>暂无图片</span>
        </template>

        <!-- 标签 -->
        <template v-else-if="column.dataIndex === 'tags'">
          <a-space wrap>
            <a-tag v-for="tag in parseTags(record.tags)" :key="tag" color="blue">
              {{ tag }}
            </a-tag>

            <span v-if="parseTags(record.tags).length === 0">-</span>
          </a-space>
        </template>

        <!-- 图片信息 -->
        <template v-else-if="column.dataIndex === 'picInfo'">
          <div>格式：{{ record.picFormat || '-' }}</div>
          <div>宽度：{{ record.picWidth ?? '-' }}</div>
          <div>高度：{{ record.picHeight ?? '-' }}</div>
          <div>宽高比：{{ record.picScale ?? '-' }}</div>
          <div>大小：{{ formatFileSize(record.picSize) }}</div>
        </template>

        <!-- 审核信息 -->
        <template v-else-if="column.dataIndex === 'reviewMessage'">
          <div>
            审核状态：
            <a-tag :color="getReviewStatusColor(record.reviewStatus)">
              {{ getReviewStatusText(record.reviewStatus) }}
            </a-tag>
          </div>

          <div>审核信息：{{ record.reviewMessage || '-' }}</div>

          <div>审核人：{{ record.reviewerId || '-' }}</div>

          <div>审核时间：{{ formatTime(record.reviewTime) }}</div>
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
            <!-- 审核通过 -->
            <a-button
              v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.PASS"
              type="link"
              @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.PASS)"
            >
              通过
            </a-button>

            <!-- 审核拒绝 -->
            <a-button
              v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.REJECT"
              type="link"
              danger
              @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.REJECT)"
            >
              拒绝
            </a-button>

            <!-- 编辑 -->
            <a-button type="link" @click="doEdit(record)"> 编辑 </a-button>

            <!-- 删除 -->
            <a-popconfirm
              title="确定要删除这张图片吗？"
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

import {
  listPictureByPageUsingPost,
  deletePictureUsingPost,
  doPictureReviewUsingPost,
} from '@/api/pictureController'

// 一、路由
const router = useRouter()

// 二、审核状态枚举
const PIC_REVIEW_STATUS_ENUM = {
  REVIEWING: 0,
  PASS: 1,
  REJECT: 2,
} as const

// 三、审核状态选项
const PIC_REVIEW_STATUS_OPTIONS = [
  {
    label: '待审核',
    value: PIC_REVIEW_STATUS_ENUM.REVIEWING,
  },
  {
    label: '审核通过',
    value: PIC_REVIEW_STATUS_ENUM.PASS,
  },
  {
    label: '审核拒绝',
    value: PIC_REVIEW_STATUS_ENUM.REJECT,
  },
]

// 四、审核状态文本
const getReviewStatusText = (status: unknown): string => {
  switch (Number(status)) {
    case PIC_REVIEW_STATUS_ENUM.REVIEWING:
      return '待审核'
    case PIC_REVIEW_STATUS_ENUM.PASS:
      return '审核通过'
    case PIC_REVIEW_STATUS_ENUM.REJECT:
      return '审核拒绝'
    default:
      return '未知状态'
  }
}

// 五、审核状态颜色
const getReviewStatusColor = (status: unknown): string => {
  switch (Number(status)) {
    case PIC_REVIEW_STATUS_ENUM.REVIEWING:
      return 'orange'
    case PIC_REVIEW_STATUS_ENUM.PASS:
      return 'green'
    case PIC_REVIEW_STATUS_ENUM.REJECT:
      return 'red'
    default:
      return 'default'
  }
}

// 六、表格列
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 190,
    ellipsis: true,
  },
  {
    title: '图片',
    dataIndex: 'url',
    width: 140,
  },
  {
    title: '名称',
    dataIndex: 'name',
    width: 140,
    ellipsis: true,
  },
  {
    title: '简介',
    dataIndex: 'introduction',
    width: 160,
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'category',
    width: 100,
  },
  {
    title: '标签',
    dataIndex: 'tags',
    width: 180,
  },
  {
    title: '图片信息',
    dataIndex: 'picInfo',
    width: 160,
  },
  {
    title: '审核信息',
    dataIndex: 'reviewMessage',
    width: 260,
  },
  {
    title: '用户ID',
    dataIndex: 'userId',
    width: 190,
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 170,
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
    width: 170,
  },
  {
    title: '操作',
    key: 'action',
    width: 240,
    fixed: 'right' as const,
  },
]

// 七、数据状态
const dataList = ref<API.Picture[]>([])
const total = ref(0)
const loading = ref(false)

// 八、搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 5,
  searchText: '',
  category: '',
  tags: [],
  reviewStatus: undefined,
})

// 九、分页
const pagination = computed(() => ({
  current: searchParams.current,
  pageSize: searchParams.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (count: number) => `共 ${count} 条`,
}))

// 十、解析标签
const parseTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags.map(String)
  }

  if (typeof tags !== 'string' || !tags.trim()) {
    return []
  }

  try {
    const result: unknown = JSON.parse(tags)
    return Array.isArray(result) ? result.map(String) : []
  } catch {
    return []
  }
}

// 十一、格式化图片大小
const formatFileSize = (size: unknown): string => {
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

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 十二、格式化时间
const formatTime = (time: unknown): string => {
  if (!time) {
    return '-'
  }

  const date = dayjs(String(time))
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 十三、获取管理员图片列表
const fetchData = async () => {
  loading.value = true

  try {
    // 关键：管理员必须调用 /picture/list/page
    // 不能使用 listPictureVoByPageUsingPost
    const res = await listPictureByPageUsingPost({
      ...searchParams,
    })

    console.log('管理员图片列表响应：', res.data)

    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = Number(res.data.data.total ?? 0)
    } else {
      dataList.value = []
      total.value = 0

      message.error('获取图片失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error: unknown) {
    console.error('获取管理员图片列表失败：', error)
    message.error('获取图片失败，请检查后端服务和管理员权限')
  } finally {
    loading.value = false
  }
}

// 十四、切换分页
const doTableChange = (page: { current?: number; pageSize?: number }) => {
  searchParams.current = page.current ?? 1
  searchParams.pageSize = page.pageSize ?? 5

  void fetchData()
}

// 十五、搜索
const doSearch = () => {
  searchParams.current = 1
  void fetchData()
}

// 十六、重置
const doReset = () => {
  searchParams.searchText = ''
  searchParams.category = ''
  searchParams.tags = []
  searchParams.reviewStatus = undefined
  searchParams.current = 1

  void fetchData()
}

// 十七、创建图片
const goToAddPicture = () => {
  void router.push('/add_picture')
}

// 十八、编辑图片
const doEdit = (record: API.Picture) => {
  if (!record.id) {
    message.error('图片 ID 不存在')
    return
  }

  void router.push({
    path: '/add_picture',
    query: {
      id: String(record.id),
    },
  })
}

// 十九、删除图片
const doDelete = async (id: string | number | undefined) => {
  if (id === undefined || id === null || id === '') {
    message.error('图片 ID 不能为空')
    return
  }

  try {
    // 保留超长雪花 ID 字符串
    const res = await deletePictureUsingPost({
      id: String(id) as unknown as number,
    })

    if (res.data.code === 0) {
      message.success('删除成功')

      if (dataList.value.length === 1 && (searchParams.current ?? 1) > 1) {
        searchParams.current = (searchParams.current ?? 1) - 1
      }

      await fetchData()
    } else {
      message.error('删除失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error: unknown) {
    console.error('删除图片失败：', error)
    message.error('删除失败，请检查后端接口或权限')
  }
}

// 二十、审核图片
const handleReview = async (record: API.Picture, reviewStatus: number) => {
  if (!record.id) {
    message.error('图片 ID 不存在')
    return
  }

  const reviewMessage =
    reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS ? '管理员审核通过' : '管理员审核拒绝'

  try {
    const res = await doPictureReviewUsingPost({
      id: String(record.id) as unknown as number,
      reviewStatus,
      reviewMessage,
    })

    if (res.data.code === 0) {
      message.success('审核操作成功')
      await fetchData()
    } else {
      message.error('审核操作失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error: unknown) {
    console.error('审核图片失败：', error)
    message.error('审核失败，请检查后端接口或权限')
  }
}

// 二十一、页面加载时获取图片
onMounted(() => {
  void fetchData()
})
</script>

<style scoped>
#pictureManagePage {
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

#pictureManagePage :deep(.ant-table-cell) {
  vertical-align: middle;
}

#pictureManagePage :deep(.ant-table-cell img) {
  max-height: 100px;
  object-fit: contain;
}
</style>
