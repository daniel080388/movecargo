"use client";
import React, { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import Header from "../Header";

export default function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <DashboardSidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {title && <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
