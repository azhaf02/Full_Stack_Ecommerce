import React from "react";

type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "24px",
        fontSize: "13px",
      }}
    >
      <button
        type="button"
        onClick={items[0]?.onClick}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          color: "#6e776e",
          cursor: items[0]?.onClick ? "pointer" : "default",
          fontWeight: 500,
        }}
      >
        {items[0]?.label || "Home"}
      </button>

      {items.slice(1).map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <span style={{ color: "#aaa" }}>›</span>

          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                color: "#6e776e",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {item.label}
            </button>
          ) : (
            <span
              style={{
                color: "#2f3e30",
                fontWeight: 600,
              }}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}