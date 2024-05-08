import {
	blob,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

// 0|id|INTEGER|0||0
// 1|timestamp|INTEGER|0||0
// 2|type|INTEGER|0||0
// 3|status|INTEGER|0||0
// 4|domain||0||0
// 5|client||0||0
// 6|forward||0||0
// 7|additional_info||0||0
// 8|reply_type|INTEGER|0||0
// 9|reply_time|REAL|0||0
// 10|dnssec|INTEGER|0||0
// https://docs.pi-hole.net/database/ftl/
export const externalDnsQueriesTable = sqliteTable("queries", {
	id: integer("id"),
	timestamp: integer("timestamp", { mode: "timestamp" }),
	type: integer("type"),
	status: integer("status"),
	domain: text("domain"),
	client: text("client"),
	forward: text("forward"),
	additionalInfo: blob("additional_info"),
	replyType: integer("reply_type"),
	replyTime: real("reply_time"),
	dnssec: integer("dnssec"),
});

export type ExternalDnsQuery = typeof externalDnsQueriesTable.$inferSelect;
