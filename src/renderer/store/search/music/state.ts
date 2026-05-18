import { reactive, markRaw, watch } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'
import { userApi } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'

// import { deduplicationList } from '@common/utils/renderer'

export declare interface ListInfo {
  list: LX.Music.MusicInfo[]
  total: number
  page: number
  maxPage: number
  limit: number
  key: string | null
  noItemLabel: string
}

interface ListInfos extends Partial<Record<LX.OnlineSource, ListInfo>> {
  'all': ListInfo
}

export const sources: Array<LX.OnlineSource | 'all'> = markRaw([])

export const listInfos: ListInfos = markRaw({
  all: reactive<ListInfo>({
    page: 1,
    maxPage: 0,
    limit: 30,
    total: 0,
    list: [],
    key: null,
    noItemLabel: '',
  }),
})
export const maxPages: Partial<Record<LX.OnlineSource, number>> = {}
for (const source of music.sources) {
  if (!music[source.id as LX.OnlineSource]?.musicSearch) continue
  sources.push(source.id as LX.OnlineSource)
  listInfos[source.id as LX.OnlineSource] = reactive<ListInfo>({
    page: 1,
    maxPage: 0,
    limit: 30,
    total: 0,
    list: [],
    key: '',
    noItemLabel: '',
  })
  maxPages[source.id as LX.OnlineSource] = 0
}
sources.push('all')

// 动态加入自定义 API 的源（当开启自定义源搜索或该自定义源实现了 musicSearch 时）
watch(() => Object.keys(userApi.apis), (keys) => {
  for (const source of keys) {
    if (sources.includes(source as any)) continue
    const apiImpl = userApi.apis[source]
    const enableBySetting = appSetting['common.userApiSearchEnable'] || /^user_api/.test(appSetting['common.apiSource'])
    const hasMusicSearch = apiImpl && apiImpl.musicSearch
    if (!enableBySetting && !hasMusicSearch) continue
    // 插入到 'all' 之前
    const insertIndex = Math.max(0, sources.indexOf('all'))
    sources.splice(insertIndex, 0, source as any)
    listInfos[source as any] = reactive<ListInfo>({
      page: 1,
      maxPage: 0,
      limit: 30,
      total: 0,
      list: [],
      key: '',
      noItemLabel: '',
    })
    maxPages[source as any] = 0
  }
}, { immediate: true })
