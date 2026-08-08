"use client";

export default function CityInfoPage() {
  const address = "601 S Harbour Island Blvd, Tampa, FL 33602";
  const mapUrl =
    "https://www.google.com/maps?q=" +
    encodeURIComponent(address) +
    "&output=embed";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        paddingBottom: "110px",
        fontFamily: "Arial, Helvetica, sans-serif"
      }}
    >
      <div
        style={{
          background: "#111",
          color: "#fff",
          padding: "22px 20px 18px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.16em",
            opacity: 0.7
          }}
        >
          CITY TOUR GUIDE
        </div>

        <h1
          style={{
            margin: "7px 0 0",
            fontSize: "1.55rem",
            fontWeight: 900
          }}
        >
          CityINFO
        </h1>
      </div>

      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "20px 16px"
        }}
      >
        <section
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "22px",
            marginBottom: "16px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "1.25rem",
              color: "#111"
            }}
          >
            About City Tour Guide
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: "#444"
            }}
          >
            If you have questions about the app or want to share feedback,
            reach out anytime. We love hearing from both locals and visitors.
            City Tour Guide APP is operated by City Tour Guide, Inc.
          </p>
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "16px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
          }}
        >
          <div style={{ padding: "20px" }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                color: "#666",
                textTransform: "uppercase",
                marginBottom: "7px"
              }}
            >
              Main Pick Up Address
            </div>

            <div
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                lineHeight: 1.45,
                color: "#111"
              }}
            >
              601 S Harbour Island Blvd
              <br />
              Tampa, FL 33602
            </div>
          </div>

          <iframe
            title="City Tour Guide Main Pick Up Address"
            src={mapUrl}
            width="100%"
            height="260"
            style={{
              border: 0,
              display: "block"
            }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "12px"
          }}
        >
          <a
            href="tel:+18338138687"
            style={{
              display: "block",
              background: "#0066ff",
              color: "#fff",
              borderRadius: "14px",
              padding: "16px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: 900,
              fontSize: "1rem"
            }}
          >
            Call (833) 813-8687
          </a>

          <a
            href="mailto:info@citytourguideinc.com"
            style={{
              display: "block",
              background: "#fff",
              color: "#0066ff",
              border: "2px solid #0066ff",
              borderRadius: "14px",
              padding: "14px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: 900,
              fontSize: "0.95rem"
            }}
          >
            info@citytourguideinc.com
          </a>
        </section>
      </div>
    </main>
  );
}
