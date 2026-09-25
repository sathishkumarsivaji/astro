import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, Check, Globe, Navigation, X, Loader2 } from "lucide-react";
import { searchPlaces, POPULAR_PLACES_DB, resolveTypedPlace } from "../../services/geoService";

export default function PlaceAutocomplete({
  value = "",
  onChange,
  onSelect,
  lang = "en",
  placeholder = "Search City, Town, District, State...",
  className = ""
}) {
  const isTamil = lang === "ta";
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const places = await searchPlaces(query, lang);
        setResults(places);
        setHighlightedIndex(places.length > 0 ? 0 : -1);
      } catch (err) {
        console.error("Place search error:", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen, lang]);

  const handleSelect = (place) => {
    setSelectedPlace(place);
    const display = place.displayString || place.name;
    setQuery(display);
    setIsOpen(false);
    if (onChange) onChange(display);
    if (onSelect) onSelect(place);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedPlace(null);
    if (onChange) onChange("");
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        if (results.length === 0) setResults(POPULAR_PLACES_DB.slice(0, 8));
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (query && (!selectedPlace || (selectedPlace.displayString !== query && selectedPlace.name !== query))) {
        const match = resolveTypedPlace(query, isTamil);
        if (match) {
          handleSelect(match);
        }
      }
    }, 180);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedPlace(null);
    setIsOpen(true);
    if (onChange) onChange(val);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600">
          <MapPin className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onFocus={() => {
            setIsOpen(true);
            if (results.length === 0) {
              setResults(POPULAR_PLACES_DB.slice(0, 8));
              setHighlightedIndex(0);
            }
          }}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isTamil ? "ஊர் / நகரம் / மாவட்டம் / மாநிலம் தேடவும்..." : placeholder}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#FFFDF9] border border-amber-300 text-stone-900 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-stone-400 shadow-sm"
        />

        {loading ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown with District, State & Country */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-[#FFFDF9] border border-amber-300 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-amber-100">
          <div className="p-2 bg-amber-50 text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center justify-between border-b border-amber-200">
            <span>{isTamil ? "கிடைக்கும் இடங்கள் (பட்டியலிலிருந்து தேர்வு செய்யவும்)" : "Matching Locations (Click to Select)"}</span>
            <span className="text-stone-500 font-normal lowercase">{results.length} found</span>
          </div>

          {results.length > 0 ? (
            results.map((p, idx) => (
              <button
                key={`${p.name}-${p.lat}-${idx}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(p);
                }}
                onClick={() => handleSelect(p)}
                className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between group ${
                  highlightedIndex === idx ? "bg-amber-100/90 text-amber-950" : "hover:bg-amber-100/60"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-stone-900 text-xs group-hover:text-amber-800 transition-colors">
                      {p.name}
                    </span>
                    {p.district && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 text-[10px] font-semibold border border-purple-300">
                        {isTamil ? `மாவட்டம்: ${p.districtTa || p.district}` : `Dist: ${p.district}`}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-600 flex items-center gap-1">
                    <span>{p.state}</span>
                    <span className="text-stone-400">•</span>
                    <span>{p.country}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-[10px] font-mono text-stone-600 block font-semibold">
                    {p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°
                  </span>
                  <span className="text-[9px] text-emerald-800 font-mono font-bold">
                    UTC{p.tz >= 0 ? `+${p.tz}` : p.tz}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-stone-600">
              {isTamil ? "இடங்கள் எதுவும் கிடைக்கவில்லை. பெயரை சரிபார்க்கவும்." : "No matching places found. Try entering district or state name."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

