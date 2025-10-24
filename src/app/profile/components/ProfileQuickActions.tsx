'use client';
import { Button } from "@/components/ui/button";
import { Bot, UserSquare, Settings, ShoppingCart, ListOrdered, Edit } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileQuickActions() {

  const actions = [
    { href: "/profile/edit", icon: Edit, label: "Edit Profile" },
    { href: "/profile/orders", icon: ListOrdered, label: "My Orders" },
    { href: "/profile/settings", icon: Settings, label: "Settings" },
    { href: "/profile/shop", icon: ShoppingCart, label: "My Shop" },
    { href: "/profile/clones", icon: UserSquare, label: "My Clones" },
    { href: "/profile/agents", icon: Bot, label: "My Agents" },
  ];

  return (
    <div className="my-6">
         <Card>
            <CardHeader>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>Manage your profile, content, and AI agents.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {actions.map(action => (
                    <Button asChild variant="outline" className="h-24 flex-col gap-2" key={action.href}>
                        <Link href={action.href}>
                            <action.icon className="h-6 w-6"/>
                            <span>{action.label}</span>
                        </Link>
                    </Button>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
