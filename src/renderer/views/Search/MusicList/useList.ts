import { LIST_IDS } from '@common/constants'
import { ref } from '@common/utils/vueTools'
import { playList } from '@renderer/core/player/action'
import { getListMusics, addListMusics } from '@renderer/store/list/action'
import { addHistoryWord } from '@renderer/store/search/action'
// import { useI18n } from '@renderer/plugins/i18n'
// import { } from '@renderer/store/search/state'
import { search as searchMusic, listInfos, type ListInfo } from '@renderer/store/search/music'
import { assertApiSupport } from '@renderer/store/utils'

export type SearchSource = LX.OnlineSource | 'all'

export default () => {
  const listRef = ref<any>(null)
  const sortKey = ref('')
  const sortOrder = ref(-1)

  const listInfo = ref<ListInfo>({
    page: 1,
    maxPage: 0,
    limit: 30,
    total: 0,
    list: [],
    key: null,
    noItemLabel: '',
  })

  const getUpdateTimeValue = (item: LX.Music.MusicInfo) => {
    const rawTime = item.updateTime ?? item.meta?.updateTime ?? item.meta?.publishTime ?? item.meta?.publish_time ?? item.meta?.releaseDate ?? item.meta?.date
    if (rawTime == null || rawTime === '') return 0
    if (typeof rawTime === 'number' && !Number.isNaN(rawTime)) return rawTime
    if (typeof rawTime === 'string') {
      const trimmed = rawTime.trim()
      if (/^\d+$/.test(trimmed)) return parseInt(trimmed)
      const parsed = Date.parse(trimmed)
      if (!Number.isNaN(parsed)) return parsed
      const normalized = trimmed.replace(/-/g, '/')
      const parsed2 = Date.parse(normalized)
      if (!Number.isNaN(parsed2)) return parsed2
    }
    return 0
  }

  const getIntervalValue = (item: LX.Music.MusicInfo) => {
    const raw = item._interval ?? item.interval
    if (raw == null || raw === '') return 0
    if (typeof raw === 'number' && !Number.isNaN(raw)) return raw
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (/^\d+$/.test(trimmed)) return parseInt(trimmed)
      const parts = trimmed.split(':').map(part => Number(part))
      if (parts.every(part => !Number.isNaN(part))) {
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
        if (parts.length === 2) return parts[0] * 60 + parts[1]
        return parts[0]
      }
    }
    return 0
  }

  const sortList = (list: LX.Music.MusicInfo[], key: string, order: number) => {
    if (!key || order === 0) return list
    return [...list].sort((a, b) => {
      const aValue = key === 'updateTime' ? getUpdateTimeValue(a) : getIntervalValue(a)
      const bValue = key === 'updateTime' ? getUpdateTimeValue(b) : getIntervalValue(b)
      if (aValue === bValue) return 0
      return (aValue - bValue) * order
    })
  }

  const handleSortChange = ({ key, order }: { key: string; order: number }) => {
    sortKey.value = key
    sortOrder.value = order
    listInfo.value.list = sortList(listInfo.value.list, key, order)
  }

  const search = (text: string, source: SearchSource, page: number) => {
    listInfo.value = listInfos[source] as ListInfo
    if (text.length) void addHistoryWord(text)
    void searchMusic(text, page, source).then((list: LX.Music.MusicInfo[]) => {
      if (sortKey.value && listInfo.value.list.length) {
        listInfo.value.list = sortList(listInfo.value.list, sortKey.value, sortOrder.value)
      }
      if (list.length) {
        setTimeout(() => {
          if (listRef.value) listRef.value.scrollToTop()
        })
      }
    })
  }

  const handlePlayList = async(index: number) => {
    let targetSong = listInfo.value.list[index]

    if (!assertApiSupport(targetSong.source)) return

    const defaultListMusics = await getListMusics(LIST_IDS.DEFAULT)

    await addListMusics(LIST_IDS.DEFAULT, [targetSong])

    let targetIndex = defaultListMusics.findIndex(s => s.id === targetSong.id)
    if (targetIndex > -1) playList(LIST_IDS.DEFAULT, targetIndex)
  }

  return {
    listRef,
    listInfo,
    search,
    handlePlayList,
    sortKey,
    sortOrder,
    handleSortChange,
  }
}
