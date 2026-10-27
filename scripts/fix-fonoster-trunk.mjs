import { config } from "dotenv";
config({ path: ".env.local" });

const SDK = await import("@fonoster/sdk");
const client = new SDK.Client({
  accessKeyId: process.env.FONOSTER_WORKSPACE_ACCESS_KEY_ID,
  endpoint: process.env.FONOSTER_ENDPOINT || "api.fonoster.com",
});
await client.loginWithApiKey(process.env.FONOSTER_API_KEY, process.env.FONOSTER_API_SECRET);

const trunkRef = "5b05b972-a719-4182-8ff4-2d889c2d3fd8";
const trunks = new SDK.Trunks(client);

console.log("Updating trunk for outbound PSTN (TCP)...");
try {
  const result = await trunks.updateTrunk({
    ref: trunkRef,
    name: "Suit Society PSTN",
    sendRegister: true,
    inboundUri: "suitsociety.sip.fonoster.com",
    uris: [
      {
        host: "pstn.fonoster.com",
        port: 5060,
        transport: "TCP",
        user: "",
        weight: 1,
        priority: 1,
        enabled: true,
      },
    ],
  });
  console.log("Trunk updated:", result);
} catch (e) {
  console.error("Trunk update failed:", e.message);
}

console.log("\nTest call after trunk fix...");
const phone = process.argv[2] || "9876543210";
const calls = new SDK.Calls(client);
const response = await calls.createCall({
  from: process.env.FONOSTER_FROM_NUMBER,
  to: `+91${phone.replace(/\D/g, "").slice(-10)}`,
  appRef: process.env.FONOSTER_APP_REF,
  timeout: 45,
  metadata: { otp: "112233" },
});
console.log("Call ref:", response.ref);

const statuses = [];
if (response.statusStream) {
  const timeout = setTimeout(() => {}, 15000);
  try {
    for await (const s of response.statusStream) {
      statuses.push(s.status);
      console.log("Status:", s.status);
    }
  } catch (e) {
    console.log("Stream ended:", e.message);
  }
  clearTimeout(timeout);
}

await new Promise((r) => setTimeout(r, 3000));
const callList = await calls.listCalls({ pageSize: 3 });
console.log("\nRecent calls:", JSON.stringify(callList.items?.map((c) => ({
  ref: c.ref, to: c.to, status: c.status, duration: c.duration,
})), null, 2));
console.log("Stream statuses:", statuses);
