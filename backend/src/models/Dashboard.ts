import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

const ChartSchema = z
  .object({
    id: z.string(),
    uniqueId: z.string().uuid(),
    title: z.string(),
  })
  .loose();

const LayoutItemSchema = z
  .object({
    w: z.number(),
    h: z.number(),
    x: z.number(),
    y: z.number(),
    /**
     * Matches a chart uniqueId
     */
    i: z.uuid(),
  })
  .loose();

const PlacementSchema = z
  .object({
    lg: z.array(LayoutItemSchema),
    md: z.array(LayoutItemSchema),
    sm: z.array(LayoutItemSchema),
    xs: z.array(LayoutItemSchema),
    xxs: z.array(LayoutItemSchema),
  })
  .loose();

export const DashboardSchema = z.object({
  idToChart: z.record(z.uuid(), ChartSchema),
  placement: PlacementSchema,
});

export const dashboardsTable = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  /**
   * The name of the dashboard
   */
  name: text("name").notNull(),
  /**
   * The dashboard's content
   */
  content: jsonb("content").$type<z.infer<typeof DashboardSchema>>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export type Dashboard = typeof dashboardsTable.$inferSelect;
export type NewDashboard = typeof dashboardsTable.$inferInsert;
