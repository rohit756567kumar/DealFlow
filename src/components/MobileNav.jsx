// src/components/MobileNav.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Bottom tab bar for mobile — replaces the sidebar on small screens.
// Shows 5 primary tabs + a "More" button for the rest.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

const Icon = ({ name, size = 22, color = "currentColor" }) => {
  const icons = {
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth="2"/></>,
    chart:     <><rect x="3" y="12" width="4" height="9" rx="1" fill={color}/><rect x="10" y="7" width="4" height="14" rx="1" fill={color}/><rect x="17" y="3" width="4" height="18" rx="1" fill={color}/></>,
    bell:      <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2"/></>,
    card:      <><rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2"/><line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2"/></>,
    grid:      <><rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2"/></>,
    x:         <path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>,
    ai:        <><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/><path d="M9 9h.01M15 9h.01M9 15s1 2 3 2 3-2 3-2" stroke={color} strokeWidth="2" strokeLinecap="round"/></>,
    file:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2"/><polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="2"/></>,
    dollar:    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={color} strokeWidth="2" strokeLinecap="round"/>,
    shield:    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {icons[name] ?? null}
    </svg>
  );
};

// Primary tabs shown in bottom bar
const PRIMARY_TABS = ["pipeline", "analytics", "nudges", "ratecard", "more"];

// All nav items (same as App.jsx NAV — passed as prop)
export function MobileNav({ nav, onNav, nudgeCount, navItems }) {
  const [showMore, setShowMore] = useState(false);

  const primaryItems = navItems.filter(n => PRIMARY_TABS.slice(0, 4).includes(n.key));
  const moreItems    = navItems.filter(n => !PRIMARY_TABS.slice(0, 4).includes(n.key));

  const handleNav = (key) => {
    setShowMore(false);
    onNav(key);
  };

  return (
    <>
      {/* More drawer — slides up */}
      {showMore && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(15,10,40,0.5)",
        }} onClick={() => setShowMore(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 70, left: 0, right: 0,
              background: "#fff", borderRadius: "20px 20px 0 0",
              padding: "20px 16px 8px",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1035" }}>More</div>
              <button onClick={() => setShowMore(false)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={20} color="#9B96B8" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {moreItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "14px 16px", borderRadius: 12,
                    border: `2px solid ${nav === item.key ? "#7B6EE8" : "#E8E6F0"}`,
                    background: nav === item.key ? "#F3F0FF" : "#FAFAFA",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <Icon name={item.icon} size={20} color={nav === item.key ? "#5B4BD8" : "#9B96B8"} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: nav === item.key ? "#5B4BD8" : "#1a1035" }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 80,
        background: "#fff",
        borderTop: "1px solid #E8E6F0",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 0px)", // iPhone notch
        boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
      }}>
        {primaryItems.map(item => {
          const isActive = nav === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "10px 4px 8px",
                border: "none", background: "none", cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{ position: "relative" }}>
                <Icon name={item.icon} size={22} color={isActive ? "#5B4BD8" : "#9B96B8"} />
                {item.key === "nudges" && nudgeCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -6,
                    background: "#EF4444", color: "#fff",
                    fontSize: 9, fontWeight: 700, borderRadius: 10,
                    padding: "1px 4px", minWidth: 14, textAlign: "center",
                  }}>{nudgeCount}</span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? "#5B4BD8" : "#9B96B8", marginTop: 4 }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 24, height: 3, background: "#5B4BD8", borderRadius: "0 0 3px 3px" }} />
              )}
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(s => !s)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "10px 4px 8px",
            border: "none", background: "none", cursor: "pointer",
          }}
        >
          <Icon name="grid" size={22} color={showMore ? "#5B4BD8" : "#9B96B8"} />
          <span style={{ fontSize: 10, fontWeight: showMore ? 700 : 500, color: showMore ? "#5B4BD8" : "#9B96B8", marginTop: 4 }}>More</span>
        </button>
      </div>
    </>
  );
}
