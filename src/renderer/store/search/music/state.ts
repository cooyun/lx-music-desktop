import { reactive, watch } from '@common/utils/vueTools'
import music from '@renderer/utils/musicSdk'
import { userApi } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'

// import { deduplicationList } from '@common/utils/renderer'

type SearchSource = LX.OnlineSource | 'all' | 'user_api'

export declare interface ListInfo {
  list: LX.Music.MusicInfo[]
  total: number
  page: number
  maxPage: number
  limit: number
  key: string | null
  noItemLabel: string
}

interface ListInfos extends Partial<Record<SearchSource, ListInfo>> {
  all: ListInfo
  user_api: ListInfo
}

export const sources: Array<SearchSource> = reactive([] as Array<SearchSource>)

export const listInfos: ListInfos = reactive({
  all: reactive<ListInfo>({
    page: 1,
    maxPage: 0,
    limit: 30,
    total: 0,
    list: [],
    key: null,
    noItemLabel: '',
  }),
  user_api: reactive<ListInfo>({
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

// 动态加入自定义 API 搜索按钮（当开启自定义源搜索且已选择自定义源时）
const updateCustomSourceButton = () => {
  const shouldShow = appSetting['common.userApiSearchEnable'] && /^user_api/.test(appSetting['common.apiSource']) && Object.keys(userApi.apis).length > 0
  const hasCustomSource = sources.includes('user_api')
  if (shouldShow && !hasCustomSource) {
    const insertIndex = Math.max(0, sources.indexOf('all'))
    sources.splice(insertIndex, 0, 'user_api')
  } else if (!shouldShow && hasCustomSource) {
    const index = sources.indexOf('user_api')
    if (index >= 0) sources.splice(index, 1)
    listInfos.user_api.list = []
    listInfos.user_api.page = 0
    listInfos.user_api.maxPage = 0
    listInfos.user_api.total = 0
    listInfos.user_api.noItemLabel = ''
  }
}

watch(
  () => [
    Object.keys(userApi.apis).join(','),
    appSetting['common.userApiSearchEnable'],
    appSetting['common.apiSource'],
  ],
  updateCustomSourceButton,
  { immediate: true },
)
