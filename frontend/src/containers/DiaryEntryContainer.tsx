import { format } from 'date-fns/format'
import { useDiaryEntryApi } from '../api'
import DiaryEntry from '../components/DiaryEntry/DiaryEntry'

type DiaryEntryContainer = {
  date: Date
}

export default function DiaryEntryContainer(props: DiaryEntryContainer) {
  const { data, isLoading } = useDiaryEntryApi({
    date: format(props.date, 'yyyy-MM-dd'),
  })

  if (isLoading) {
    return 'Loading...'
  }

  if (!data) {
    return 'No data'
  }

  return (
    <DiaryEntry
      content={data.content}
      tags={data.tags}
      relativePath={data.relativePath}
      source={data.source}
    />
  )
}
