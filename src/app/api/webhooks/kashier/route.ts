/**
 * Legacy plural path — same handler as `/api/webhook/kashier`.
 * Keep both so existing Kashier dashboard configs keep working.
 */
export { GET, POST } from "@/app/api/webhook/kashier/route";
