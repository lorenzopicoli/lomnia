import { Anchor } from '@mantine/core'
import cs from 'classnames'
import Markdown from 'react-markdown'
import wikiLinkPlugin from 'remark-wiki-link'
import styles from './DiaryEntry.module.css'

export type DiaryEntryProps = {
  content: string
  tags: string[]
  relativePath: string
  source: string
  privacyMode: boolean
}

function DiaryEntry(props: DiaryEntryProps) {
  return (
    <div className={cs({ [styles.textHidden]: props.privacyMode })}>
      <Markdown
        remarkPlugins={[wikiLinkPlugin]}
        components={{
          a({ children: aChildren, ...aProps }) {
            return (
              <Anchor
                c={props.privacyMode ? 'transparent' : 'primary'}
                href={aProps.href}
              >
                {aChildren}
              </Anchor>
            )
          },
        }}
      >
        {props.content}
      </Markdown>
    </div>
  )
}

export default DiaryEntry
