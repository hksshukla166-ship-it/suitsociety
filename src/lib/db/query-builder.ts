import { randomUUID } from "crypto";
import type { ExecuteValues, Pool, RowDataPacket } from "mysql2/promise";
import { getPool } from "@/lib/db/pool";

type Row = Record<string, unknown>;
export type DatabaseRow = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbResult =
  | { data: any; error: null; count?: number }
  | { data: null; error: { message: string }; count?: number };

const JSON_FIELDS = new Set([
  "value",
  "specifications",
  "size_stock",
  "colors",
  "sizes",
  "product_ids",
  "category_ids",
  "customer_ids",
  "event_data",
]);

const BOOL_FIELDS = new Set([
  "is_active",
  "is_featured",
  "is_new_arrival",
  "is_trending",
  "is_best_seller",
  "is_primary",
  "is_default",
  "is_approved",
  "verified",
  "apply_to_new_products",
]);

type RelationDef =
  | { kind: "one-to-many"; table: string; foreignKey: string }
  | { kind: "many-to-one"; table: string; foreignKey: string };

const RELATIONS: Record<string, Record<string, RelationDef>> = {
  products: {
    images: { kind: "one-to-many", table: "product_images", foreignKey: "product_id" },
    videos: { kind: "one-to-many", table: "product_videos", foreignKey: "product_id" },
    category: { kind: "many-to-one", table: "categories", foreignKey: "category_id" },
    brand: { kind: "many-to-one", table: "brands", foreignKey: "brand_id" },
    fabric: { kind: "many-to-one", table: "fabrics", foreignKey: "fabric_id" },
  },
  orders: {
    items: { kind: "one-to-many", table: "order_items", foreignKey: "order_id" },
  },
  reviews: {
    user: { kind: "many-to-one", table: "users", foreignKey: "user_id" },
    product: { kind: "many-to-one", table: "products", foreignKey: "product_id" },
  },
  homepage_videos: {
    product: { kind: "many-to-one", table: "products", foreignKey: "product_id" },
  },
  wishlists: {
    product: { kind: "many-to-one", table: "products", foreignKey: "product_id" },
  },
  cart_items: {
    product: { kind: "many-to-one", table: "products", foreignKey: "product_id" },
  },
  inventory: {
    product: { kind: "many-to-one", table: "products", foreignKey: "product_id" },
  },
};

type EmbedSpec = { alias: string; table: string; columns: string; nested: EmbedSpec[] };

function readEmbedAt(s: string, start: number): { embed: EmbedSpec; end: number } | null {
  const m = s.slice(start).match(/^(\w+):(\w+)\(/);
  if (!m) return null;
  const alias = m[1];
  const table = m[2];
  let i = start + m[0].length;
  let depth = 1;
  const innerStart = i;
  while (i < s.length && depth > 0) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    i++;
  }
  const inner = s.slice(innerStart, i - 1).trim();
  const parsed = parseEmbeds(inner);
  return {
    embed: {
      alias,
      table,
      columns: parsed.mainCols,
      nested: parsed.embeds,
    },
    end: i,
  };
}

function parseEmbeds(select: string): { mainCols: string; embeds: EmbedSpec[] } {
  if (select === "*") return { mainCols: "*", embeds: [] };

  const embeds: EmbedSpec[] = [];
  const mainParts: string[] = [];
  let i = 0;
  const s = select.trim();

  while (i < s.length) {
    if (s[i] === " " || s[i] === ",") {
      i++;
      continue;
    }
    const embed = readEmbedAt(s, i);
    if (embed) {
      embeds.push(embed.embed);
      i = embed.end;
      continue;
    }
    const comma = s.indexOf(",", i);
    const part = (comma === -1 ? s.slice(i) : s.slice(i, comma)).trim();
    if (part) mainParts.push(part);
    if (comma === -1) break;
    i = comma + 1;
  }

  return { mainCols: mainParts.length ? mainParts.join(", ") : "*", embeds };
}

function parseOrPart(part: string): { sql: string; params: unknown[] } | null {
  const cs = part.match(/^(\w+)\.cs\.\{(.+)\}$/);
  if (cs) {
    return {
      sql: `JSON_CONTAINS(\`${cs[1]}\`, ?)`,
      params: [JSON.stringify([cs[2]])],
    };
  }
  const eq = part.match(/^(\w+)\.eq\.(.+)$/);
  if (eq) {
    return { sql: `\`${eq[1]}\` = ?`, params: [eq[2]] };
  }
  const gte = part.match(/^(\w+)\.gte\.(.+)$/);
  if (gte) {
    return { sql: `\`${gte[1]}\` >= ?`, params: [gte[2]] };
  }
  const lte = part.match(/^(\w+)\.lte\.(.+)$/);
  if (lte) {
    return { sql: `\`${lte[1]}\` <= ?`, params: [lte[2]] };
  }
  const ilike = part.match(/^(\w+)\.ilike\.(.+)$/);
  if (ilike) {
    return { sql: `LOWER(\`${ilike[1]}\`) LIKE LOWER(?)`, params: [ilike[2]] };
  }
  const andMatch = part.match(/^and\((.+)\)$/);
  if (andMatch) {
    const inner = andMatch[1].split(",").map((p) => p.trim());
    const subs = inner.map(parseOrPart).filter(Boolean) as { sql: string; params: unknown[] }[];
    if (subs.length) {
      return {
        sql: subs.map((s) => s.sql).join(" AND "),
        params: subs.flatMap((s) => s.params),
      };
    }
  }
  return null;
}

function normalizeRow(row: Row): Row {
  const out: Row = { ...row };
  for (const key of Object.keys(out)) {
    let val = out[key];
    if (val instanceof Date) {
      out[key] = val.toISOString();
    } else if (typeof val === "bigint") {
      out[key] = Number(val);
    } else if (JSON_FIELDS.has(key) && typeof val === "string") {
      try {
        out[key] = JSON.parse(val);
      } catch {
        /* keep string */
      }
    } else if (JSON_FIELDS.has(key) && Buffer.isBuffer(val)) {
      out[key] = null;
    } else if (BOOL_FIELDS.has(key)) {
      out[key] = Boolean(val);
    }
  }
  return out;
}

function serializeValue(val: unknown): unknown {
  if (val === undefined) return null;
  if (val === null) return null;
  if (typeof val === "object" && !(val instanceof Date) && !Buffer.isBuffer(val)) {
    return JSON.stringify(val);
  }
  return val;
}

type Filter =
  | { type: "eq"; col: string; val: unknown }
  | { type: "neq"; col: string; val: unknown }
  | { type: "gt" | "gte" | "lt" | "lte"; col: string; val: unknown }
  | { type: "in"; col: string; vals: unknown[] }
  | { type: "ilike"; col: string; pattern: string }
  | { type: "contains"; col: string; val: unknown[] }
  | { type: "or"; expr: string }
  | { type: "raw_or"; parts: { col: string; op: string; val: string }[] };

class SelectBuilder implements PromiseLike<DbResult> {
  private filters: Filter[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private limitN?: number;
  private offsetN?: number;
  private selectStr = "*";
  private countExact = false;
  private headOnly = false;
  private singleRow = false;
  private wantMaybeSingle = false;

  constructor(
    private pool: Pool,
    private table: string
  ) {}

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    this.selectStr = columns;
    if (options?.count === "exact") this.countExact = true;
    if (options?.head) this.headOnly = true;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ type: "eq", col, val });
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push({ type: "neq", col, val });
    return this;
  }

  gt(col: string, val: unknown) {
    this.filters.push({ type: "gt", col, val });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ type: "gte", col, val });
    return this;
  }

  lt(col: string, val: unknown) {
    this.filters.push({ type: "lt", col, val });
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push({ type: "lte", col, val });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push({ type: "in", col, vals });
    return this;
  }

  ilike(col: string, pattern: string) {
    this.filters.push({ type: "ilike", col, pattern });
    return this;
  }

  contains(col: string, val: unknown[]) {
    this.filters.push({ type: "contains", col, val });
    return this;
  }

  or(expr: string) {
    this.filters.push({ type: "or", expr });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.offsetN = from;
    this.limitN = to - from + 1;
    return this;
  }

  single() {
    this.singleRow = true;
    this.limitN = 1;
    return this;
  }

  maybeSingle() {
    this.wantMaybeSingle = true;
    this.limitN = 1;
    return this;
  }

  private buildWhere(): { sql: string; params: unknown[] } {
    const clauses: string[] = [];
    const params: unknown[] = [];

    for (const f of this.filters) {
      if (f.type === "eq") {
        clauses.push(`\`${f.col}\` = ?`);
        params.push(f.val);
      } else if (f.type === "neq") {
        clauses.push(`\`${f.col}\` <> ?`);
        params.push(f.val);
      } else if (f.type === "gt") {
        clauses.push(`\`${f.col}\` > ?`);
        params.push(f.val);
      } else if (f.type === "gte") {
        clauses.push(`\`${f.col}\` >= ?`);
        params.push(f.val);
      } else if (f.type === "lt") {
        clauses.push(`\`${f.col}\` < ?`);
        params.push(f.val);
      } else if (f.type === "lte") {
        clauses.push(`\`${f.col}\` <= ?`);
        params.push(f.val);
      } else if (f.type === "in") {
        if (!f.vals.length) {
          clauses.push("1 = 0");
        } else {
          clauses.push(`\`${f.col}\` IN (${f.vals.map(() => "?").join(", ")})`);
          params.push(...f.vals);
        }
      } else if (f.type === "ilike") {
        clauses.push(`LOWER(\`${f.col}\`) LIKE LOWER(?)`);
        params.push(f.pattern);
      } else if (f.type === "contains") {
        clauses.push(`JSON_CONTAINS(\`${f.col}\`, ?)`);
        params.push(JSON.stringify(f.val));
      } else if (f.type === "or") {
        const parts = f.expr.split(",").map((p) => p.trim());
        const orParts: string[] = [];
        for (const part of parts) {
          const parsed = parseOrPart(part);
          if (parsed) {
            orParts.push(parsed.sql);
            params.push(...parsed.params);
          }
        }
        if (orParts.length) clauses.push(`(${orParts.join(" OR ")})`);
      }
    }

    return { sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
  }

  private async attachEmbeds(rows: Row[], embeds: EmbedSpec[]): Promise<Row[]> {
    if (!rows.length || !embeds.length) return rows;

    for (const embed of embeds) {
      const rel = RELATIONS[this.table]?.[embed.alias];
      if (!rel) continue;

      if (rel.kind === "one-to-many") {
        const ids = rows.map((r) => r.id).filter(Boolean);
        if (!ids.length) continue;
        const cols = embed.columns === "*" ? "*" : embed.columns;
        const [childRows] = await this.pool.execute<RowDataPacket[]>(
          `SELECT ${cols === "*" ? "*" : cols} FROM \`${rel.table}\` WHERE \`${rel.foreignKey}\` IN (${ids.map(() => "?").join(", ")})`,
          ids as ExecuteValues
        );
        let children = (childRows as Row[]).map(normalizeRow);
        if (embed.nested.length) {
          const nestedBuilder = new SelectBuilder(this.pool, rel.table);
          children = await nestedBuilder.attachEmbeds(children, embed.nested);
        }
        const byFk = new Map<string, Row[]>();
        for (const c of children) {
          const fk = String(c[rel.foreignKey]);
          if (!byFk.has(fk)) byFk.set(fk, []);
          byFk.get(fk)!.push(c);
        }
        for (const row of rows) {
          row[embed.alias] = byFk.get(String(row.id)) || [];
        }
      } else {
        const fkValues = [...new Set(rows.map((r) => r[rel.foreignKey]).filter(Boolean))];
        if (!fkValues.length) continue;
        const cols = embed.columns === "*" ? "*" : embed.columns;
        const [parentRows] = await this.pool.execute<RowDataPacket[]>(
          `SELECT ${cols === "*" ? "*" : cols} FROM \`${rel.table}\` WHERE id IN (${fkValues.map(() => "?").join(", ")})`,
          fkValues as ExecuteValues
        );
        let related = (parentRows as Row[]).map(normalizeRow);
        if (embed.nested.length) {
          const nestedBuilder = new SelectBuilder(this.pool, rel.table);
          related = await nestedBuilder.attachEmbeds(related, embed.nested);
        }
        const byId = new Map(related.map((r) => [String(r.id), r]));
        for (const row of rows) {
          const fk = row[rel.foreignKey];
          row[embed.alias] = fk ? byId.get(String(fk)) ?? null : null;
        }
      }
    }

    return rows;
  }

  async then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : (result as TResult1);
    } catch (reason) {
      if (onrejected) return onrejected(reason);
      throw reason;
    }
  }

  private async execute(): Promise<DbResult> {
    const { sql: whereSql, params } = this.buildWhere();
    const { mainCols, embeds } = parseEmbeds(this.selectStr);
    const selectCols = mainCols === "*" ? "*" : mainCols;

    if (this.countExact && this.headOnly) {
      const [countRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM \`${this.table}\`${whereSql}`,
        params as ExecuteValues
      );
      const count = Number((countRows[0] as Row).cnt ?? 0);
      return { data: null, error: null, count };
    }

    let sql = `SELECT ${selectCols} FROM \`${this.table}\`${whereSql}`;
    if (this.orders.length) {
      sql += ` ORDER BY ${this.orders.map((o) => `\`${o.col}\` ${o.asc ? "ASC" : "DESC"}`).join(", ")}`;
    }
    if (this.limitN !== undefined) sql += ` LIMIT ${this.limitN}`;
    if (this.offsetN !== undefined) sql += ` OFFSET ${this.offsetN}`;

    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, params as ExecuteValues);
    let data = (rows as Row[]).map(normalizeRow);
    data = await this.attachEmbeds(data, embeds);

    let count: number | undefined;
    if (this.countExact) {
      const [countRows] = await this.pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as cnt FROM \`${this.table}\`${whereSql}`,
        params as ExecuteValues
      );
      count = Number((countRows[0] as Row).cnt ?? 0);
    }

    if (this.singleRow) {
      if (!data.length) {
        return { data: null, error: { message: "Row not found" }, count };
      }
      return { data: data[0], error: null, count };
    }

    if (this.wantMaybeSingle) {
      return { data: data[0] ?? null, error: null, count };
    }

    return { data, error: null, count };
  }
}

class MutateBuilder implements PromiseLike<DbResult> {
  private returning = false;
  private singleRow = false;

  constructor(
    private pool: Pool,
    private table: string,
    private mode: "insert" | "update" | "upsert" | "delete",
    private payload: Row | Row[],
    private filters: Filter[] = [],
    private upsertConflict?: string
  ) {}

  eq(col: string, val: unknown) {
    this.filters.push({ type: "eq", col, val });
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push({ type: "neq", col, val });
    return this;
  }

  select(_cols = "*") {
    this.returning = true;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  async then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : (result as TResult1);
    } catch (reason) {
      if (onrejected) return onrejected(reason);
      throw reason;
    }
  }

  private async execute(): Promise<DbResult> {
    try {
      if (this.mode === "insert") {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const inserted: Row[] = [];
        for (const row of rows) {
          const id = (row.id as string) || randomUUID();
          const data = { ...row, id };
          const cols = Object.keys(data);
          const vals = cols.map((c) => serializeValue(data[c]));
          await this.pool.execute(
            `INSERT INTO \`${this.table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
            vals as ExecuteValues
          );
          if (this.returning) {
            const [sel] = await this.pool.execute<RowDataPacket[]>(
              `SELECT * FROM \`${this.table}\` WHERE id = ? LIMIT 1`,
              [id] as ExecuteValues
            );
            inserted.push(normalizeRow((sel[0] as Row) || data));
          }
        }
        if (this.singleRow) {
          return { data: inserted[0] ?? null, error: null };
        }
        return { data: inserted, error: null };
      }

      if (this.mode === "upsert") {
        const row = this.payload as Row;
        const conflict = this.upsertConflict || "id";
        const conflictCols = conflict.split(",").map((c) => c.trim());
        const data = { ...row };
        if (!data.id) data.id = randomUUID();
        const cols = Object.keys(data);
        const vals = cols.map((c) => serializeValue(data[c]));
        const updates = cols
          .filter((c) => !conflictCols.includes(c))
          .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
          .join(", ");
        await this.pool.execute(
          `INSERT INTO \`${this.table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})
           ON DUPLICATE KEY UPDATE ${updates || `\`id\` = \`id\``}`,
          vals as ExecuteValues
        );
        if (this.returning) {
          const lookupCol = conflictCols[0];
          const lookupVal = data[lookupCol];
          const [sel] = await this.pool.execute<RowDataPacket[]>(
            `SELECT * FROM \`${this.table}\` WHERE \`${lookupCol}\` = ? LIMIT 1`,
            [lookupVal] as ExecuteValues
          );
          const one = normalizeRow((sel[0] as Row) || data);
          return { data: this.singleRow ? one : [one], error: null };
        }
        return { data: [], error: null };
      }

      if (this.mode === "update") {
        const data = this.payload as Row;
        const cols = Object.keys(data);
        const sets = cols.map((c) => `\`${c}\` = ?`).join(", ");
        const vals = cols.map((c) => serializeValue(data[c]));
        const whereParts: string[] = [];
        const whereParams: unknown[] = [];
        for (const f of this.filters) {
          if (f.type === "eq") {
            whereParts.push(`\`${f.col}\` = ?`);
            whereParams.push(f.val);
          } else if (f.type === "neq") {
            whereParts.push(`\`${f.col}\` <> ?`);
            whereParams.push(f.val);
          }
        }
        const where = whereParts.length ? ` WHERE ${whereParts.join(" AND ")}` : "";
        await this.pool.execute(
          `UPDATE \`${this.table}\` SET ${sets}${where}`,
          [...vals, ...whereParams] as ExecuteValues
        );

        if (this.returning && this.filters.length === 1 && this.filters[0].type === "eq") {
          const [sel] = await this.pool.execute<RowDataPacket[]>(
            `SELECT * FROM \`${this.table}\` WHERE \`${this.filters[0].col}\` = ? LIMIT 1`,
            [this.filters[0].val] as ExecuteValues
          );
          const one = normalizeRow(sel[0] as Row);
          return { data: this.singleRow ? one : [one], error: null };
        }
        return { data: [], error: null };
      }

      const whereParts: string[] = [];
      const whereParams: unknown[] = [];
      for (const f of this.filters) {
        if (f.type === "eq") {
          whereParts.push(`\`${f.col}\` = ?`);
          whereParams.push(f.val);
        } else if (f.type === "neq") {
          whereParts.push(`\`${f.col}\` <> ?`);
          whereParams.push(f.val);
        }
      }
      const where = whereParts.length ? ` WHERE ${whereParts.join(" AND ")}` : "";
      await this.pool.execute(`DELETE FROM \`${this.table}\`${where}`, whereParams as ExecuteValues);
      return { data: [], error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Database error";
      return { data: null, error: { message } };
    }
  }
}

class StorageBucket {
  constructor(private bucket: string) {}

  async upload(path: string, buffer: Buffer, options?: { contentType?: string; upsert?: boolean }) {
    const { saveMediaFile } = await import("@/lib/db/media");
    try {
      const { id, publicUrl } = await saveMediaFile(
        this.bucket,
        buffer,
        options?.contentType || "application/octet-stream"
      );
      void publicUrl;
      return { data: { path: id, id, fullPath: path }, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : "Upload failed" },
      };
    }
  }

  getPublicUrl(pathOrId: string) {
    const id = pathOrId.includes("/") ? pathOrId.split("/").pop()! : pathOrId;
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return { data: { publicUrl: `${base.replace(/\/$/, "")}/api/media/${id}` } };
  }

  async getBucket(_name: string) {
    return { data: { name: this.bucket }, error: null };
  }

  async createBucket(_name: string, _opts?: unknown) {
    return { data: { name: this.bucket }, error: null };
  }

  async updateBucket(_name: string, _opts?: unknown) {
    return { data: { name: this.bucket }, error: null };
  }

  async createSignedUploadUrl(_path: string) {
    const id = randomUUID();
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const signedUrl = `${base.replace(/\/$/, "")}/api/admin/upload/put?id=${id}&bucket=${this.bucket}`;
    return {
      data: { path: id, token: id, signedUrl },
      error: null,
    };
  }

  async uploadToSignedUrl(path: string, _token: string, file: File, options?: { contentType?: string }) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { saveMediaFile } = await import("@/lib/db/media");
    try {
      await saveMediaFile(this.bucket, buffer, options?.contentType || file.type, path);
      return { data: { path }, error: null };
    } catch (error) {
      return { data: null, error: { message: error instanceof Error ? error.message : "Upload failed" } };
    }
  }
}

export function createDbClient() {
  const pool = getPool();

  return {
    from(table: string) {
      const builder = new SelectBuilder(pool, table);
      return Object.assign(builder, {
        insert(payload: Row | Row[]) {
          return new MutateBuilder(pool, table, "insert", payload);
        },
        upsert(payload: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
          void opts?.ignoreDuplicates;
          return new MutateBuilder(pool, table, "upsert", payload as Row, [], opts?.onConflict);
        },
        update(payload: Row) {
          return new MutateBuilder(pool, table, "update", payload);
        },
        delete() {
          return new MutateBuilder(pool, table, "delete", {});
        },
      });
    },
    storage: {
      from(bucket: string) {
        return new StorageBucket(bucket);
      },
    },
    auth: {
      async getUser() {
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const raw = cookieStore.get("user_token")?.value;
          if (!raw) return { data: { user: null }, error: null };
          const data = JSON.parse(Buffer.from(raw, "base64").toString());
          if (data.exp < Date.now()) return { data: { user: null }, error: null };
          return {
            data: {
              user: {
                id: data.id,
                phone: data.phone,
                user_metadata: { full_name: data.name },
              },
            },
            error: null,
          };
        } catch {
          return { data: { user: null }, error: null };
        }
      },
      async signInWithOtp(_opts: { phone: string }) {
        return { data: {}, error: { message: "Use /api/auth/otp for phone login" } };
      },
      async verifyOtp(_opts: unknown) {
        return { data: {}, error: { message: "Use /api/auth/otp for phone login" } };
      },
      async signInWithPassword(_opts: unknown) {
        return { data: {}, error: null };
      },
      admin: {
        async createUser(_opts: unknown) {
          const id = randomUUID();
          return { data: { user: { id } }, error: null };
        },
        async listUsers() {
          return { data: { users: [] }, error: null };
        },
        async updateUserById(_id: string, _opts: unknown) {
          return { data: { user: {} }, error: null };
        },
      },
    },
  };
}
