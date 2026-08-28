"use client";

import { useState, useMemo, useEffect } from "react";
import { Room } from "@/lib/types";
import { RoomCard } from "@/components/room-card";
import { Waves, Calendar, SlidersHorizontal, X } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatMoney } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface RoomsCatalogProps {
  initialRooms: Room[];
}

const fmtVNDRooms = (n: number) => formatMoney(n);

const ALL_TYPES = ["Standard", "Deluxe", "Family Suite", "Connecting Room"];
const ALL_FLOORS = [1, 2, 3];
const ALL_VIEWS = ["Sea View", "City View", "Garden View"];

export function RoomsCatalog({ initialRooms }: RoomsCatalogProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedFloors, setSelectedFloors] = useState<number[]>([]);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState<number>(7500000);
  const [minGuests, setMinGuests] = useState<number>(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const clearAllFilters = () => {
    setKeyword("");
    setSelectedTypes([]);
    setSelectedFloors([]);
    setSelectedViews([]);
    setPriceMax(7500000);
    setMinGuests(0);
    setCheckIn("");
    setCheckOut("");
    setCurrentPage(1);
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleFloorChange = (floor: number) => {
    setSelectedFloors((prev) =>
      prev.includes(floor) ? prev.filter((f) => f !== floor) : [...prev, floor]
    );
  };

  const handleViewChange = (view: string) => {
    setSelectedViews((prev) =>
      prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]
    );
  };

  const handleCapacityChange = (capacity: number) => {
    setMinGuests((prev) => (prev === capacity ? 0 : capacity));
  };

  const filteredRooms = useMemo(() => {
    return initialRooms.filter((room) => {
      // Keyword match
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        const matchesName = room.name.toLowerCase().includes(kw);
        const matchesType = room.type.toLowerCase().includes(kw);
        const matchesView = room.view.toLowerCase().includes(kw);
        if (!matchesName && !matchesType && !matchesView) return false;
      }

      // Type match
      if (selectedTypes.length > 0 && !selectedTypes.includes(room.type)) {
        return false;
      }

      // Floor match
      if (selectedFloors.length > 0 && !selectedFloors.includes(room.floor)) {
        return false;
      }

      // View match
      if (selectedViews.length > 0 && !selectedViews.includes(room.view)) {
        return false;
      }

      // Price match
      if (room.price > priceMax) {
        return false;
      }

      // Capacity match
      if (minGuests > 0 && room.maxGuests < minGuests) {
        return false;
      }

      return true;
    });
  }, [initialRooms, keyword, selectedTypes, selectedFloors, selectedViews, priceMax, minGuests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedTypes, selectedFloors, selectedViews, priceMax, minGuests]);

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeFilterCount =
    selectedTypes.length +
    selectedFloors.length +
    selectedViews.length +
    (priceMax < 7500000 ? 1 : 0) +
    (minGuests > 0 ? 1 : 0);

  const renderFilterPanel = () => {
    return (
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col gap-5 shadow-xs font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <span className="font-bold text-slate-900 text-sm">Filters</span>
          <button
            type="button"
            className="text-xs text-[#3d64b0] hover:text-[#0c266d] font-bold hover:underline cursor-pointer"
            onClick={clearAllFilters}
          >
            Clear all
          </button>
        </div>

        {/* Room Type */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Room Type
          </span>
          <div className="flex flex-col gap-2">
            {ALL_TYPES.map((t) => (
              <label
                key={t}
                className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-slate-900 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  value={t}
                  checked={selectedTypes.includes(t)}
                  onChange={() => handleTypeChange(t)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#3d64b0] cursor-pointer"
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Floor */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Floor
          </span>
          <div className="grid grid-cols-3 gap-2">
            {ALL_FLOORS.map((f) => (
              <button
                key={f}
                type="button"
                className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer text-center ${
                  selectedFloors.includes(f)
                    ? "bg-[#3d64b0] text-white border-[#3d64b0]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-[#3d64b0]"
                }`}
                onClick={() => handleFloorChange(f)}
              >
                Floor {f}
              </button>
            ))}
          </div>
        </div>

        {/* View */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            View
          </span>
          <div className="flex flex-col gap-2">
            {ALL_VIEWS.map((v) => (
              <label
                key={v}
                className="flex items-center gap-2.5 text-sm text-slate-700 hover:text-slate-900 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  value={v}
                  checked={selectedViews.includes(v)}
                  onChange={() => handleViewChange(v)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#3d64b0] cursor-pointer"
                />
                <span>{v}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Price per Night
          </span>
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 rounded-lg p-2 text-center flex-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Min</p>
              <p className="text-xs font-bold text-slate-900 font-['Merriweather',serif]">
                {fmtVNDRooms(1500000)}
              </p>
            </div>
            <span className="text-slate-400">—</span>
            <div className="bg-slate-100 rounded-lg p-2 text-center flex-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Max</p>
              <p className="text-xs font-bold text-slate-900 font-['Merriweather',serif]">
                {fmtVNDRooms(priceMax)}
              </p>
            </div>
          </div>
          <input
            type="range"
            min="1500000"
            max="7500000"
            step="250000"
            value={priceMax}
            className="w-full accent-[#3d64b0] cursor-pointer mt-1"
            onChange={(e) => setPriceMax(Number(e.target.value))}
          />
        </div>

        {/* Capacity */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Min. Guests Capacity
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <button
                key={g}
                type="button"
                className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                  minGuests === g
                    ? "bg-[#3d64b0] text-white border-[#3d64b0]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-[#3d64b0]"
                }`}
                onClick={() => handleCapacityChange(g)}
              >
                {g}+
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="py-8 md:py-12 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Catalog Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1
            className="text-3xl font-semibold italic text-slate-900 flex items-baseline gap-2"
            style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
          >
            All Available Rooms
            <span className="font-normal text-slate-400 text-lg font-sans not-italic">
              ({filteredRooms.length})
            </span>
          </h1>

          <div className="flex items-center gap-3 flex-wrap flex-1 justify-end font-sans">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs min-w-[220px]">
              <input
                type="text"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-xs"
                placeholder='Search "sea view", "family suite"…'
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* Dates Trigger */}
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-3.5 py-2 rounded-lg transition-colors border border-slate-200 cursor-pointer shadow-xs"
              onClick={() => setDateModalOpen(true)}
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>
                {checkIn && checkOut
                  ? `${checkIn} → ${checkOut}`
                  : "Dates Search"}
              </span>
            </button>

            {/* Mobile Filter Button */}
            <button
              type="button"
              className="inline-flex md:hidden items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-3.5 py-2 rounded-lg transition-colors border border-slate-200 cursor-pointer shadow-xs"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#3d64b0] text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Catalog Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="w-full md:w-64 shrink-0 hidden md:block">
            {renderFilterPanel()}
          </aside>

          {/* Room Grid Column */}
          <div className="flex-1">
            {filteredRooms.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
                
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(p => p - 1);
                          }} 
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink 
                            href="#" 
                            isActive={currentPage === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i + 1);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(p => p + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
                <Waves className="w-12 h-12 text-[#3d64b0] opacity-30 mx-auto mb-3" />
                <h3
                  className="text-xl font-semibold italic text-slate-900 mb-1"
                  style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
                >
                  No rooms match your filters
                </h3>
                <p className="text-sm text-slate-500 mb-4 font-sans">
                  Try adjusting your search filters or typing another keyword.
                </p>
                <button
                  type="button"
                  className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-4 py-2 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center font-sans shadow-xs cursor-pointer"
                  onClick={clearAllFilters}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetContent side="bottom" className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 mx-auto" showCloseButton={false}>
          <SheetHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-200 mb-4 p-0">
            <SheetTitle
              className="text-xl font-semibold italic text-slate-900 m-0"
              style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
            >
              Filters
            </SheetTitle>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>
          {renderFilterPanel()}
          <button
            type="button"
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-xs mt-4 cursor-pointer"
            onClick={() => setMobileFilterOpen(false)}
          >
            Show Rooms ({filteredRooms.length})
          </button>
        </SheetContent>
      </Sheet>

      {/* Dates Search Modal */}
      <Dialog open={dateModalOpen} onOpenChange={setDateModalOpen}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6 bg-white shadow-xl" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-200 mb-4 p-0">
            <DialogTitle
              className="text-xl font-semibold italic text-slate-900 m-0"
              style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}
            >
              Search by Dates
            </DialogTitle>
            <button
              type="button"
              onClick={() => setDateModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>
          <div className="space-y-4 font-sans">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Check-in Date
              </label>
              <input
                type="date"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Check-out Date
              </label>
              <input
                type="date"
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 bg-[#0ea5e9] hover:bg-[#0284c7] text-white py-2.5 rounded-lg font-bold text-sm transition-colors cursor-pointer"
                onClick={() => setDateModalOpen(false)}
              >
                Apply Dates
              </button>
              {(checkIn || checkOut) && (
                <button
                  type="button"
                  className="px-3 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-semibold cursor-pointer"
                  onClick={() => {
                    setCheckIn("");
                    setCheckOut("");
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
