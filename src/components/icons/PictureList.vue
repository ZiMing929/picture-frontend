<template>
  <div class="picture-list">
    <!-- 一、图片列表 -->
    <a-list
      :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
      :data-source="dataList"
      :loading="loading"
    >
      <template #renderItem="{ item: picture }">
        <a-list-item class="picture-list-item">
          <!-- 单张图片 -->
          <a-card hoverable @click="doClickPicture(picture)">
            <template #cover>
              <img
                class="picture-image"
                :alt="picture.name || '图片'"
                :src="picture.thumbnailUrl || picture.url"
                loading="lazy"
              />
            </template>

            <!-- 图片名称、分类和标签 -->
            <a-card-meta :title="picture.name">
              <template #description>
                <a-flex gap="4" wrap="wrap">
                  <a-tag color="green">
                    {{ picture.category || '默认' }}
                  </a-tag>

                  <a-tag v-for="tag in parseTags(picture.tags)" :key="tag">
                    {{ tag }}
                  </a-tag>
                </a-flex>
              </template>
            </a-card-meta>

            <!-- 二、操作栏：仅在 showOp 为 true 时显示 -->
            <template v-if="showOp" #actions>
              <!-- 编辑按钮 -->
              <a-space @click.stop="doEdit(picture)">
                <EditOutlined />
                编辑
              </a-space>

              <!-- 删除按钮 -->
              <a-popconfirm
                title="确定要删除这张图片吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="doDelete(picture)"
              >
                <a-space @click.stop>
                  <DeleteOutlined />
                  删除
                </a-space>
              </a-popconfirm>
            </template>
          </a-card>
        </a-list-item>
      </template>
    </a-list>

    <!-- 三、没有图片时显示提示 -->
    <a-empty v-if="!loading && dataList.length === 0" description="暂无图片" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { deletePictureUsingPost } from '@/api/pictureController'

// 一、定义父组件传入的属性
interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOp?: boolean
  onReload?: () => void
}

// 二、设置默认值
// showOp 默认为 false，公共图库不展示操作栏
const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOp: false,
})

// 三、获取路由
const router = useRouter()

// 四、安全解析标签
const parseTags = (tags: unknown): string[] => {
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
}

// 五、点击图片，跳转至图片详情
const doClickPicture = (picture: API.PictureVO) => {
  if (picture.id === undefined || picture.id === null) {
    return
  }

  void router.push({
    path: `/picture/${picture.id}`,
  })
}

// 六、编辑图片
const doEdit = (picture: API.PictureVO) => {
  if (picture.id === undefined || picture.id === null) {
    message.warning('图片 ID 不存在')
    return
  }

  void router.push({
    path: '/add_picture',
    query: {
      id: String(picture.id),
      ...(picture.spaceId != null ? { spaceId: String(picture.spaceId) } : {}),
    },
  })
}

// 七、删除图片
const doDelete = async (picture: API.PictureVO) => {
  const id = picture.id

  if (id === undefined || id === null) {
    message.warning('图片 ID 不存在')
    return
  }

  try {
    // 雪花 ID 保留字符串，避免 Number() 精度丢失
    const res = await deletePictureUsingPost({
      id: String(id) as unknown as number,
    })

    if (res.data.code === 0) {
      message.success('删除成功')

      // 通知父组件重新获取图片列表
      props.onReload?.()
    } else {
      message.error('删除失败：' + (res.data.message || '未知错误'))
    }
  } catch (error: unknown) {
    console.error('删除图片失败：', error)
    message.error('删除失败，请检查后端接口或权限')
  }
}
</script>

<style scoped>
.picture-list {
  width: 100%;
}

.picture-list-item {
  padding: 0;
}

.picture-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.picture-list :deep(.ant-card) {
  overflow: hidden;
  border-radius: 8px;
}

.picture-list :deep(.ant-card-meta-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
