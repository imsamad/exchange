"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRefreshingViews = startRefreshingViews;
function startRefreshingViews(pgClient) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield pgClient.query(`
    SELECT matviewname 
    FROM pg_matviews 
    WHERE schemaname = 'public'
  `);
            const mat_views = res.rows.map(({ matviewname }) => matviewname);
            if (mat_views.length > 0) {
                const promises = mat_views.map((tab) => {
                    pgClient.query(`REFRESH MATERIALIZED VIEW ${tab}`);
                });
                yield Promise.allSettled(promises);
                console.log("Materialized views refreshed successfully");
            }
        }
        catch (error) {
            console.log("refreshViews error: ", error);
        }
        finally {
            const ten_seconds = 1000 * 10;
            let id = setInterval(() => {
                startRefreshingViews(pgClient);
            }, ten_seconds);
        }
    });
}
