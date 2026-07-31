import Link from "next/link";

export const metadata = {
  title: "Drive with City Tour Guide — Tampa Driver Recruitment",
  description:
    "Apply to become an approved City Tour Guide driver in Tampa. We are seeking local professionals with a passion for hospitality, local knowledge, and helping guests experience the best of Tampa.",
};

export default function DriversPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B1D3A",
        fontFamily: "DM Sans, system-ui, sans-serif",
        color: "#fff",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        .driver-card{
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:16px;
          padding:24px;
          margin-bottom:14px;
        }
        .step-card{
          background:rgba(0,255,136,0.06);
          border:1px solid rgba(0,255,136,0.18);
          border-left:3px solid #4ADE80;
          border-radius:12px;
          padding:16px 18px;
          margin-bottom:10px;
          display:flex;
          align-items:flex-start;
          gap:14px;
        }
        .step-num{
          width:32px;height:32px;
          border-radius:50%;
          background:#059669;
          color:#003d1a;
          font-weight:900;
          font-size:0.9rem;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        }
        .section-label{
          display:inline-block;
          background:rgba(0,255,136,0.12);
          color:#4ADE80;
          font-size:0.6rem;
          font-weight:800;
          letter-spacing:0.18em;
          text-transform:uppercase;
          padding:4px 12px;
          border-radius:999px;
          margin-bottom:10px;
        }
        .cta-btn{
          display:inline-block;
          padding:15px 28px;
          background:#059669;
          color:#003d1a;
          font-weight:900;
          font-size:0.95rem;
          border-radius:12px;
          text-decoration:none;
          box-shadow:0 6px 24px rgba(0,255,136,0.35);
          transition:transform 0.15s;
        }
        .cta-btn:hover{transform:translateY(-1px);}
      `}</style>

      {/* BACK LINK */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <a
          href="https://citytourguide.app"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.82rem",
            fontWeight: 600,
          }}
        >
          ← citytourguide.app
        </a>
      </div>

      {/* HERO */}
      <section
        style={{
          padding: "52px 20px 40px",
          textAlign: "center",
          background: "linear-gradient(180deg,#0d2248 0%,#0B1D3A 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="section-label">Driver Recruitment</div>
        <h1
          style={{
            fontSize: "clamp(1.6rem,6vw,2.6rem)",
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            fontFamily: "Inter,sans-serif",
            color: "#fff",
            marginBottom: 16,
            maxWidth: 560,
            margin: "0 auto 16px",
          }}
        >
          Apply to Become an Approved City Tour Guide Driver
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.65,
            maxWidth: 480,
            margin: "0 auto 32px",
          }}
        >
          Help guests discover Tampa through curated destination experiences,
          featured local routes, and approved city experience hosting.
        </p>
        <a
          className="cta-btn"
          href="mailto:info@cityrealtour.com?subject=Driver Application"
        >
          Apply for Driver and Vehicle Review
        </a>
      </section>

      {/* CONTENT SECTIONS */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>

        {/* SECTION 1 */}
        <div className="driver-card">
          <div className="section-label">Who We Are Looking For</div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.3,
            }}
          >
            Who We Are Looking For
          </h2>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.75 }}>
            City Tour Guide is seeking local professionals who take pride in
            hospitality, local knowledge, and helping guests experience the best
            of Tampa. We are looking for approved tourism drivers who genuinely
            enjoy sharing their city — people who know the neighborhoods,
            appreciate local history, and create a welcoming experience for
            visitors and residents alike. If you are a responsible local driver
            with a clean, comfortable, tourism-appropriate vehicle and a passion
            for Tampa, we invite you to apply for consideration.
          </p>
        </div>

        {/* SECTION 2 */}
        <div className="driver-card">
          <div className="section-label">Vehicle Standards</div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.3,
            }}
          >
            Approved Vehicle Standards
          </h2>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.75, marginBottom: 14 }}>
            Participation in City Tour Guide experiences requires an approved
            vehicle that meets our tourism and operational standards. Vehicles
            that may be considered for approval include:
          </p>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.8,
              paddingLeft: 20,
              marginBottom: 14,
            }}
          >
            <li>Passenger vans and specialty vehicles suitable for group experiences</li>
            <li>Low speed vehicles where legally permitted</li>
            <li>Golf carts and electric vehicles appropriate for designated service areas</li>
            <li>Other vehicles suitable for curated tourism and destination experiences</li>
          </ul>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.75, marginBottom: 14 }}>
            All vehicles must meet City Tour Guide requirements for:
          </p>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.8,
              paddingLeft: 20,
              marginBottom: 14,
            }}
          >
            <li>Insurance coverage and verification</li>
            <li>Safety inspection and road worthiness</li>
            <li>Cleanliness and presentation standards</li>
            <li>Branding and appearance guidelines</li>
            <li>Operational compliance for designated service areas</li>
          </ul>
          <p
            style={{
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.4)",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            Note: Vehicles are reviewed and approved by City Tour Guide before
            any participation begins. Not all vehicles will qualify.
          </p>
        </div>

        {/* SECTION 3 */}
        <div className="driver-card">
          <div className="section-label">Driver Requirements</div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.3,
            }}
          >
            Driver Requirements
          </h2>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.75, marginBottom: 14 }}>
            Approved City Tour Guide drivers are expected to demonstrate:
          </p>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.8,
              paddingLeft: 20,
            }}
          >
            <li>A valid driver license in good standing</li>
            <li>A clean driving record</li>
            <li>Reliable professional conduct and appearance</li>
            <li>
              Familiarity with Tampa neighborhoods, attractions, hotels,
              restaurants, and entertainment areas
            </li>
            <li>
              Comfort working with visitors, tourists, hotel guests, and event
              attendees
            </li>
            <li>
              Commitment to safe, courteous, and hospitality-focused service
            </li>
          </ul>
          <p
            style={{
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.4)",
              fontStyle: "italic",
              lineHeight: 1.6,
              marginTop: 14,
            }}
          >
            Drivers must complete City Tour Guide review and approval process
            before participating in any experience.
          </p>
        </div>

        {/* SECTION 4 */}
        <div className="driver-card">
          <div className="section-label">Hospitality</div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.3,
            }}
          >
            Tourism and Hospitality Expectations
          </h2>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.75, marginBottom: 14 }}>
            City Tour Guide is a destination and local experience platform. Our
            drivers are local ambassadors — not just transportation providers.
            As an approved City Experience Host you may be expected to:
          </p>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.8,
              paddingLeft: 20,
            }}
          >
            <li>
              Navigate designated routes through Tampa featured neighborhoods
              and attractions
            </li>
            <li>
              Provide a welcoming, informative, and professional experience for
              guests
            </li>
            <li>
              Represent City Tour Guide brand and service standards at all times
            </li>
            <li>
              Support guests in discovering Tampa restaurants, hotels, cultural
              destinations, shopping districts, and entertainment areas
            </li>
            <li>
              Maintain awareness of local events, featured destinations, and
              seasonal highlights
            </li>
          </ul>
          <p
            style={{
              fontSize: "0.82rem",
              color: "rgba(0,255,136,0.75)",
              fontWeight: 700,
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            This is a hospitality role as much as a driving role.
          </p>
        </div>

        {/* SECTION 5 */}
        <div className="driver-card">
          <div className="section-label">Compliance</div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 12,
              lineHeight: 1.3,
            }}
          >
            Insurance and Compliance Review
          </h2>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.75, marginBottom: 14 }}>
            All drivers and vehicles are subject to a compliance review before
            participation is approved. This includes:
          </p>
          <ul
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.8,
              paddingLeft: 20,
            }}
          >
            <li>Driver license verification</li>
            <li>Driving record review</li>
            <li>
              Insurance verification appropriate for the vehicle type and
              service area
            </li>
            <li>Vehicle inspection and approval</li>
            <li>
              Review of applicable local, state, and federal regulations for
              the vehicle type and operating area
            </li>
            <li>
              Compliance with City Tour Guide operating standards and service
              agreements
            </li>
          </ul>
        </div>

        {/* SECTION 6 — STEPS */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-label">Application Process</div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 18,
              lineHeight: 1.3,
            }}
          >
            How the Application Process Works
          </h2>
          {[
            "Submit your application",
            "Initial review",
            "Vehicle and insurance review",
            "Driver qualification review",
            "Onboarding for approved drivers",
            "Active participation",
          ].map((step, i) => (
            <div className="step-card" key={i}>
              <div className="step-num">{i + 1}</div>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#fff",
                  paddingTop: 5,
                  lineHeight: 1.4,
                }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div
          style={{
            background: "rgba(0,255,136,0.06)",
            border: "1px solid rgba(0,255,136,0.2)",
            borderRadius: 16,
            padding: "32px 24px",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 900,
              color: "#fff",
              marginBottom: 14,
              lineHeight: 1.3,
              fontFamily: "Inter,sans-serif",
            }}
          >
            Apply for Driver and Vehicle Review
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              marginBottom: 24,
              maxWidth: 440,
              margin: "0 auto 24px",
            }}
          >
            We are currently building our approved driver network in the Tampa
            Bay area. If you meet the standards above and are interested in
            participating as a local experience driver and tourism partner, we
            invite you to apply for consideration.
          </p>
          <a
            className="cta-btn"
            href="mailto:info@cityrealtour.com?subject=Driver+Application"
          >
            Apply for Driver and Vehicle Review
          </a>
        </div>

        {/* DISCLAIMER */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 32,
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.75,
            }}
          >
            City Tour Guide is not accepting general rideshare drivers. City
            Tour Guide works exclusively with approved drivers and approved
            vehicles for curated tourism, destination, and local experience
            services. All participation is subject to review, approval,
            insurance verification, driver qualification, and compliance with
            applicable laws and operating requirements. Submission of an
            application does not guarantee acceptance or participation. City
            Tour Guide reserves the right to approve or decline any application
            at its sole discretion.
          </p>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", paddingBottom: 48 }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 12,
            }}
          >
            City Tour Guide Inc. &middot; Tampa FL &middot; Licensed and Insured
          </div>
          <div
            style={{
              fontSize: "0.68rem",
              color: "rgba(255,255,255,0.25)",
              lineHeight: 1.65,
              maxWidth: 400,
              margin: "0 auto 16px",
            }}
          >
            City Tour Guide connects guests with featured local destinations, attractions, dining, entertainment, and curated city experiences.
          </div>
          <a
            href="https://citytourguide.app"
            style={{
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.45)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            ← Back to citytourguide.app
          </a>
        </div>
      </div>
    </div>
  );
}
