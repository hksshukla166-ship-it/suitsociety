"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    mysqlHost: "127.0.0.1",
    mysqlPort: "3306",
    mysqlUser: "root",
    mysqlPassword: "",
    mysqlDatabase: "suitsociety",
    databaseUrl: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    siteUrl: "http://localhost:3000",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Setup failed");
      }

      toast.success(data.message || "Setup complete! Restart the dev server, then open the store.");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen luxury-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-gold/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 gold-gradient rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-serif">Suit Society</CardTitle>
          <CardDescription className="text-base">
            Connect MySQL — product photos are stored in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>MySQL host</Label>
              <Input
                required={!form.databaseUrl}
                value={form.mysqlHost}
                onChange={(e) => setForm({ ...form, mysqlHost: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  value={form.mysqlPort}
                  onChange={(e) => setForm({ ...form, mysqlPort: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Database</Label>
                <Input
                  required={!form.databaseUrl}
                  value={form.mysqlDatabase}
                  onChange={(e) => setForm({ ...form, mysqlDatabase: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>MySQL user</Label>
              <Input
                required={!form.databaseUrl}
                value={form.mysqlUser}
                onChange={(e) => setForm({ ...form, mysqlUser: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>MySQL password</Label>
              <Input
                type="password"
                value={form.mysqlPassword}
                onChange={(e) => setForm({ ...form, mysqlPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Or connection URL (optional)</Label>
              <Input
                placeholder="mysql://user:pass@localhost:3306/suitsociety"
                value={form.databaseUrl}
                onChange={(e) => setForm({ ...form, databaseUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Razorpay Key ID (optional)</Label>
              <Input
                value={form.razorpayKeyId}
                onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Razorpay Secret (optional)</Label>
              <Input
                type="password"
                value={form.razorpayKeySecret}
                onChange={(e) => setForm({ ...form, razorpayKeySecret: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save & initialize"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
