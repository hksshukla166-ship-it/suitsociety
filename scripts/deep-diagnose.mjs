import { config } from "dotenv";
config({ path: ".env.local" });

const SDK = await import("@fonoster/sdk");
const client = new SDK.Client({
  accessKeyId: process.env.FONOSTER_WORKSPACE_ACCESS_KEY_ID,
  endpoint: process.env.FONOSTER_ENDPOINT || "api.fonoster.com",
});
await client.loginWithApiKey(process.env.FONOSTER_API_KEY, process.env.FONOSTER_API_SECRET);
console.log("Auth OK\n");

const workspaces = new SDK.Workspaces(client);
const { items: ws } = await workspaces.listWorkspaces();
console.log("Workspaces:", JSON.stringify(ws?.map((w) => ({ name: w.name, accessKeyId: w.accessKeyId })), null, 2));

const apps = new SDK.Applications(client);
const app = await apps.getApplication(process.env.FONOSTER_APP_REF);
console.log("\nApp full config:", JSON.stringify(app, null, 2));

const numbers = new SDK.Numbers(client);
const numList = await numbers.listNumbers({ pageSize: 20 });
console.log("\nNumbers full:", JSON.stringify(numList.items, null, 2));

try {
  const trunks = new SDK.Trunks(client);
  const trunkList = await trunks.listTrunks({ pageSize: 20 });
  console.log("\nTrunks:", JSON.stringify(trunkList.items, null, 2));
} catch (e) {
  console.log("\nTrunks error:", e.message);
}

const calls = new SDK.Calls(client);
const callList = await calls.listCalls({ pageSize: 10 });
console.log("\nRecent calls:", JSON.stringify(callList.items, null, 2));

const callRef = process.argv[2];
if (callRef) {
  try {
    const detail = await calls.getCall(callRef);
    console.log("\nCall detail:", JSON.stringify(detail, null, 2));
  } catch (e) {
    console.log("\nGet call error:", e.message);
  }
}
