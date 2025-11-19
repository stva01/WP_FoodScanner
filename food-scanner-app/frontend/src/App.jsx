// src/App.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Single-file App.jsx
 * - UI styled to match your screenshot
 * - Lazy-loads @zxing/browser for camera/upload decoding
 * - Camera / Upload / Manual tabs
 * - GET to `${VITE_API_BASE}/product/:barcode`
 *
 * Usage:
 *  - Ensure @zxing/browser is installed: npm install @zxing/browser@latest
 *  - Start Vite dev server
 *  - Optionally set VITE_API_BASE in frontend/.env
 */

export default function App() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [scannerLoaded, setScannerLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState("camera"); // camera | upload | manual
  const [scanning, setScanning] = useState(false);
  const [lastBarcode, setLastBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

  useEffect(() => {
    // cleanup camera on unmount
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy-load scanner library
  const loadScanner = async () => {
    if (scannerLoaded && readerRef.current) return true;
    try {
      const mod = await import("@zxing/browser");
      readerRef.current = new mod.BrowserMultiFormatReader();
      setScannerLoaded(true);
      console.log("Scanner loaded");
      return true;
    } catch (e) {
      console.error("Failed to load scanner:", e);
      setError("Failed to load barcode scanner. You can still use upload/manual.");
      return false;
    }
  };

  // Start camera & decode continuously
  const startCamera = async () => {
    setError("");
    setProduct(null);
    const ok = await loadScanner();
    if (!ok) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);

      readerRef.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          if (code && code !== lastBarcode) {
            setLastBarcode(code);
            stopCamera();
            fetchProduct(code);
          }
        }
        // ignore not found exceptions (no barcode in frame)
        if (err && err.name !== "NotFoundException") {
          console.warn("Decode error:", err);
        }
      });
    } catch (e) {
      console.error("startCamera error:", e);
      setError("Unable to access camera. Check permissions.");
      setScanning(false);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn("stopCamera cleanup error", e);
    }
    try {
      readerRef.current?.reset?.();
    } catch {}
  };

  // Fetch product from backend
  const fetchProduct = async (barcode) => {
    setError("");
    setLoadingProduct(true);
    setProduct(null);
    try {
      const code = String(barcode).trim();
      const res = await fetch(`${API_BASE}/product/${encodeURIComponent(code)}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Product not found");
        throw new Error(`Lookup failed (${res.status})`);
      }
      const json = await res.json();
      setProduct(json);
    } catch (e) {
      console.error("fetchProduct error:", e);
      setError(e.message || String(e));
    } finally {
      setLoadingProduct(false);
    }
  };

  // Handle image upload decode
  const onUploadImage = async (ev) => {
    setError("");
    setProduct(null);
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const ok = await loadScanner();
    if (!ok) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = async () => {
      try {
        const result = await readerRef.current.decodeFromImage(img);
        const code = result.getText();
        setLastBarcode(code);
        fetchProduct(code);
      } catch (e) {
        console.error("decodeFromImage error:", e);
        setError("No barcode detected in the image.");
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      setError("Failed to load image file.");
      URL.revokeObjectURL(url);
    };
  };

  // Manual lookup
  const onManualSubmit = (ev) => {
    ev.preventDefault();
    setError("");
    if (!manualInput) {
      setError("Enter a barcode to lookup.");
      return;
    }
    setLastBarcode(manualInput.trim());
    fetchProduct(manualInput.trim());
  };

  // Small UI building blocks: icons
  const CameraIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7h3l2-2h6l2 2h3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
  const UploadIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 10l5-5 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 5v12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const ManualIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 8h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // ------------------------------
  // Render UI (styles injected below)
  // ------------------------------
  return (
    <div className="fs-root">
      {/* Inject CSS for the full page */}
      <style>{`
        :root{
          --mint-1: #eafaf5;
          --mint-2: #e6fff9;
          --card-bg: #ffffff;
          --muted: #64748b;
          --accent: #10b981;
          --cta: #059669;
          --blue: #2563eb;
          --danger: #ef4444;
          --shadow: 0 8px 30px rgba(20,20,40,0.06);
        }
        *{box-sizing:border-box;font-family:Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;}
        body{margin:0;background:linear-gradient(180deg, #f3fbf8 0%, #f7fff9 100%);}

        .fs-container{max-width:980px;margin:36px auto;padding:28px;border-radius:16px;background:transparent;}
        .fs-header{text-align:center;margin-bottom:16px}
        .fs-icon{
          width:64px;height:64px;border-radius:14px;background:linear-gradient(180deg,#14b8a6,#059669);display:inline-flex;align-items:center;justify-content:center;color:#fff;margin-bottom:12px;
          box-shadow: 0 8px 20px rgba(6,95,70,0.08);
        }
        .fs-title{font-size:36px;font-weight:800;color:#07203a;margin:0}
        .fs-sub{color:var(--muted);margin-top:6px}

        .card{
          margin-top:26px;
          background: linear-gradient(180deg,#ffffff,#fbffff);
          border-radius:18px;
          box-shadow: var(--shadow);
          overflow:hidden;
          border: 1px solid rgba(10,20,30,0.02);
        }

        .tabs{display:flex;align-items:center;border-bottom:1px solid #f1f7f6}
        .tab{
          padding:16px 26px; cursor:pointer; display:flex;gap:10px; align-items:center; font-weight:600; color:#0f172a;
          background:transparent; border:none; outline:none; font-size:15px;
        }
        .tab.active{ background: linear-gradient(180deg,#10b981,#059669); color:#fff; }
        .tab:not(.active){ color:#475569; }

        .card-body{padding:36px; display:flex; gap:20px; align-items:stretch;}
        .left{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:320px; border-right:1px solid #f6faf9;}
        .right{width:360px;padding:18px;}

        .camera-placeholder{
          width:180px;height:140px;border-radius:14px;background:#f6faf9;border:1px solid #eef6f4;display:flex;align-items:center;justify-content:center;margin-bottom:18px;
        }
        .camera-placeholder svg{opacity:0.45}

        .btn-cta{background:var(--cta); color:#fff;padding:12px 22px;border-radius:30px;border:none;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(5,150,105,0.18);}

        video{ width:100%; max-width:540px; height:320px; border-radius:12px; object-fit:cover; border:1px solid #e6f3f0; }

        .muted{color:var(--muted)}
        .info-card{background:#fff;padding:12px;border-radius:10px;border:1px solid #f1f7f6}
        .product-img{width:110px;border-radius:10px;border:1px solid #eef6f8}

        .field{margin-top:12px}
        .manual-form{display:flex;gap:8px;margin-top:8px}
        .manual-form input{flex:1;padding:10px;border-radius:10px;border:1px solid #eef6f8}
        .manual-form button{padding:10px 14px;border-radius:10px;border:none;background:var(--blue);color:#fff;cursor:pointer;font-weight:700}

        .small-muted{font-size:13px;color:#94a3b8;margin-top:10px}

        @media (max-width:900px){
          .card-body{flex-direction:column}
          .right{width:100%}
          video{height:220px}
        }
      `}</style>

      <div className="fs-container">
        <div className="fs-header">
          <div className="fs-icon" aria-hidden>
            {/* small cube icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M21 16.5V7.5L12 3 3 7.5v9L12 21l9-4.5z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 className="fs-title">Food Scanner</h1>
          <div className="fs-sub">Scan barcodes to discover nutritional information</div>
        </div>

        <div className="card">
          <div className="tabs" role="tablist" aria-label="scanner tabs">
            <button className={`tab ${activeTab === "camera" ? "active" : ""}`} onClick={() => setActiveTab("camera")} aria-selected={activeTab === "camera"}>
              <CameraIcon /> Camera
            </button>
            <button className={`tab ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")} aria-selected={activeTab === "upload"}>
              <UploadIcon /> Upload
            </button>
            <button className={`tab ${activeTab === "manual" ? "active" : ""}`} onClick={() => setActiveTab("manual")} aria-selected={activeTab === "manual"}>
              <ManualIcon /> Manual
            </button>
          </div>

          <div className="card-body">
            <div className="left">
              {/* camera view or placeholder */}
              {activeTab === "camera" && (
                <>
                  <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <video ref={videoRef} playsInline muted />
                  </div>

                  <div style={{ marginTop: 18 }}>
                    {!scanning ? (
                      <button className="btn-cta" onClick={startCamera}><CameraIcon size={18} /> &nbsp; Start Camera</button>
                    ) : (
                      <button className="btn-cta" onClick={stopCamera} style={{ background: "#ef4444" }}>Stop Camera</button>
                    )}
                  </div>

                  <div className="small-muted">Tip: point camera at barcode, prefer rear camera on phones.</div>
                </>
              )}

              {activeTab === "upload" && (
                <>
                  <div className="camera-placeholder" aria-hidden>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M3 7h3l2-2h6l2 2h3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="#9aaeb0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="3.5" stroke="#9aaeb0" strokeWidth="1.2"/></svg>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label className="btn-cta" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <UploadIcon /> &nbsp; Choose Image
                      <input type="file" accept="image/*" onChange={onUploadImage} style={{ display: "none" }} />
                    </label>
                  </div>

                  <div className="small-muted">Upload a photo of the barcode. The scanner decodes it locally in your browser.</div>
                </>
              )}

              {activeTab === "manual" && (
                <>
                  <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <div style={{ maxWidth: 480, width: "100%" }}>
                      <div className="field">
                        <form className="manual-form" onSubmit={onManualSubmit}>
                          <input value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="Enter barcode (e.g. 0028400199148)" />
                          <button type="submit">Lookup</button>
                        </form>
                        <div className="small-muted">Manual lookup if scanning isn't possible.</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="right">
              <div className="info-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>{product?.name || "No product selected"}</div>
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>{lastBarcode || "—"}</div>
                </div>

                {loadingProduct && <div style={{ marginTop: 10 }}>Fetching product data…</div>}

                {product ? (
                  <div style={{ marginTop: 12 }}>
                    {product.image && <img className="product-img" src={product.image} alt={product.name} />}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ color: "#475569" }}><strong>Brand:</strong> {product.brand || "—"}</div>
                      <div style={{ color: "#475569", marginTop: 6 }}><strong>Nutrition grade:</strong> {product.nutritionGrade || "—"}</div>
                      <div style={{ color: "#475569", marginTop: 6 }}><strong>Ingredients:</strong> {product.ingredients || "—"}</div>
                      <div style={{ color: "#475569", marginTop: 6 }}><strong>Allergens:</strong> {product.allergens || "—"}</div>
                    </div>
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ cursor: "pointer" }}>Raw response</summary>
                      <pre style={{ maxHeight: 200, overflow: "auto", background: "#071125", color: "#cfe8ff", padding: 10, borderRadius: 8 }}>{JSON.stringify(product, null, 2)}</pre>
                    </details>
                  </div>
                ) : (
                  <div style={{ marginTop: 12, color: "#94a3b8" }}>
                    Tip: Start the camera, upload an image, or enter the barcode manually.
                  </div>
                )}

                {error && <div style={{ marginTop: 12, color: "#ef4444" }}>⚠ {error}</div>}

                <div style={{ marginTop: 12 }}>
                  <button onClick={() => { if (lastBarcode) fetchProduct(lastBarcode); }} className="btn-cta" style={{ background: "#059669" }}>Refetch</button>
                  <button onClick={() => { setLastBarcode(""); setProduct(null); setError(""); setManualInput(""); }} className="btn-cta" style={{ marginLeft: 8, background: "#ef4444" }}>Clear</button>
                </div>

                <div style={{ marginTop: 12 }} className="small-muted">
                  If your backend runs on a different port, set <code>VITE_API_BASE</code> in <code>.env</code>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> {/* fs-container */}

      {/* Icons used in tabs — local components returned as nodes */}
      {/* small components defined here to keep markup clean */}
      {/* For accessibility, add aria labels where needed */}
    </div>
  );

  // local small icon components inline (to keep file single)
  
  
}