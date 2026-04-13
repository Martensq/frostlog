import { useState, useRef, useEffect, Children, isValidElement } from "react";

function extractOptions(children) {
  const options = [];
  Children.forEach(children, child => {
    if (isValidElement(child) && child.type === "option") {
      options.push({
        value: child.props.value ?? "",
        label: child.props.children,
        disabled: !!child.props.disabled,
      });
    }
  });
  return options;
}

export default function SelectFrost({ value, onChange, style = {}, children, disabled }) {
  const [open, setOpen]       = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0, goUp: false });
  const btnRef  = useRef(null);
  const listRef = useRef(null);

  const options  = extractOptions(children);
  const selected = options.find(o => String(o.value) === String(value));

  // Separate layout props (go to outer div) from visual props (go to button)
  const { width, flex, flexShrink, flexGrow, minWidth, maxWidth, ...btnExtraStyle } = style;
  const containerStyle = { position: "relative" };
  if (width     !== undefined) containerStyle.width     = width;
  if (flex      !== undefined) { containerStyle.flex = flex; containerStyle.minWidth = 0; }
  if (flexShrink !== undefined) containerStyle.flexShrink = flexShrink;
  if (flexGrow  !== undefined) { containerStyle.flexGrow = flexGrow; containerStyle.minWidth = 0; }
  if (minWidth  !== undefined) containerStyle.minWidth  = minWidth;
  if (maxWidth  !== undefined) containerStyle.maxWidth  = maxWidth;

  function handleOpen() {
    if (disabled) return;
    if (open) { setOpen(false); return; }

    const rect      = btnRef.current.getBoundingClientRect();
    const itemH     = 34;
    const listH     = Math.min(options.length * itemH + 8, 240);
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;
    const goUp       = spaceBelow < listH && spaceAbove >= listH;

    setDropPos({
      left:  rect.left,
      top:   goUp ? rect.top - listH : rect.bottom + 2,
      width: rect.width,
      goUp,
    });
    setOpen(true);
  }

  function handleSelect(optValue) {
    onChange({ target: { value: optValue } });
    setOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (!btnRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const btnStyle = {
    width: "100%",
    background: "rgba(5, 10, 20, 0.7)",
    border: `1px solid ${open ? "var(--c-ice-dim)" : "var(--c-border)"}`,
    borderRadius: 8,
    padding: "8px 32px 8px 12px",
    color: selected ? "var(--c-text)" : "var(--c-muted)",
    fontFamily: "'Crimson Pro', serif",
    fontSize: "inherit",
    textAlign: "left",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    position: "relative",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...btnExtraStyle,
  };

  const chevron = (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="#6b8fa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: "absolute", right: 10, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: "transform 0.15s", pointerEvents: "none", flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  return (
    <div ref={btnRef} style={containerStyle}>
      <button type="button" style={btnStyle} onClick={handleOpen}>
        {selected?.label ?? ""}
        {chevron}
      </button>

      {open && (
        <div
          ref={listRef}
          className="scrollbar-hide"
          style={{
            position: "fixed",
            top:    dropPos.top,
            left:   dropPos.left,
            width:  dropPos.width,
            zIndex: 9999,
            background: "#0d1a2d",
            border: "1px solid var(--c-ice-dim)",
            borderRadius: 8,
            overflow: "hidden auto",
            maxHeight: 240,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((opt, i) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={i}
                onMouseDown={e => { e.preventDefault(); if (!opt.disabled) handleSelect(opt.value); }}
                style={{
                  padding: "7px 12px",
                  color: opt.disabled ? "var(--c-dim)" : isSelected ? "#a8d8ea" : "#cbd5e1",
                  background: isSelected ? "#1a3d5c" : "transparent",
                  cursor: opt.disabled ? "default" : "pointer",
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: "inherit",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                onMouseEnter={e => { if (!opt.disabled && !isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? "#1a3d5c" : "transparent"; }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
