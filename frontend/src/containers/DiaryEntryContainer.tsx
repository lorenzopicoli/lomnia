import { format } from 'date-fns/format'
import { useDiaryEntryApi } from '../api'
import DiaryEntry from '../components/DiaryEntry'

type DiaryEntryContainer = {
  date: Date
  privacyMode: boolean
}

export default function DiaryEntryContainer(props: DiaryEntryContainer) {
  const { data, isLoading } = useDiaryEntryApi({
    date: format(props.date, 'yyyy-MM-dd'),
    isHidden: props.privacyMode,
  })

  if (isLoading) {
    return 'Loading...'
  }

  if (!data) {
    return 'No data'
  }

  return (
    <DiaryEntry
      privacyMode={props.privacyMode}
      content={data.content}
      tags={data.tags}
      relativePath={data.relativePath}
      source={data.source}
    />
  )
}
