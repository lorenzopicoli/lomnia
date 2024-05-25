import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { customJsonb } from '../db/types'
import { importJobsTable } from './ImportJob'

export const dnsQueriesTable = pgTable('dns_queries', {
  id: integer('id'),
  /**
   * A copy of the primary identifier of this row in the source database
   */
  externalId: integer('external_id'),

  importJobId: integer('import_job_id')
    .references(() => importJobsTable.id)
    .notNull(),
  /**
   * When the query was made, in UTC
   */
  queryTimestamp: timestamp('query_timestamp').notNull(),
  /**
   * Just the domain part, no "http" or "www"
   */
  domain: text('domain').notNull(),
  /**
   * Local IP address of the client that initiated the request
   */
  client: text('client').notNull(),
  /**
   * Forward destination used for this query (only set if status == 2)
   */
  forward: text('forward'),
  /**
   * In milliseconds
   */
  replyTime: integer('reply_time'),
  /**
   * The content and type of the additional_info row depends on the status of the given query. For many queries, this field is empty. You should, however, not rely on this field being empty as we may add content of any type for other status types in future releases.
   * Query blocked due to a CNAME inspection (status 9, 10, 11)¶
   *
   * If a query was blocked due to a CNAME inspection (status 9, 10, 11), this field contains the domain which was the reason for blocking the entire CNAME chain (text).
   * Query influenced by a black- or whitelist entry¶
   *
   * If a query was influenced by a black- or whitelist entry, this field contains the ID of the corresponding entry in the domainlist table.
   */
  additionalInfo: customJsonb('additional_info'),
  /**
   * 1  A
   *
   * 2 	AAAA
   *
   * 3 	ANY
   *
   * 4 	SRV
   *
   * 5 	SOA
   *
   * 6 	PTR
   *
   * 7 	TXT
   *
   * 8 	NAPTR
   *
   * 9 	MX
   *
   * 10 DS
   *
   * 11 RRSIG
   *
   * 12 DNSKEY
   *
   * 13 NS
   *
   * 14 OTHER (Any other query type will be stored with an offset of 100, i.e., TYPE66 will be stored as 166 in the database)
   *
   * 15 SVCB
   *
   * 16 HTTPS
   */
  type: integer('type').notNull(),
  /**
   * 0 	Unknown 	❔ 	Unknown status (not yet known)
   *
   *
   * 1 	Blocked 	❌ 	Domain contained in gravity database
   *
   * 2 	Allowed 	✅ 	Forwarded
   *
   * 3 	Allowed 	✅ 	Replied from cache
   *
   * 4 	Blocked 	❌ 	Domain matched by a regex blacklist filter
   *
   * 5 	Blocked 	❌ 	Domain contained in exact blacklist
   *
   * 6 	Blocked 	❌ 	By upstream server (known blocking page IP address)
   *
   * 7 	Blocked 	❌ 	By upstream server (0.0.0.0 or ::)
   *
   * 8 	Blocked 	❌ 	By upstream server (NXDOMAIN with RA bit unset)
   *
   * 9 	Blocked 	❌ 	Domain contained in gravity database
   *                     Blocked during deep CNAME inspection
   *
   * 10 	Blocked 	❌ 	Domain matched by a regex blacklist filter
   *                         Blocked during deep CNAME inspection
   *
   * 11 	Blocked 	❌ 	Domain contained in exact blacklist
   *                         Blocked during deep CNAME inspection
   *
   * 12 	Allowed 	✅ 	Retried query
   *
   * 13 	Allowed 	✅ 	Retried but ignored query (this may happen during ongoing DNSSEC validation)
   *
   * 14 	Allowed 	✅ 	Already forwarded, not forwarding again
   *
   * 15 	Blocked 	❌ 	Blocked (database is busy)
   *
   * 16 	Blocked 	❌ 	Blocked (special domain)
   *                         E.g. Mozilla's canary domain and Apple's Private Relay domains
   *
   * 17 	Allowed 	✅⌛ 	Replied from stale cache
   */
  status: integer('status').notNull(),
  /**
   * 0 	unknown (no reply so far)
   *
   *
   * 1 	NODATA
   *
   * 2 	NXDOMAIN
   *
   * 3 	CNAME
   *
   * 4 	a valid IP record
   *
   * 5 	DOMAIN
   *
   * 6 	RRNAME
   *
   * 7 	SERVFAIL
   *
   * 8 	REFUSED
   *
   * 9 	NOTIMP
   *
   * 10 OTHER
   *
   * 11 DNSSEC
   *
   * 12 NONE (query was dropped intentionally)
   *
   * 13 BLOB (binary data)
   */
  replyType: integer('reply_type').notNull(),
  /**
   *
   *  0 	unknown
   *
   *  1 	SECURE
   *
   *  2 	INSECURE
   *
   *  3 	BOGUS
   *
   *  4 	ABANDONED
   */
  dnssec: integer('dnssec'),
})

export type DnsQuery = typeof dnsQueriesTable.$inferSelect
export type NewDnsQuery = typeof dnsQueriesTable.$inferInsert
