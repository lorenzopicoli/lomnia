import { isValid, parse } from 'date-fns'
import { sql } from 'drizzle-orm'
import { db } from '../db/connection'
import type { GetDiaryQueryParams } from '../routes/diary'

function getRandomLetter(upper: boolean): string {
  const alphabet = upper
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    : 'abcdefghijklmnopqrstuvwxyz'
  const randomIndex = Math.floor(Math.random() * alphabet.length)
  return alphabet[randomIndex]
}

function isUpperCase(char: string) {
  return char === char.toUpperCase() && char !== char.toLowerCase()
}

function removeDataviewBlocks(markdownText: string): string {
  const pattern: RegExp = /```dataview[\s\S]*?```/g

  const cleanedText: string = markdownText.replace(pattern, '')

  return cleanedText
    .replace('#### Today\n\n\n\n#### Coming up\n\n\n\n', '')
    .replace('## Birthdays\n\n', '')
}

export async function getDiaryEntries(params: GetDiaryQueryParams) {
  const { date, isHidden } = params
  if (!isValid(parse(date, 'yyyy-MM-dd', new Date()))) {
    throw new Error('Invalid date')
  }
  const entry = await db.query.filesTable.findFirst({
    columns: {
      id: true,
      content: true,
      tags: true,
      relativePath: true,
      source: true,
    },
    where: sql`'diary/personal' = ANY(tags) AND (metadata->>'date')::date = ${date}`,
  })

  if (!entry) {
    return
  }

  const cleanContent = removeDataviewBlocks(entry.content ?? '')
  let privateContent = ''

  if (isHidden) {
    for (const ch of cleanContent.split('')) {
      if (/[a-zA-Z]/.test(ch)) {
        privateContent += getRandomLetter(isUpperCase(ch))
      } else {
        privateContent += ch
      }
    }
  }

  const content = isHidden ? privateContent : cleanContent

  return {
    ...entry,
    content,
  }
}
