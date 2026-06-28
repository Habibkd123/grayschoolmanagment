import React from "react";

interface HighlightItem {
  value: string;
  label: string;
  icon: string;
}

interface LandingData {
  highlights?: HighlightItem[];
}

export function Highlights({ data }: { data?: LandingData | null }) {
  const highlights = (data?.highlights ?? []).filter(
    (h) => h.value?.trim() && h.label?.trim()
  );

  // Agar koi bhi highlight nahi hai, section render mat karo
  if (highlights.length === 0) return null;

  return (
    <section className="py-10 bg-[var(--section-alt)] border-y border-[#E0E0E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#D9D9D9]">
          {highlights.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center text-center px-6 py-6 group hover:bg-white transition-colors duration-300">
              {item.icon && <div className="text-3xl mb-3">{item.icon}</div>}
              <h3 className="text-3xl lg:text-4xl font-black text-primary tracking-tight mb-1">{item.value}</h3>
              <p className="font-bold text-[#5C5D5D] uppercase tracking-wider text-[11px]">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
