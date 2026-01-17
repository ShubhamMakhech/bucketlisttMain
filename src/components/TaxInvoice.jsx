import React, { useRef } from "react";
import "./PaymentLayout.css";

/**
 * Tax Invoice Component - Vendor to Customer Tax Invoice
 * @param {Object} props
 * @param {string} [props.customerName="Customer"]
 * @param {string} [props.customerAddress=""]
 * @param {string} [props.invoiceNumber=""]
 * @param {string} [props.invoiceDate=""]
 * @param {string} [props.experienceTitle="Experience Title"]
 * @param {string} [props.activityName="Activity"]
 * @param {string} [props.dateTime=""]
 * @param {number} [props.totalParticipants=1]
 * @param {number} [props.originalPricePerPerson=0]
 * @param {number} [props.basePricePerPerson=0]
 * @param {number} [props.taxAmountPerPerson=0]
 * @param {number} [props.totalPricePerPerson=0]
 * @param {number} [props.discountPerPerson=0]
 * @param {number} [props.netPricePerPerson=0]
 * @param {number} [props.totalBasePrice=0]
 * @param {number} [props.totalTaxAmount=0]
 * @param {number} [props.totalAmount=0]
 * @param {number} [props.totalDiscount=0]
 * @param {number} [props.totalNetPrice=0]
 * @param {string} [props.currency="INR"]
 * @param {string} [props.logoUrl=""]
 * @param {string} [props.vendorName=""]
 * @param {string} [props.vendorAddress=""]
 * @param {string} [props.vendorGST=""]
 * @param {string} [props.placeOfSupply=""]
 * @param {string} [props.hsnCode="999799"]
 * @param {boolean} [props.showDownloadButton=false]
 */
const TaxInvoice = ({
  customerName = "Customer",
  customerAddress = "",
  invoiceNumber = "",
  invoiceDate = "",
  experienceTitle = "Experience Title",
  activityName = "Activity",
  dateTime = "",
  totalParticipants = 1,
  originalPricePerPerson = 0,
  basePricePerPerson = 0,
  taxAmountPerPerson = 0,
  totalPricePerPerson = 0,
  discountPerPerson = 0,
  netPricePerPerson = 0,
  totalBasePrice = 0,
  totalTaxAmount = 0,
  totalAmount = 0,
  totalDiscount = 0,
  totalNetPrice = 0,
  currency = "INR",
  logoUrl = "",
  vendorName = "",
  vendorAddress = "",
  vendorGST = "",
  placeOfSupply = "",
  hsnCode = "999799",
  showDownloadButton = false,
}) => {
  const invoiceRef = useRef(null);

  const formatCurrency = (amount) => {
    const formatted = parseFloat(amount || 0).toFixed(2);
    return `${currency === "INR" ? "₹" : currency} ${formatted}`;
  };

  return (
    <div
      style={{
        minHeight: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "white",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: "14px",
        padding: "0",
      }}
    >
      <div
        style={{
          width: "700px",
          background: "white",
          borderRadius: "16px",
          boxShadow: "none",
          padding: "32px 32px 24px",
          height: "auto",
          minHeight: "auto",
        }}
        ref={invoiceRef}
      >
        {/* Header */}
        <header style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
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
                        paddingBottom: "2px",
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
          </div>

          <h1
            style={{
              fontSize: "24px",
              lineHeight: 1.4,
              fontWeight: 700,
              color: "#111827",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            Tax Invoice
          </h1>
        </header>

        {/* Customer Details */}
        <section
          style={{
            marginBottom: "24px",
            fontSize: "14px",
            color: "#374151",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#111827" }}>{customerName}</strong>
          </div>
          {customerAddress && (
            <div style={{ color: "#6b7280", marginBottom: "8px" }}>
              {customerAddress}
            </div>
          )}
        </section>

        {/* Invoice Details */}
        <section
          style={{
            marginBottom: "24px",
            fontSize: "14px",
            color: "#374151",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Invoice number:</strong> {invoiceNumber}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Invoice date:</strong> {invoiceDate}
            </div>
          </div>
          <div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Place of supply (Name of state):</strong> {placeOfSupply}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>HSN Code:</strong> {hsnCode}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Tax is payable on reverse charge basis:</strong> No
            </div>
          </div>
        </section>

        {/* On Behalf Of */}
        {vendorName && (
          <section
            style={{
              marginBottom: "24px",
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            <div style={{ marginBottom: "4px" }}>
              <strong>On behalf of:</strong> {experienceTitle}
            </div>
            {vendorName && (
              <div style={{ color: "#6b7280", fontSize: "13px" }}>
                {vendorName}
              </div>
            )}
            {vendorAddress && (
              <div style={{ color: "#6b7280", fontSize: "13px" }}>
                {vendorAddress}
              </div>
            )}
            {vendorGST && (
              <div style={{ color: "#6b7280", fontSize: "13px" }}>
                GST: {vendorGST}
              </div>
            )}
          </section>
        )}

        {/* Invoice Table */}
        <section style={{ marginBottom: "24px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Tax Point Date
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Tax
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Tax Amount
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Net amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "12px 8px", color: "#374151" }}>
                  {invoiceDate}
                </td>
                <td style={{ padding: "12px 8px", color: "#374151" }}>
                  {activityName || experienceTitle}
                  {totalParticipants > 1 && ` (${totalParticipants} pax)`}
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    color: "#374151",
                  }}
                >
                  {totalParticipants}
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    color: "#374151",
                  }}
                >
                  IGST 18%
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    color: "#374151",
                  }}
                >
                  {formatCurrency(totalTaxAmount)}
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    color: "#374151",
                  }}
                >
                  {formatCurrency(totalNetPrice)}
                </td>
              </tr>
              {totalDiscount > 0 && (
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px 8px", color: "#374151" }}>
                    {invoiceDate}
                  </td>
                  <td style={{ padding: "12px 8px", color: "#374151" }}>
                    Discount
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "center",
                      color: "#374151",
                    }}
                  >
                    1
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "center",
                      color: "#374151",
                    }}
                  >
                    -
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "right",
                      color: "#dc2626",
                    }}
                  >
                    {formatCurrency(0)}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "right",
                      color: "#dc2626",
                    }}
                  >
                    -{formatCurrency(totalDiscount / 1.18)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr
                style={{
                  borderTop: "2px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <td
                  colSpan={4}
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Total net amount
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {formatCurrency(0)}
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {formatCurrency(totalNetPrice)}
                </td>
              </tr>
              <tr style={{ background: "#f9fafb" }}>
                <td
                  colSpan={4}
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Total IGST 18%
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {formatCurrency(totalTaxAmount)}
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {formatCurrency(0)}
                </td>
              </tr>
              <tr
                style={{
                  borderTop: "2px solid #111827",
                  background: "#f9fafb",
                }}
              >
                <td
                  colSpan={4}
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#111827",
                    fontSize: "16px",
                  }}
                >
                  Total amount payable
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#111827",
                    fontSize: "16px",
                  }}
                >
                  {formatCurrency(0)}
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#111827",
                    fontSize: "16px",
                  }}
                >
                  {formatCurrency(totalNetPrice + totalTaxAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Footer - Vendor Details */}
        {(vendorName || vendorAddress || vendorGST) && (
          <section
            style={{
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid #e5e7eb",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            {vendorName && <div style={{ marginBottom: "4px" }}>{vendorName}</div>}
            {vendorAddress && (
              <div style={{ marginBottom: "4px" }}>{vendorAddress}</div>
            )}
            {vendorGST && <div>GST: {vendorGST}</div>}
          </section>
        )}

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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                lineHeight: 1,
              }}
            >
              <span style={{ margin: 0, color: "#6b7280" }}>powered by</span>
              <img
                src="/Images/BucketlisttLogo.png"
                alt="bucketlistt"
                style={{
                  height: "40px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  marginTop: "14px",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxInvoice;
