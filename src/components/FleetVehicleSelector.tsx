"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import {
  Car,
  ChevronDown,
  Search,
  Check,
  AlertCircle,
  ExternalLink,
  Plus,
  Star,
  Info,
} from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types";
import { detectIndianJurisdiction } from "@/lib/indianVehicles";

interface FleetVehicleSelectorProps {
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string, vehiclePlate: string) => void;
  legacyPlateFallback?: string;
  label?: string;
  required?: boolean;
  error?: string | null;
  className?: string;
  placeholder?: string;
}

export function FleetVehicleSelector({
  selectedVehicleId,
  onSelectVehicle,
  legacyPlateFallback = "",
  label = "Fleet Vehicle",
  required = true,
  error = null,
  className = "",
  placeholder = "Select a fleet vehicle...",
}: FleetVehicleSelectorProps) {
  const { vehicles } = useStore();
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
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Find currently selected vehicle from store
  const selectedVehicle = useMemo(() => {
    if (selectedVehicleId) {
      return vehicles.find((v) => v.id === selectedVehicleId);
    }
    // Fallback: If no selectedVehicleId, but legacyPlateFallback matches a vehicle in the fleet
    if (legacyPlateFallback) {
      const cleanLegacy = legacyPlateFallback.replace(/[\s-]/g, "").toUpperCase();
      return vehicles.find(
        (v) => v.numberPlate.replace(/[\s-]/g, "").toUpperCase() === cleanLegacy,
      );
    }
    return undefined;
  }, [selectedVehicleId, legacyPlateFallback, vehicles]);

  // Filtered vehicles based on search query
  const filteredVehicles = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase().trim();
    return vehicles.filter(
      (v) =>
        v.numberPlate.toLowerCase().includes(q) ||
        (v.model && v.model.toLowerCase().includes(q)),
    );
  }, [vehicles, searchQuery]);

  // Is the current selection an unlinked legacy record?
  const isUnlinkedLegacy = !selectedVehicle && Boolean(legacyPlateFallback);

  const handleSelect = (vehicle: Vehicle) => {
    onSelectVehicle(vehicle.id, vehicle.numberPlate);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700">
          <Car className="w-3.5 h-3.5 inline mr-1.5 text-saffron-600" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {vehicles.length > 0 && (
          <Link
            href="/settings#vehicles"
            className="text-[11px] font-semibold text-saffron-600 hover:text-saffron-700 hover:underline flex items-center gap-1"
          >
            Manage Fleet
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {vehicles.length === 0 ? (
        // Empty fleet state
        <div className="p-3.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 text-amber-900 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold">No Fleet Vehicles Registered</p>
              <p className="text-amber-700 mt-0.5">
                You must add at least one vehicle to your fleet in Settings before assigning vehicles to invoices.
              </p>
            </div>
          </div>
          <Link
            href="/settings#vehicles"
            className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle in Settings</span>
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* Main Selector Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 bg-white ${
              error
                ? "border-red-400 ring-2 ring-red-100"
                : isOpen
                ? "border-saffron-500 ring-2 ring-saffron-100 shadow-xs"
                : "border-cream-300 hover:border-saffron-400 shadow-2xs"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {selectedVehicle ? (() => {
                const selJurisdiction = detectIndianJurisdiction(selectedVehicle.numberPlate);
                return (
                  <>
                    {/* Plate Chip */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100/90 border border-amber-300/80 shrink-0">
                      <span className="text-[9px] font-bold text-amber-900 tracking-wider">
                        {selJurisdiction.displayPill}
                      </span>
                      <span className="font-mono text-xs font-bold text-navy-950 tracking-wider">
                        {selectedVehicle.numberPlate}
                      </span>
                    </div>
                    {selectedVehicle.isDefault && (
                      <span className="text-[10px] font-semibold text-saffron-700 bg-saffron-50 px-1.5 py-0.5 rounded border border-saffron-200 shrink-0">
                        ★ Default
                      </span>
                    )}
                  </>
                );
              })() : isUnlinkedLegacy ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-mono text-xs font-bold">
                    {legacyPlateFallback}
                  </span>
                  <span className="text-[11px] text-rose-600 font-medium truncate">
                    (Legacy unlinked plate — select a fleet vehicle below)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-navy-400 font-medium">
                  {placeholder}
                </span>
              )}
            </div>

            <ChevronDown
              className={`w-4 h-4 text-navy-400 transition-transform shrink-0 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Unlinked Legacy Notice */}
          {isUnlinkedLegacy && !isOpen && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80">
              <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                This invoice currently has the free-text vehicle number{" "}
                <strong className="font-mono">{legacyPlateFallback}</strong>. Choose a fleet vehicle from the dropdown to permanently link it.
              </span>
            </div>
          )}

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-cream-200/90 shadow-elevated z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Search input (shown if > 3 vehicles) */}
              {vehicles.length > 3 && (
                <div className="p-2 border-b border-cream-100 bg-cream-50/50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-navy-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search vehicle number or model..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-cream-200 rounded-lg focus:outline-none focus:border-saffron-400 font-body text-navy-900"
                    />
                  </div>
                </div>
              )}

              {/* Vehicle Options List */}
              <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                {filteredVehicles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-navy-400">
                    No matching fleet vehicles found
                  </div>
                ) : (
                  filteredVehicles.map((vehicle) => {
                    const isSelected = selectedVehicle?.id === vehicle.id;
                    const optJurisdiction = detectIndianJurisdiction(vehicle.numberPlate);
                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => handleSelect(vehicle)}
                        className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? "bg-saffron-50 border border-saffron-200 text-saffron-950 font-semibold"
                            : "hover:bg-cream-50/80 border border-transparent text-navy-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* License Plate Chip */}
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100/90 border border-amber-300/80 shrink-0">
                            <span className="text-[9px] font-bold text-amber-900 tracking-wider">
                              {optJurisdiction.displayPill}
                            </span>
                            <span className="font-mono text-xs font-bold text-navy-950 tracking-wider">
                              {vehicle.numberPlate}
                            </span>
                          </div>

                          <div className="truncate flex items-center gap-1.5">
                            <span className="text-xs text-navy-800">
                              {vehicle.model || "Commercial Vehicle"}
                            </span>
                            {optJurisdiction.code !== "IND" && (
                              <span className="text-[10px] text-navy-400 font-medium">
                                • {optJurisdiction.name}
                              </span>
                            )}
                            {vehicle.isDefault && (
                              <span className="ml-1 text-[10px] font-semibold text-saffron-700 bg-saffron-50 px-1.5 py-0.5 rounded border border-saffron-200">
                                ★ Default
                              </span>
                            )}
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

              {/* Bottom Quick Link */}
              <div className="p-2 border-t border-cream-100 bg-cream-50/40 flex items-center justify-between text-[11px] text-navy-500">
                <span>Total Fleet: {vehicles.length}</span>
                <Link
                  href="/settings#vehicles"
                  onClick={() => setIsOpen(false)}
                  className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add New Vehicle
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] font-medium text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
