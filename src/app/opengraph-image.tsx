import { ImageResponse } from "next/og";

export const alt = "Trippr - Offline-First Invoice & Duty Management";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAF8F5",
          padding: "40px 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "32px",
            border: "3px solid #F4E8D7",
            boxShadow: "0 25px 50px -12px rgba(249, 115, 22, 0.15)",
            padding: "50px",
          }}
        >
          {/* Brand Logo Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 36px",
              borderTop: "5px solid #F97316",
              borderBottom: "5px solid #F97316",
              marginBottom: "28px",
            }}
          >
            <span
              style={{
                fontSize: 84,
                fontWeight: 900,
                color: "#F97316",
                letterSpacing: "-2px",
              }}
            >
              Trippr
            </span>
          </div>

          {/* Heading */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "#0F172A",
              textAlign: "center",
              lineHeight: 1.2,
              marginBottom: "16px",
            }}
          >
            Invoice & Duty Management
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: "#EA580C",
              marginBottom: "36px",
            }}
          >
            Made Simple for Transport Businesses
          </div>

          {/* Feature Badges */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "#FFF7ED",
                color: "#C2410C",
                padding: "10px 24px",
                borderRadius: "9999px",
                fontSize: 22,
                fontWeight: 600,
                border: "2px solid #FED7AA",
              }}
            >
              ⚡ 100% Offline-First
            </div>
            <div
              style={{
                display: "flex",
                backgroundColor: "#FFF7ED",
                color: "#C2410C",
                padding: "10px 24px",
                borderRadius: "9999px",
                fontSize: 22,
                fontWeight: 600,
                border: "2px solid #FED7AA",
              }}
            >
              🔒 Privacy by Default
            </div>
            <div
              style={{
                display: "flex",
                backgroundColor: "#FFF7ED",
                color: "#C2410C",
                padding: "10px 24px",
                borderRadius: "9999px",
                fontSize: 22,
                fontWeight: 600,
                border: "2px solid #FED7AA",
              }}
            >
              📄 Instant PDF Invoices
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
