import { config } from "dotenv";
config({ path: ".env.local" });

const SDK = await import("@fonoster/sdk");
const client = new SDK.Client({
  accessKeyId: process.env.FONOSTER_WORKSPACE_ACCESS_KEY_ID,
  endpoint: process.env.FONOSTER_ENDPOINT || "api.fonoster.com",
});
await client.loginWithApiKey(process.env.FONOSTER_API_KEY, process.env.FONOSTER_API_SECRET);

const phone = process.argv[2] || "9876543210";
const calls = new SDK.Calls(client);

console.log("Creating call...");
const response = await calls.createCall({
  from: process.env.FONOSTER_FROM_NUMBER,
  to: `+91${phone.replace(/\D/g, "").slice(-10)}`,
  appRef: process.env.FONOSTER_APP_REF,
  timeout: 30,
  metadata: { otp: "123456" },
});

console.log("Call ref:", response.ref);

for await (const status of response.statusStream) {
  console.log("Status:", JSON.stringify(status));
}
