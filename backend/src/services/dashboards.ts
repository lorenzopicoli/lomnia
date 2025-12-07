import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { dashboardsTable, type NewDashboard } from "../models/Dashboard";

export namespace DashboardService {
  export async function create(dashboard: NewDashboard) {
    await db.insert(dashboardsTable).values(dashboard);
  }
  export async function getAll() {
    return await db.select({ id: dashboardsTable.id, name: dashboardsTable.name }).from(dashboardsTable);
  }
  export async function get(id: number) {
    return await db
      .select()
      .from(dashboardsTable)
      .where(eq(dashboardsTable.id, id))
      .then((r) => r[0]);
  }
  export async function update(id: number, dashboard: Partial<NewDashboard>) {
    await db.update(dashboardsTable).set(dashboard).where(eq(dashboardsTable.id, id));
  }
  export async function deleteDashboard(id: number) {
    await db.delete(dashboardsTable).where(eq(dashboardsTable.id, id));
  }
}
