import { config } from "dotenv";
config({ path: ".env.local" });

const apiKey = process.env.FONOSTER_API_KEY;
const apiSecret = process.env.FONOSTER_API_SECRET;
const endpoint = process.env.FONOSTER_ENDPOINT || "api.fonoster.com";

const SDK = await import("@fonoster/sdk");

console.log("=== Workspace discovery ===");
const discoveryClient = new SDK.Client({ accessKeyId: apiKey, endpoint });
await discoveryClient.loginWithApiKey(apiKey, apiSecret);
const workspaces = new SDK.Workspaces(discoveryClient);
const { items: wsItems } = await workspaces.listWorkspaces();
for (const ws of wsItems || []) {
  console.log(JSON.stringify({ accessKeyId: ws.accessKeyId, name: ws.name, ref: ws.ref }, null, 2));
}

const workspaceId = process.env.FONOSTER_WORKSPACE_ACCESS_KEY_ID || wsItems?.[0]?.accessKeyId;
console.log("\nUsing workspace:", workspaceId);

const client = new SDK.Client({ accessKeyId: workspaceId, endpoint });
await client.loginWithApiKey(apiKey, apiSecret);

console.log("\n=== Trunks ===");
const trunks = new SDK.Trunks(client);
try {
  const trunkList = await trunks.listTrunks({ pageSize: 20 });
  for (const t of trunkList.items || []) {
    console.log(JSON.stringify(t, null, 2));
  }
  if (!trunkList.items?.length) console.log("(no trunks configured)");
} catch (e) {
  console.log("Trunks error:", e.message);
}

console.log("\n=== Numbers (full) ===");
const numbers = new SDK.Numbers(client);
const numList = await numbers.listNumbers({ pageSize: 20 });
for (const num of numList.items || []) {
  console.log(JSON.stringify(num, null, 2));
}

console.log("\n=== App details ===");
const apps = new SDK.Applications(client);
const app = await apps.getApplication(process.env.FONOSTER_APP_REF);
console.log(JSON.stringify(app, null, 2));

console.log("\n=== Create test call ===");
const phone = process.argv[2] || "9876543210";
const calls = new SDK.Calls(client);
try {
  const response = await calls.createCall({
    from: process.env.FONOSTER_FROM_NUMBER,
    to: `+91${phone.replace(/\D/g, "").slice(-10)}`,
    appRef: process.env.FONOSTER_APP_REF,
    timeout: 30,
    metadata: { otp: "999888" },
  });
  console.log("Create response:", JSON.stringify(response, null, 2));

  if (response.statusStream) {
    console.log("\n=== Status stream ===");
    const timeout = setTimeout(() => console.log("(stream timeout 20s)"), 20000);
    try {
      for await (const status of response.statusStream) {
        console.log("Status:", JSON.stringify(status));
      }
    } catch (streamErr) {
      console.log("Stream error:", streamErr.message);
    }
    clearTimeout(timeout);
  }

  console.log("\n=== Call detail ===");
  const detail = await calls.getCall(response.ref);
  console.log(JSON.stringify(detail, null, 2));
} catch (e) {
  console.error("Call failed:", e.message);
  if (e.details) console.error("Details:", e.details);
}

console.log("\n=== Recent calls after test ===");
const callList = await calls.listCalls({ pageSize: 5 });
for (const call of callList.items || []) {
  console.log(JSON.stringify({
    ref: call.ref, from: call.from, to: call.to, status: call.status, createdAt: call.createdAt,
  }, null, 2));
}
