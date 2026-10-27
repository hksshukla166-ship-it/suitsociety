"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAdmin } from "@/actions/auth";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [fieldsLocked, setFieldsLocked] = useState(true);

  useEffect(() => {
    fetch("/api/health").catch(() => undefined);
  }, []);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    form.querySelectorAll<HTMLInputElement>("input[data-admin-field]").forEach((input) => {
      input.value = "";
    });

    const timer = window.setTimeout(() => setFieldsLocked(false), 100);
    return () => window.clearTimeout(timer);
  }, []);

  const unlockField = (event: React.FocusEvent<HTMLInputElement>) => {
    event.currentTarget.removeAttribute("readonly");
  };

  const getCredentials = () => {
    const form = formRef.current;
    if (!form) return { username: "", password: "" };

    return {
      username: (form.elements.namedItem("admin-user") as HTMLInputElement)?.value.trim() ?? "",
      password: (form.elements.namedItem("admin-pass") as HTMLInputElement)?.value ?? "",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { username, password } = getCredentials();
    if (!username || !password) {
      toast.error("Enter username and password");
      return;
    }

    setLoading(true);
    const result = await loginAdmin(username, password);
    if (result.success) {
      toast.success("Welcome back!");
      router.push("/admin");
    } else {
      toast.error(result.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen luxury-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Lock className="w-10 h-10 mx-auto text-gold mb-2" />
          <CardTitle className="font-serif text-2xl">Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground">Suit Society Admin Panel</p>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-4"
            autoComplete="off"
            data-form-type="other"
          >
            <input type="text" name="fake-user" autoComplete="username" tabIndex={-1} aria-hidden="true" className="hidden" />
            <input type="password" name="fake-pass" autoComplete="current-password" tabIndex={-1} aria-hidden="true" className="hidden" />

            <div>
              <Label htmlFor="admin-user">Username</Label>
              <Input
                id="admin-user"
                name="admin-user"
                data-admin-field="username"
                required
                defaultValue=""
                readOnly={fieldsLocked}
                onFocus={unlockField}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
            <div>
              <Label htmlFor="admin-pass">Password</Label>
              <Input
                id="admin-pass"
                name="admin-pass"
                data-admin-field="password"
                required
                type="password"
                defaultValue=""
                readOnly={fieldsLocked}
                onFocus={unlockField}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
            <Button
              type="submit"
              variant="luxury"
              className="w-full"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
