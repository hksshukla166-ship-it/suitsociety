type FonosterSdk = typeof import("@fonoster/sdk");

const FONOSTER_ENDPOINT = process.env.FONOSTER_ENDPOINT || "api.fonoster.com";
const CALL_TIMEOUT_MS = 15_000;

let cachedSdk: FonosterSdk | null = null;
let cachedWorkspaceId: string | null = null;
let cachedClient: InstanceType<FonosterSdk["Client"]> | null = null;

async function loadSdk(): Promise<FonosterSdk> {
  if (!cachedSdk) {
    cachedSdk = await import("@fonoster/sdk");
  }
  return cachedSdk;
}

function getCredentials() {
  const apiKey = process.env.FONOSTER_API_KEY;
  const apiSecret = process.env.FONOSTER_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("Fonoster API credentials are not configured");
  }
  return { apiKey, apiSecret };
}

async function resolveWorkspaceId(
  SDK: FonosterSdk,
  apiKey: string,
  apiSecret: string
): Promise<string> {
  if (process.env.FONOSTER_WORKSPACE_ACCESS_KEY_ID) {
    return process.env.FONOSTER_WORKSPACE_ACCESS_KEY_ID;
  }

  if (cachedWorkspaceId) return cachedWorkspaceId;

  const discoveryClient = new SDK.Client({
    accessKeyId: apiKey,
    endpoint: FONOSTER_ENDPOINT,
  });
  await discoveryClient.loginWithApiKey(apiKey, apiSecret);

  const workspaces = new SDK.Workspaces(discoveryClient);
  const { items } = await workspaces.listWorkspaces();
  const workspace = items?.[0];
  if (!workspace?.accessKeyId) {
    throw new Error("No Fonoster workspace found for these credentials");
  }

  cachedWorkspaceId = workspace.accessKeyId;
  return workspace.accessKeyId;
}

async function getFonosterClient() {
  if (cachedClient) return cachedClient;

  const SDK = await loadSdk();
  const { apiKey, apiSecret } = getCredentials();
  const workspaceId = await resolveWorkspaceId(SDK, apiKey, apiSecret);

  const client = new SDK.Client({
    accessKeyId: workspaceId,
    endpoint: FONOSTER_ENDPOINT,
  });
  await client.loginWithApiKey(apiKey, apiSecret);

  cachedClient = client;
  return client;
}

function formatIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    throw new Error("Invalid phone number");
  }
  return `+91${digits}`;
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${CALL_TIMEOUT_MS}ms`));
    }, CALL_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

const CALL_STATUS_WAIT_MS = 10_000;
const DELIVERED_STATUSES = new Set(["RINGING", "ANSWER", "IN_PROGRESS", "TRYING"]);
const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "BUSY", "NOANSWER", "CANCEL", "UNALLOCATED_NUMBER"]);

export type OtpCallResult = {
  callRef: string;
  delivered: boolean;
  statuses: string[];
};

async function waitForCallDelivery(
  statusStream: AsyncIterable<{ status: string }>
): Promise<{ delivered: boolean; statuses: string[] }> {
  const statuses: string[] = [];
  let delivered = false;

  const consumeStream = (async () => {
    try {
      for await (const update of statusStream) {
        const status = update.status;
        statuses.push(status);
        if (DELIVERED_STATUSES.has(status)) {
          delivered = true;
        }
        if (TERMINAL_STATUSES.has(status)) {
          break;
        }
      }
    } catch (error) {
      console.error("Fonoster status stream error:", error);
    }
  })();

  await Promise.race([
    consumeStream,
    new Promise((resolve) => setTimeout(resolve, CALL_STATUS_WAIT_MS)),
  ]);

  return { delivered, statuses };
}

export async function sendOtpViaFonoster(phone: string, otp: string): Promise<OtpCallResult> {
  const fromNumber = process.env.FONOSTER_FROM_NUMBER;
  const appRef = process.env.FONOSTER_APP_REF;

  if (!fromNumber || !appRef) {
    throw new Error("Fonoster phone number or application is not configured");
  }

  const SDK = await loadSdk();
  const client = await withTimeout(getFonosterClient(), "Fonoster authentication");
  const calls = new SDK.Calls(client);

  const response = await withTimeout(
    calls.createCall({
      from: fromNumber,
      to: formatIndianPhone(phone),
      appRef,
      timeout: 45,
      metadata: { otp },
    }),
    "Fonoster call creation"
  );

  if (!response?.ref) {
    throw new Error("Fonoster did not return a call reference");
  }

  const { delivered, statuses } = response.statusStream
    ? await waitForCallDelivery(response.statusStream)
    : { delivered: false, statuses: [] as string[] };

  if (!delivered) {
    console.warn("Fonoster call did not reach ringing state", {
      callRef: response.ref,
      to: formatIndianPhone(phone),
      statuses,
    });
  }

  return { callRef: response.ref, delivered, statuses };
}

export function isFonosterConfigured(): boolean {
  return Boolean(
    process.env.FONOSTER_API_KEY &&
      process.env.FONOSTER_API_SECRET &&
      process.env.FONOSTER_FROM_NUMBER &&
      process.env.FONOSTER_APP_REF
  );
}
