"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import {
  Building2,
  ChevronDown,
  Search,
  Check,
  AlertCircle,
  ExternalLink,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Client } from "@/lib/types";
import { formatCurrency } from "@/lib/types";

interface ClientSelectorProps {
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  label?: string;
  required?: boolean;
  error?: string | null;
  className?: string;
  placeholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
  showManageLink?: boolean;
  size?: "default" | "sm";
}

export function ClientSelector({
  selectedClientId,
  onSelectClient,
  label = "Client",
  required = true,
  error = null,
  className = "",
  placeholder = "Select a client...",
  allowClear = false,
  clearLabel = "All Clients",
  showManageLink = true,
  size = "default",
}: ClientSelectorProps) {
  const { clients } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Find currently selected client
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [selectedClientId, clients]);

  // Filtered clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase().trim();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, searchQuery]);

  const handleSelect = (clientId: string) => {
    onSelectClient(clientId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isSmall = size === "sm";

  return (
    <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700">
            <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-saffron-600" />
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {showManageLink && clients.length > 0 && (
            <Link
              href="/settings#clients"
              className="text-[11px] font-semibold text-saffron-600 hover:text-saffron-700 hover:underline flex items-center gap-1"
            >
              Manage Clients
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {clients.length === 0 ? (
        <div className="p-3.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 text-amber-900 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold">No Clients Configured</p>
              <p className="text-amber-700 mt-0.5">
                Add your client accounts and their billing rate profiles in Settings before logging duties or creating invoices.
              </p>
            </div>
          </div>
          <Link
            href="/settings#clients"
            className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client in Settings</span>
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* Main Selector Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full text-left rounded-xl border transition-all flex items-center justify-between gap-3 bg-white ${
              isSmall ? "p-2 text-xs" : "p-2.5 sm:p-3"
            } ${
              error
                ? "border-red-400 ring-2 ring-red-100"
                : isOpen
                ? "border-saffron-500 ring-2 ring-saffron-100 shadow-xs"
                : "border-cream-300 hover:border-saffron-400 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-saffron-50 border border-saffron-200/80 flex items-center justify-center text-saffron-600 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1 truncate">
                {selectedClient ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-navy-950 truncate">
                      {selectedClient.name}
                    </span>
                    <span className="hidden sm:inline text-[11px] text-navy-400 font-medium shrink-0">
                      ({formatCurrency(selectedClient.perDayRate)}/day)
                    </span>
                  </div>
                ) : allowClear && !selectedClientId ? (
                  <span className="text-xs sm:text-sm font-medium text-navy-800">
                    {clearLabel} ({clients.length})
                  </span>
                ) : (
                  <span className="text-xs text-navy-400 font-medium">
                    {placeholder}
                  </span>
                )}
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-navy-400 transition-transform shrink-0 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-cream-200/90 shadow-elevated z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Search input if > 3 clients */}
              {clients.length > 3 && (
                <div className="p-2 border-b border-cream-100 bg-cream-50/50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-navy-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search client by name..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-cream-200 rounded-lg focus:outline-none focus:border-saffron-400 font-body text-navy-900"
                    />
                  </div>
                </div>
              )}

              {/* Client Options List */}
              <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                {allowClear && (
                  <button
                    type="button"
                    onClick={() => handleSelect("")}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between text-xs ${
                      !selectedClientId
                        ? "bg-saffron-50 text-saffron-900 font-semibold"
                        : "hover:bg-cream-50 text-navy-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                      <span>{clearLabel} ({clients.length})</span>
                    </div>
                    {!selectedClientId && (
                      <Check className="w-4 h-4 text-saffron-600 shrink-0" />
                    )}
                  </button>
                )}

                {filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-xs text-navy-400">
                    No matching clients found
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = client.id === selectedClientId;
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelect(client.id)}
                        className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between gap-2 text-xs ${
                          isSelected
                            ? "bg-saffron-50/80 border border-saffron-200 text-saffron-950 font-semibold"
                            : "hover:bg-cream-50 text-navy-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-md bg-white border border-cream-200 flex items-center justify-center text-navy-600 shrink-0">
                            <Building2 className="w-3 h-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate text-navy-900">
                              {client.name}
                            </p>
                            <p className="text-[10px] text-navy-400 font-medium">
                              Base: {client.baseKmsPerDay} km / {client.baseHoursPerDay} hrs • {formatCurrency(client.perDayRate)}/day
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-saffron-600 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
