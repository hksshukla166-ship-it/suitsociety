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
console.log("Auth OK");

const apps = new SDK.Applications(client);
const appList = await apps.listApplications();
console.log("\nApplications:", JSON.stringify(appList.items?.map(a => ({ ref: a.ref, name: a.name, type: a.type })), null, 2));

const numbers = new SDK.Numbers(client);
try {
  const numList = await numbers.listNumbers();
  console.log("\nNumbers:", JSON.stringify(numList.items?.map(n => ({ telUrl: n.telUrl, ref: n.ref })), null, 2));
} catch (e) {
  console.log("\nNumbers list error:", e.message);
}

// Test call creation (use a test number - won't actually dial unless valid)
const testPhone = process.argv[2];
if (testPhone) {
  const calls = new SDK.Calls(client);
  console.log(`\nCreating call to +91${testPhone.slice(-10)} from ${fromNumber} app ${appRef}`);
  try {
    const response = await calls.createCall({
      from: fromNumber,
      to: `+91${testPhone.replace(/\D/g, "").slice(-10)}`,
      appRef,
      timeout: 30,
      metadata: { otp: "123456" },
    });
    console.log("Call response:", JSON.stringify(response, null, 2));
  } catch (e) {
    console.error("Call failed:", e.message, e);
  }
}
