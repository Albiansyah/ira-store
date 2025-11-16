"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Star } from "lucide-react";

interface AppPremiumProductsProps {
  onBack: () => void;
}

export default function AppPremiumProducts({ onBack }: AppPremiumProductsProps) {
  const appProducts = [
    {
      id: 1,
      name: "Premium App 1",
      description: "Aplikasi premium untuk produktivitas",
      price: 50000,
      rating: 4.8,
      downloads: 1000,
    },
    {
      id: 2,
      name: "Premium App 2",
      description: "Aplikasi premium untuk bisnis",
      price: 75000,
      rating: 4.9,
      downloads: 2500,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">App Premium</h2>
          <p className="text-muted-foreground">Aplikasi premium terbaik untuk Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appProducts.map((app) => (
          <Card key={app.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{app.name}</CardTitle>
              <CardDescription>{app.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{app.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>{app.downloads.toLocaleString()} downloads</span>
                </div>
                <div className="text-2xl font-bold mt-4">
                  Rp {app.price.toLocaleString()}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Beli Sekarang</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}