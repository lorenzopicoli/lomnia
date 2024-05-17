import { Fragment, type ReactElement } from 'react'

export type DiaryEntryProps = {
  content: string
  tags: string[]
  relativePath: string
  source: string
  privacyMode: boolean
}

const NewLineToBr = ({ children = '' }) =>
  children.split('\n').reduce(
    (arr, line, index) =>
      arr.concat(
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Fragment key={index}>
          {line}
          <br />
        </Fragment>
      ),
    [] as ReactElement[]
  )
function DiaryEntry(props: DiaryEntryProps) {
  console.log('mode', props.privacyMode)
  return (
    // <div style={{ filter: props.privacyMode ? 'blur(1.5rem)' : 'blur(0)' }}>
    <div
      style={{
        color: props.privacyMode ? 'transparent' : '',
        textShadow: props.privacyMode ? '0 0 5px rgba(255,255,255,0.5)' : '',
      }}
    >
      <NewLineToBr>{props.content}</NewLineToBr>
    </div>
  )
}

export default DiaryEntry
