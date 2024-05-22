import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { customJsonb } from '../db/types'
import { importJobsTable } from './ImportJob'

export const filesSourceEnum = pgEnum('files_source', ['obsidian'])
export const filesContentTypeEnum = pgEnum('files_content_type', ['markdown'])

export const filesTable = pgTable('files', {
  id: serial('id').primaryKey(),
  /**
   * The source where this file was taken from (eg. obsidian)
   */
  source: filesSourceEnum('source').notNull(),
  contentType: filesContentTypeEnum('content_type').notNull(),
  /**
   * Can be anything and has no required shape. It's expected that whatever code
   * relies on this, can properly handle malformated or missing data
   */
  metadata: customJsonb('metadata'),
  /**
   * MD5 hash of the file's contents
   */
  checksum: text('checksum'),
  tags: text('tags').array(),
  fileCreatedAt: timestamp('file_created_at').defaultNow().notNull(),
  fileUpdatedAt: timestamp('file_updated_at'),
  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  /**
   * Relative to the base folder from import
   */
  relativePath: text('relative_path').notNull(),
  content: text('content'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at'),
})

export type File = typeof filesTable.$inferSelect
export type NewFile = typeof filesTable.$inferInsert
