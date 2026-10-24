<template>
  <div id="homePage">
    <!-- 一、搜索框 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="searchParams.searchText"
        placeholder="从海量图片中搜索"
        enter-button="搜索"
        size="large"
        @search="doSearch"
      />
    </div>

    <!-- 二、图片分类 -->
    <a-tabs v-model:activeKey="selectedCategory" @change="doSearch">
      <a-tab-pane key="all" tab="全部" />
      <a-tab-pane v-for="category in categoryList" :key="category" :tab="category" />
    </a-tabs>

    <!-- 三、图片标签 -->
    <div class="tag-bar">
      <span style="margin-right: 8px">标签：</span>
      <a-space :size="[0, 8]" wrap>
        <a-checkable-tag
          v-for="(tag, index) in tagList"
          :key="tag"
          v-model:checked="selectedTagList[index]"
          @change="doSearch"
        >
          {{ tag }}
        </a-checkable-tag>
      </a-space>
    </div>

    <!-- 四、图片列表 -->
    <PictureList :dataList="dataList" :loading="loading" />
    <a-pagination
      style="text-align: right"
      v-model:current="searchParams.current"
      v-model:pageSize="searchParams.pageSize"
      :total="total"
      @change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import PictureList from '@/components/icons/PictureList.vue'

import {
  listPictureVoByPageUsingPost,
  listPictureTagCategoryUsingGet,
} from '@/api/pictureController'

// 一、路由对象
const router = useRouter()

// 二、图片数据列表
const dataList = ref<API.PictureVO[]>([])

// 三、图片总数
const total = ref(0)

// 四、加载状态
const loading = ref(false)

// 五、搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 12,
  sortField: 'createTime',
  sortOrder: 'descend',
  searchText: '',
})

// 六、分类和标签
const categoryList = ref<string[]>([])
const selectedCategory = ref<string>('all')
const tagList = ref<string[]>([])
const selectedTagList = ref<boolean[]>([])

// 七、分页配置
const pagination = computed(() => ({
  current: searchParams.current ?? 1,
  pageSize: searchParams.pageSize ?? 12,
  total: total.value,

  // 切换页码时重新获取图片
  onChange: (page: number, pageSize: number) => {
    searchParams.current = page
    searchParams.pageSize = pageSize
    fetchData()
  },
}))

// 八、安全解析图片标签
const parseTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags.map(String)
  }

  if (typeof tags !== 'string' || !tags.trim()) {
    return []
  }

  try {
    const result = JSON.parse(tags)
    return Array.isArray(result) ? result.map(String) : []
  } catch (error) {
    console.warn('标签解析失败：', tags)
    return []
  }
}

// 九、从后端获取图片数据
const fetchData = async () => {
  loading.value = true

  // 转换搜索参数
  const params: API.PictureQueryRequest = {
    ...searchParams,
    tags: [],
  }

  // 添加分类筛选条件
  if (selectedCategory.value !== 'all') {
    params.category = selectedCategory.value
  } else {
    params.category = undefined
  }

  // 添加标签筛选条件
  selectedTagList.value.forEach((useTag, index) => {
    if (useTag && tagList.value[index]) {
      params.tags?.push(tagList.value[index])
    }
  })

  try {
    // 调用后端分页查询接口
    const res = await listPictureVoByPageUsingPost(params)

    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data.records ?? []
      total.value = Number(res.data.data.total ?? 0)
    } else {
      message.error('获取数据失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error) {
    console.error('获取图片数据失败：', error)
    message.error('获取图片失败，请检查后端接口')
  } finally {
    loading.value = false
  }
}

// 十、搜索图片
const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

// 十一、获取分类和标签列表
const getTagCategoryOptions = async () => {
  try {
    const res = await listPictureTagCategoryUsingGet()

    if (res.data.code === 0 && res.data.data) {
      categoryList.value = res.data.data.categoryList ?? []
      tagList.value = res.data.data.tagList ?? []

      // 初始化标签的选中状态
      selectedTagList.value = tagList.value.map(() => false)
    } else {
      message.error('加载分类标签失败：' + (res.data.message ?? '未知错误'))
    }
  } catch (error) {
    console.error('获取分类和标签失败：', error)
    message.error('获取分类和标签失败，请检查后端接口')
  }
}

// 十二、点击图片跳转到详情页
const doClickPicture = (picture: API.PictureVO) => {
  if (!picture.id) {
    message.warning('图片 ID 不存在')
    return
  }

  router.push({
    path: `/picture/${picture.id}`,
  })
}

// 分页切换事件
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData()
}

// 十三、页面加载时执行
onMounted(() => {
  getTagCategoryOptions()
  fetchData()
})
</script>

<style scoped>
#homePage {
  padding: 24px;
}

/* 搜索框 */
#homePage .search-bar {
  max-width: 480px;
  margin: 0 auto 24px;
}

/* 标签区域 */
#homePage .tag-bar {
  margin-bottom: 24px;
}

/* 图片卡片 */
#homePage :deep(.ant-card) {
  overflow: hidden;
  cursor: pointer;
}

/* 图片封面 */
#homePage :deep(.ant-card-cover img) {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

/* 图片名称 */
#homePage :deep(.ant-card-meta-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
