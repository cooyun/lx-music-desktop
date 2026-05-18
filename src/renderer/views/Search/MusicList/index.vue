<template>
  <div :class="$style.container">
    <material-online-list
      ref="listRef"
      :page="listInfo.page"
      :limit="listInfo.limit"
      :total="listInfo.total"
      :list="listInfo.list"
      :no-item="listInfo.noItemLabel"
      :source-tag="sourceId == 'all'"
      :show-update-time-column="true"
      :sortable="true"
      :sort-key="sortKey"
      :sort-order="sortOrder"
      check-api-source
      @toggle-page="handleTogglePage"
      @play-list="handlePlayList"
      @sort-change="handleSortChangeEvent"
    />
  </div>
</template>

<script setup lang="ts">
import { watch } from '@common/utils/vueTools'
import { searchText } from '@renderer/store/search/state'
import { useRouter, useRoute } from '@common/utils/vueRouter'
import useList, { type SearchSource } from './useList'

interface Props {
  sourceId: SearchSource
  page: number
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

const {
  listRef,
  listInfo,
  search,
  handlePlayList,
  sortKey,
  sortOrder,
  handleSortChange,
} = useList()

watch(() => [props.sourceId, props.page], ([sourceId, page]) => {
  setTimeout(() => {
    search(searchText.value, sourceId as SearchSource, page as number || 1)
  })
})
watch(searchText, (searchText) => {
  setTimeout(() => {
    search(searchText, props.sourceId, props.page)
  })
}, {
  immediate: true,
})

const handleTogglePage = (page: number) => {
  void router.replace({
    path: route.path,
    query: {
      ...route.query,
      page,
    },
  })
}

const handleSortChangeEvent = (payload: { key: string; order: number }) => {
  handleSortChange(payload)
}


</script>


<style lang="less" module>
.container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.list {
  overflow: hidden;
  height: 100%;
  flex: auto;
}

</style>
