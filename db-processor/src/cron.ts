import { Client } from "pg";

export async function startRefreshingViews(pgClient: Client) {
  try {
    const res = await pgClient.query(`
    SELECT matviewname 
    FROM pg_matviews 
    WHERE schemaname = 'public'
  `);

    const mat_views = res.rows.map(({ matviewname }) => matviewname);

    if (mat_views.length > 0) {
      const promises = mat_views.map((tab) => {
        pgClient.query(`REFRESH MATERIALIZED VIEW ${tab}`);
      });

      await Promise.allSettled(promises);

      console.log("Materialized views refreshed successfully");
    }
  } catch (error) {
    console.log("refreshViews error: ", error);
  } finally {
    const ten_seconds = 1000 * 10;

    let id = setInterval(() => {
      startRefreshingViews(pgClient);
    }, ten_seconds);
  }
}
