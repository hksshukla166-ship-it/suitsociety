import { config } from "dotenv";
config({ path: ".env.local" });

const apiKey = process.env.FONOSTER_API_KEY;
const apiSecret = process.env.FONOSTER_API_SECRET;
const workspaceId = process.env.FONOSTER_WORKSPACE_ACCESS_KEY_ID;
const endpoint = process.env.FONOSTER_ENDPOINT || "api.fonoster.com";
const fromNumber = process.env.FONOSTER_FROM_NUMBER;
const appRef = process.env.FONOSTER_APP_REF;

const SDK = await import("@fonoster/sdk");
const client = new SDK.Client({ accessKeyId: workspaceId, endpoint });
await client.loginWithApiKey(apiKey, apiSecret);

console.log("=== Applications ===");
const apps = new SDK.Applications(client);
const appList = await apps.listApplications({ pageSize: 20 });
for (const app of appList.items || []) {
  console.log(JSON.stringify({ ref: app.ref, name: app.name, type: app.type, endpoint: app.endpoint }, null, 2));
}

console.log("\n=== Configured app ===");
try {
  const configuredApp = await apps.getApplication(appRef);
  console.log(JSON.stringify({
    ref: configuredApp.ref,
    name: configuredApp.name,
    type: configuredApp.type,
    endpoint: configuredApp.endpoint,
  }, null, 2));
} catch (e) {
  console.error("Configured FONOSTER_APP_REF invalid:", e.message);
}

console.log("\n=== Numbers ===");
const numbers = new SDK.Numbers(client);
const numList = await numbers.listNumbers({ pageSize: 20 });
for (const num of numList.items || []) {
  console.log(JSON.stringify({ ref: num.ref, name: num.name, telUrl: num.telUrl, appRef: num.appRef }, null, 2));
}

console.log("\n=== Recent Calls ===");
const calls = new SDK.Calls(client);
const callList = await calls.listCalls({ pageSize: 10 });
for (const call of callList.items || []) {
  console.log(JSON.stringify({
    ref: call.ref,
    from: call.from,
    to: call.to,
    status: call.status,
    createdAt: call.createdAt,
    appRef: call.appRef,
  }, null, 2));
}

console.log("\n=== Env check ===");
console.log({ fromNumber, appRef, workspaceId });
