import React, { useRef } from "react";
import "./PaymentLayout.css";
import DownloadPdfButton from "./DownloadPdfButton";

/**
 * @param {Object} props
 * @param {string} [props.participantName="divyam"]
 * @param {string} [props.experienceTitle="Experience Title"]
 * @param {string} [props.activityName="9 Km"]
 * @param {string} [props.dateTime="20/12/2025 - 10:00 AM - 12:00 PM"]
 * @param {string} [props.pickUpLocation="-"]
 * @param {string} [props.spotLocation=""]
 * @param {string} [props.spotLocationUrl=""]
 * @param {number} [props.totalParticipants=2]
 * @param {string} [props.amountPaid="1.17"]
 * @param {string} [props.amountToBePaid="10.53"]
 * @param {string} [props.advancePlusDiscount=""]
 * @param {string} [props.currency="INR"]
 * @param {boolean} [props.showDownloadButton=true]
 * @param {string} [props.logoUrl=""]
 * 
 */
const PaymentLayout = ({
  participantName = "divyam",
  experienceTitle = "Experience Title",
  activityName = "9 Km",
  dateTime = "20/12/2025 - 10:00 AM - 12:00 PM",
  pickUpLocation = "-",
  spotLocation = "",
  spotLocationUrl = "",
  totalParticipants = 2,
  amountPaid = "1.17",
  amountToBePaid = "10.53",
  advancePlusDiscount = "",
  currency = "INR",
  showDownloadButton = true,
  isForPdf = false,
  logoUrl = "",
}) => {
  const invoiceRef = useRef(null);
  // const isForPdf = props.isForPdf; 
  return (
    <div
      style={{
        minHeight: isForPdf ? "auto" : "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: isForPdf ? "center" : "center",
        background: isForPdf ? "white" : "white",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: "16px",
        padding: isForPdf ? "0" : "0px 0",
      }}
    >
      <div
        style={{
          width: "700px", // Fixed width to match preview exactly
          background: "white",
          borderRadius: "16px",
          boxShadow: isForPdf ? "none" : "0 18px 45px rgba(0,0,0,0.08)",
          padding: "32px 32px 24px",
          height: "auto", // Allow height to adapt, or fixed if strictly required
          minHeight: "1080px"
        }}
        ref={invoiceRef}
      >
        {/* Header logo + title */}
        <header style={{ marginBottom: "5px", position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "5px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {!logoUrl && (
                <>
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "8px",
                      background: "#940fdb",
                      fontSize: "16px",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        // backgroundColor: "red",
                        marginTop: "-10px",
                        width: "15px",
                        height: "15px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#fff",
                        lineHeight: 1,
                        paddingBottom: "2px" // Minor adjustment for visual centering of lowercase b
                      }}
                    >
                      b
                    </div>
                  </div>

                  <img
                    src="/Images/BucketlisttLogo.png"
                    alt="Bucketlistt Logo"
                    style={{
                      height: "60px",
                      objectFit: "contain",
                    }}
                  />
                </>
              )}
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{
                    height: "100px",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
            {/* Download PDF Button */}
            {showDownloadButton && (
              <DownloadPdfButton
                invoiceRef={invoiceRef}
                fileName="Booking_Invoice"
              />
            )}
          </div>

          <h1
            style={{
              fontSize: "20px",
              lineHeight: 1.4,
              fontWeight: 700,
              color: "#111827",
              marginBottom: "20px",
              marginTop: "10px" // Restore natural spacing
            }}
          >
            Booking Confirmed !!
          </h1>
        </header>

        {/* Illustration block */}
        <div
          style={{
            width: "100%",
            borderRadius: "18px",
            background: "#f3effb", // Solid light purple approximation
            padding: "18px 10px",
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <img
            src="/Images/BucketlistGrahic.png"
            alt="Trip illustration"
            style={{
              width: "54%",
              // maxWidth: "320px",
              display: "block",
            }}
          />
        </div>

        {/* Body text */}
        <section
          style={{
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            padding: "18px 18px 16px",
            marginBottom: "18px",
            fontSize: "16px",
            color: "#4b5563",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
            Hello {participantName},
          </p>

          <p style={{ margin: "0 0 16px", fontWeight: 600 }}>
            Your booking with bucketlistt has been confirmed. Below are the
            booking details:
          </p>

          <div
            style={{
              display: "grid",
              rowGap: "8px",
              fontSize: "16px",
            }}
            className="booking-details-text"
          >
            {[
              { label: "Experience:", value: experienceTitle },
              { label: "Activity:", value: activityName },
              {
                label: "Date & Time:",
                value: dateTime,
              },
              {
                label: "Pick up location:",
                value: (pickUpLocation && pickUpLocation !== "-") ? (
                  pickUpLocation.startsWith("http") ? (
                    <a
                      href={pickUpLocation}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#940fdb", textDecoration: "none" }}
                    >
                      Open in Maps
                    </a>
                  ) : (
                    pickUpLocation
                  )
                ) : (
                  "-"
                )
              },
              {
                label: "Spot Location:",
                value: (spotLocationUrl || (spotLocation && spotLocation.startsWith("http"))) ? (
                  <a
                    href={spotLocationUrl || spotLocation}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#940fdb", textDecoration: "none" }}
                  >
                    Open in Maps
                  </a>
                ) : (
                  spotLocation || "-"
                ),
              },
              {
                label: "Total Participants:",
                value: totalParticipants.toString(),
              },
              {
                label: "Amount Paid:",
                value: `${currency === "INR" ? "Rs." : currency} ${amountPaid}`,
              },
              {
                label: "Amount to be Paid:",
                value: `${currency === "INR" ? "Rs." : currency
                  } ${amountToBePaid}`,
                strong: true,
              },
              ...(advancePlusDiscount ? [{
                label: "Advance + Discount:",
                value: `${currency === "INR" ? "Rs." : currency} ${advancePlusDiscount}`,
                strong: false,
              }] : []),
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {/* Bullet dot */}
                <span
                  style={{
                    marginTop: "4px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "999px",
                    background: "#940fdb",
                    flexShrink: 0,
                  }}
                />

                {/* Label + value */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontWeight: item.strong ? 600 : 400,
                      // textAlign: "right",
                      flex: 1,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Extra text + QR grid */}
        <section
          style={{
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "0",
          }}
        >
          <p style={{ marginTop: "-10px", marginBottom: "20px" }}>
            This message is sent to confirm your booking.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "5fr 1fr",
              alignItems: "center",
              columnGap: "12px",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #940fdb",
                background: "#fbf5fe", // Solid light purple
                color: "#111827",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "16px" }}>
                <span>For support or assistance,</span>&nbsp; contact
                bucketlistt at <br />
                <span style={{ fontWeight: 600 }}>+91 85118 38237</span>.
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#940fdb",
                }}
              >
                – Team bucketlistt
              </p>
            </div>

            <div
              style={{
                justifySelf: "end",
                width: "100%",
                padding: "10px",
                aspectRatio: "1 / 1",
                borderRadius: "12px",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=Bucketlistt"
                alt="Support QR"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </section>

        {/* Powered by bucketlistt text - only show if logoUrl is provided */}
        {logoUrl && (
          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
              fontSize: "14px",
              color: "#6b7280",
              paddingTop: "16px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <p style={{ margin: 0 }}>powered by bucketlistt</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLayout;
