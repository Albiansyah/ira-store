"use client";

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
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">App Premium</h2>
          <p className="text-gray-600">Aplikasi premium terbaik untuk Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appProducts.map((app) => (
          <div
            key={app.id}
            className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{app.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{app.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{app.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Download className="h-4 w-4" />
                  <span>{app.downloads.toLocaleString()} downloads</span>
                </div>
                <div className="text-2xl font-bold mt-4">
                  Rp {app.price.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-0 mt-auto">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Beli Sekarang
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}