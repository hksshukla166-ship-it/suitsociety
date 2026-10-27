"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/actions/admin";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createCategory(name);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Category created");
      if (result.data) setCategories([...categories, result.data]);
      setName("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2 max-w-md">
        <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Button type="submit" variant="luxury" disabled={loading}><Plus className="w-4 h-4" /></Button>
      </form>

      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr>
            <th className="text-left p-3">Name</th><th className="text-left p-3">Slug</th><th className="text-left p-3">Status</th>
          </tr></thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t">
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 text-muted-foreground">{cat.slug}</td>
                <td className="p-3">{cat.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No categories yet. Add categories from admin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
