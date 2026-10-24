<template>
  <div id="pictureDetailPage">
    <a-spin :spinning="loading">
      <a-row v-if="picture" :gutter="[16, 16]">
        <!-- 左侧：图片预览 -->
        <a-col :xs="24" :md="16" :xl="18">
          <a-card title="图片预览">
            <div class="picture-preview">
              <a-image
                v-if="picture.url"
                :src="picture.url"
                :alt="picture.name || '图片'"
                style="max-width: 100%; max-height: 600px; object-fit: contain"
              />
              <a-empty v-else description="暂无图片" />
            </div>
          </a-card>
        </a-col>

        <!-- 右侧：图片信息 -->
        <a-col :xs="24" :md="8" :xl="6">
          <a-card title="图片信息">
            <a-descriptions :column="1">
              <!-- 作者 -->
              <a-descriptions-item label="作者">
                <a-space>
                  <a-avatar :size="24" :src="myLove" />
                  <span>
                    {{ picture.user?.userName || '无名' }}
                  </span>
                </a-space>
              </a-descriptions-item>

              <!-- 图片名称 -->
              <a-descriptions-item label="名称">
                {{ picture.name || '未命名' }}
              </a-descriptions-item>

              <!-- 图片简介 -->
              <a-descriptions-item label="简介">
                {{ picture.introduction || '-' }}
              </a-descriptions-item>

              <!-- 分类 -->
              <a-descriptions-item label="分类">
                <a-tag color="green">
                  {{ picture.category || '默认' }}
                </a-tag>
              </a-descriptions-item>

              <!-- 标签 -->
              <a-descriptions-item label="标签">
                <a-space wrap>
                  <a-tag v-for="tag in pictureTags" :key="tag">
                    {{ tag }}
                  </a-tag>

                  <span v-if="pictureTags.length === 0"> - </span>
                </a-space>
              </a-descriptions-item>

              <!-- 图片格式 -->
              <a-descriptions-item label="格式">
                {{ picture.picFormat || '-' }}
              </a-descriptions-item>

              <!-- 图片宽度 -->
              <a-descriptions-item label="宽度">
                {{ picture.picWidth ?? '-' }}
              </a-descriptions-item>

              <!-- 图片高度 -->
              <a-descriptions-item label="高度">
                {{ picture.picHeight ?? '-' }}
              </a-descriptions-item>

              <!-- 宽高比 -->
              <a-descriptions-item label="宽高比">
                {{ picture.picScale ?? '-' }}
              </a-descriptions-item>

              <!-- 图片大小 -->
              <a-descriptions-item label="大小">
                {{ formatSize(picture.picSize) }}
              </a-descriptions-item>
            </a-descriptions>

            <!-- 底部操作按钮 -->
            <div class="picture-actions">
              <a-space wrap>
                <!-- 免费下载：所有用户可见 -->
                <a-button type="primary" :loading="downloading" @click="doDownload">
                  <template #icon>
                    <DownloadOutlined />
                  </template>
                  免费下载
                </a-button>

                <!-- 编辑：无权限时禁用 -->
                <a-tooltip :title="canEdit ? '编辑图片' : '仅作者或管理员可以编辑'">
                  <a-button :disabled="!canEdit" @click="doEdit">
                    <template #icon>
                      <EditOutlined />
                    </template>
                    编辑
                  </a-button>
                </a-tooltip>

                <!-- 删除：无权限时禁用 -->
                <a-popconfirm
                  title="确定要删除这张图片吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  :disabled="!canEdit"
                  @confirm="doDelete"
                >
                  <a-button danger :disabled="!canEdit" :loading="deleting">
                    <template #icon>
                      <DeleteOutlined />
                    </template>
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>

              <!-- 无权限提示 -->
              <div v-if="!canEdit" class="permission-tip">编辑和删除仅限图片作者或管理员</div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 图片不存在 -->
      <a-empty v-else-if="!loading" description="图片不存在或获取失败" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { message } from 'ant-design-vue'

import { DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

import { deletePictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController'

import { useLoginUserStore } from '@/stores/useLoginUserStore'

import myLove from '@/assets/my-love.png'


// 一、路由
const route = useRoute()
const router = useRouter()

// 二、登录用户
const loginUserStore = useLoginUserStore()

// 三、页面状态
const picture = ref<API.PictureVO | null>(null)
const loading = ref(false)
const downloading = ref(false)
const deleting = ref(false)

// 四、获取路由中的原始图片 ID
// 注意：雪花 ID 可能超过 JS 安全整数范围，不能 Number() 转换
const pictureId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : id
})

// 五、格式化图片大小
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

// 六、安全解析标签
// unknown 用于兼容后端可能返回的数组或 JSON 字符串
const pictureTags = computed<string[]>(() => {
  const tags: unknown = picture.value?.tags

  if (Array.isArray(tags)) {
    return tags.map(String)
  }

  if (typeof tags === 'string' && tags.trim()) {
    try {
      const result: unknown = JSON.parse(tags)
      return Array.isArray(result) ? result.map(String) : []
    } catch {
      return []
    }
  }

  return []
})

// 七、获取图片详情
const fetchPictureDetail = async () => {
  const id = pictureId.value

  // 只验证 ID 是否为数字字符串，不转换为 Number
  if (!id || !/^\d+$/.test(String(id))) {
    picture.value = null
    message.error('图片 ID 不存在或格式错误')
    return
  }

  loading.value = true
  picture.value = null

  try {
    // API 生成类型要求 number，但超长雪花 ID 必须保留字符串
    // 类型断言仅影响 TypeScript，不会改变运行时数据
    const res = await getPictureVoByIdUsingGet({
      id: String(id) as unknown as number,
    })

    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
    } else {
      message.error('获取图片详情失败：' + (res.data.message || '未知错误'))
    }
  } catch (error: unknown) {
    console.error('获取图片详情失败：', error)
    message.error('获取图片详情失败，请检查后端接口')
  } finally {
    loading.value = false
  }
}

// 八、判断是否有编辑、删除权限
const canEdit = computed(() => {
  const loginUser = loginUserStore.loginUser
  const currentPicture = picture.value

  if (!loginUser?.id || !currentPicture) {
    return false
  }

  const isOwner = String(loginUser.id) === String(currentPicture.userId ?? currentPicture.user?.id)

  const isAdmin = loginUser.userRole === 'admin'

  return isOwner || isAdmin
})

// 九、编辑图片
const doEdit = () => {
  if (!canEdit.value) {
    message.warning('没有编辑权限')
    return
  }

  const id = picture.value?.id

  if (!id) {
    message.error('图片 ID 不存在')
    return
  }

  router.push({
    path: '/add_picture',
    query: {
      // 优先使用路由中的原始 ID，避免雪花 ID 精度丢失
      id: pictureId.value || String(id),
    },
  })
}

// 十、删除图片
const doDelete = async () => {
  if (!canEdit.value) {
    message.warning('没有删除权限')
    return
  }

  // 使用路由原始 ID，不使用 Number()
  const id = pictureId.value

  if (!id) {
    message.error('图片 ID 不存在')
    return
  }

  deleting.value = true

  try {
    const res = await deletePictureUsingPost({
      id: String(id) as unknown as number,
    })

    if (res.data.code === 0) {
      message.success('删除成功')
      await router.push('/')
    } else {
      message.error('删除失败：' + (res.data.message || '未知错误'))
    }
  } catch (error: unknown) {
    console.error('删除图片失败：', error)
    message.error('删除失败，请检查后端接口或权限')
  } finally {
    deleting.value = false
  }
}

// 十一、下载图片
const doDownload = async () => {
  const url = picture.value?.url

  if (!url) {
    message.error('图片地址不存在')
    return
  }

  downloading.value = true

  try {
    // 获取图片数据
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // 转换为 Blob
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    // 生成文件名
    const pictureName = picture.value?.name || 'picture'
    const pictureFormat = picture.value?.picFormat || 'png'
    const fileName = `${pictureName}.${pictureFormat.replace(/^\./, '')}`

    // 创建下载链接
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 释放临时资源
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
    }, 1000)

    message.success('开始下载图片')
  } catch (error: unknown) {
    console.error('下载图片失败：', error)
    message.error('下载失败，请检查图片地址或 COS 跨域配置')
  } finally {
    downloading.value = false
  }
}

// 十二、监听路由图片 ID，自动加载详情
watch(
  pictureId,
  () => {
    void fetchPictureDetail()
  },
  { immediate: true },
)
</script>

<style scoped>
#pictureDetailPage {
  padding: 24px;
}

.picture-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  text-align: center;
}

.picture-actions {
  margin-top: 24px;
}

.permission-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}
</style>
