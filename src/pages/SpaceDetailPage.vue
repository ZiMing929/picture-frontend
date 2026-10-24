<template>
  <div id="spaceDetailPage">
    <!-- 一、空间详情加载状态 -->
    <a-spin :spinning="spaceLoading">
      <template v-if="space">
        <!-- 二、空间信息 -->
        <a-flex class="space-header" justify="space-between" align="center" wrap="wrap" gap="16">
          <div class="space-title">
            <h2>{{ space.spaceName || '未命名空间' }}（私有空间）</h2>
            <a-tag color="blue">
              {{ getSpaceLevelText(space.spaceLevel) }}
            </a-tag>
          </div>

          <a-space size="middle" wrap>
            <!-- 创建图片 -->
            <a-button v-if="canEdit" type="primary" @click="doCreatePicture"> + 创建图片 </a-button>

            <!-- 容量进度 -->
            <a-tooltip :title="capacityTooltip">
              <a-progress
                type="circle"
                :percent="capacityPercent"
                :size="42"
                :format="(percent: number) => `${percent}%`"
              />
            </a-tooltip>

            <!-- 编辑空间 -->
            <a-button v-if="canEdit" @click="doEdit">
              <EditOutlined />
              编辑空间
            </a-button>

            <!-- 删除空间 -->
            <a-popconfirm
              v-if="canEdit"
              title="确定删除这个空间吗？"
              description="删除后可能无法恢复，请谨慎操作。"
              ok-text="确定"
              cancel-text="取消"
              @confirm="doDelete"
            >
              <a-button danger :loading="deleting">
                <DeleteOutlined />
                删除空间
              </a-button>
            </a-popconfirm>
          </a-space>
        </a-flex>

        <!-- 三、空间基本信息 -->
        <a-card class="space-info-card" size="small">
          <a-descriptions :column="{ xs: 1, sm: 2, md: 3 }">
            <a-descriptions-item label="空间名称">
              {{ space.spaceName || '-' }}
            </a-descriptions-item>

            <a-descriptions-item label="空间级别">
              {{ getSpaceLevelText(space.spaceLevel) }}
            </a-descriptions-item>

            <a-descriptions-item label="图片数量">
              {{ space.totalCount ?? 0 }} / {{ space.maxCount ?? 0 }}
            </a-descriptions-item>

            <a-descriptions-item label="已用容量">
              {{ formatSize(space.totalSize) }}
            </a-descriptions-item>

            <a-descriptions-item label="总容量">
              {{ formatSize(space.maxSize) }}
            </a-descriptions-item>

            <a-descriptions-item label="空间 ID">
              {{ spaceId }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 四、空间图片列表 -->
        <div class="picture-section">
          <h3>空间图片</h3>

          <PictureList :data-list="dataList" :loading="loading" />

          <!-- 五、图片分页 -->
          <a-pagination
            class="pagination"
            v-model:current="searchParams.current"
            v-model:pageSize="searchParams.pageSize"
            :total="total"
            :show-total="(count: number) => `图片总数 ${count} / ${space?.maxCount ?? 0}`"
            show-size-changer
            :page-size-options="['12', '24', '48']"
            @change="onPageChange"
          />
        </div>
      </template>

      <!-- 空间不存在 -->
      <a-empty v-else-if="!spaceLoading" description="空间不存在或暂无访问权限">
        <a-button type="primary" @click="router.push('/')"> 返回首页 </a-button>
      </a-empty>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

import PictureList from '@/components/icons/PictureList.vue'
import { getSpaceVoByIdUsingGet, deleteSpaceUsingPost } from '@/api/spaceController'
import { listPictureVoByPageUsingPost } from '@/api/pictureController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

// 一、路由与用户信息
const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 二、页面状态
const space = ref<API.SpaceVO | null>(null)
const spaceLoading = ref(false)
const loading = ref(false)
const deleting = ref(false)

// 三、获取空间 ID
// 雪花 ID 不能转换为 Number，否则可能丢失精度
const spaceId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : String(id || '')
})

// 四、图片列表数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)

// 五、图片查询条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
})

// 六、空间大小格式化
const formatSize = (size?: number | string | null): string => {
  if (size === undefined || size === null || size === '') {
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

// 七、空间级别显示
const getSpaceLevelText = (level?: number): string => {
  switch (Number(level)) {
    case 0:
      return '普通版'
    case 1:
      return '专业版'
    case 2:
      return '旗舰版'
    default:
      return '未知级别'
  }
}

// 八、计算空间容量占用百分比
const capacityPercent = computed(() => {
  const totalSize = Number(space.value?.totalSize ?? 0)
  const maxSize = Number(space.value?.maxSize ?? 0)

  if (!maxSize || maxSize <= 0) {
    return 0
  }

  const percent = (totalSize * 100) / maxSize

  return Number(Math.min(100, Math.max(0, percent)).toFixed(1))
})

// 九、空间容量提示
const capacityTooltip = computed(() => {
  return `占用空间 ${formatSize(space.value?.totalSize)} / ${formatSize(space.value?.maxSize)}`
})

// 十、判断当前用户是否可以管理空间
const canEdit = computed(() => {
  const loginUser = loginUserStore.loginUser
  const currentSpace = space.value

  if (!loginUser?.id || !currentSpace) {
    return false
  }

  const isOwner = String(loginUser.id) === String(currentSpace.userId ?? currentSpace.user?.id)

  const isAdmin = loginUser.userRole === 'admin'

  return isOwner || isAdmin
})

// 十一、获取空间详情
const fetchSpaceDetail = async () => {
  const id = spaceId.value

  if (!id || !/^\d+$/.test(id)) {
    space.value = null
    message.error('空间 ID 不存在或格式错误')
    return
  }

  spaceLoading.value = true
  space.value = null

  try {
    const res = await getSpaceVoByIdUsingGet({
      id: id as unknown as number,
    })

    if (res.data.code === 0 && res.data.data) {
      space.value = res.data.data
    } else {
      message.error('获取空间详情失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取空间详情失败：', error)
    message.error('获取空间详情失败，请检查后端接口或访问权限')
  } finally {
    spaceLoading.value = false
  }
}

// 十二、获取当前空间下的图片列表
const fetchData = async () => {
  const id = spaceId.value

  if (!id || !/^\d+$/.test(id)) {
    dataList.value = []
    total.value = 0
    return
  }

  loading.value = true

  try {
    const params: API.PictureQueryRequest = {
      ...searchParams,
      spaceId: id as unknown as number,
    }

    const res = await listPictureVoByPageUsingPost(params)

    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = Number(res.data.data.total ?? 0)
    } else {
      dataList.value = []
      total.value = 0
      message.error('获取图片失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取空间图片失败：', error)
    message.error('获取空间图片失败，请检查后端接口')
  } finally {
    loading.value = false
  }
}

// 十三、图片分页
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  void fetchData()
}

// 十四、创建图片
const doCreatePicture = () => {
  void router.push({
    path: '/add_picture',
    query: {
      spaceId: spaceId.value,
    },
  })
}

// 十五、编辑空间
const doEdit = () => {
  if (!canEdit.value) {
    message.warning('没有编辑权限')
    return
  }

  void router.push({
    path: '/add_space',
    query: {
      id: spaceId.value,
    },
  })
}

// 十六、删除空间
const doDelete = async () => {
  if (!canEdit.value) {
    message.warning('没有删除权限')
    return
  }

  if (!spaceId.value) {
    message.error('空间 ID 不存在')
    return
  }

  deleting.value = true

  try {
    const res = await deleteSpaceUsingPost({
      id: spaceId.value as unknown as number,
    })

    if (res.data.code === 0) {
      message.success('删除空间成功')
      await router.push('/')
    } else {
      message.error('删除空间失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('删除空间失败：', error)
    message.error('删除空间失败，请检查后端接口或权限')
  } finally {
    deleting.value = false
  }
}

// 十七、监听路由 ID 变化
// 进入详情页或切换空间时，同时请求空间详情和图片列表
watch(
  spaceId,
  async () => {
    searchParams.current = 1
    dataList.value = []
    total.value = 0

    await Promise.all([fetchSpaceDetail(), fetchData()])
  },
  { immediate: true },
)
</script>

<style scoped>
#spaceDetailPage {
  padding: 24px;
  min-height: 100%;
  background: #fff;
}

.space-header {
  margin-bottom: 24px;
}

.space-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.space-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.space-info-card {
  margin-bottom: 28px;
  border-radius: 8px;
}

.picture-section {
  margin-top: 24px;
}

.picture-section h3 {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
}

.pagination {
  margin-top: 24px;
  text-align: right;
}

@media (max-width: 768px) {
  #spaceDetailPage {
    padding: 16px;
  }

  .space-header {
    align-items: flex-start;
  }

  .space-title h2 {
    font-size: 18px;
  }
}
</style>
