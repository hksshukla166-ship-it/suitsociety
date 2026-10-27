import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: PageProps) {
  const { order } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-20 text-center max-w-lg">
      <CheckCircle className="w-20 h-20 mx-auto text-emerald-500 mb-6" strokeWidth={1.5} />
      <h1 className="font-serif text-3xl tracking-wider mb-4 text-emerald-600">Your order is placed</h1>
      <p className="text-muted-foreground text-lg mb-2">
        Thank you for trusting and ordering from Suit Society.
      </p>
      {order && <p className="font-mono text-lg mb-8 mt-4">Order #{order}</p>}
      <div className="flex gap-4 justify-center">
        <Link href="/account/orders"><Button variant="outline">View Orders</Button></Link>
        <Link href="/products"><Button variant="luxury">Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
