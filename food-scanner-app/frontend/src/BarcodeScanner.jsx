import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

/**
 * BarcodeScanner (Vite + React)
 * - decodes barcodes from camera or uploaded image
 * - fetches product data from backend at VITE_API_BASE/product/:barcode
 */

export default function BarcodeScanner() {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [lastBarcode, setLastBarcode] = useState('');
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    return () => {
      stopCamera();
      try { codeReaderRef.current.reset(); } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setError(null);
    setProductData(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API not available in this browser.');
      return;
    }
    try {
      setScanning(true);
      const constraints = { video: { facingMode: 'environment' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) videoRef.current.srcObject = stream;

      codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          if (code && code !== lastBarcode) {
            setLastBarcode(code);
            stopCamera();
            fetchProduct(code);
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          // non-critical errors are ignored
        }
      });
    } catch (e) {
      setError('Unable to access camera. Check permissions.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks ? videoRef.current.srcObject.getTracks() : [];
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    try { codeReaderRef.current.reset(); } catch (e) {}
  };

  const fetchProduct = async (barcode) => {
    setError(null);
    setProductData(null);
    setLoadingProduct(true);
    try {
      const code = String(barcode).trim();
      const url = `${API_BASE}/product/${encodeURIComponent(code)}`;
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) {
        if (resp.status === 404) throw new Error('Product not found');
        throw new Error(`Product lookup failed (${resp.status})`);
      }
      const json = await resp.json();
      setProductData(json);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingProduct(false);
    }
  };

  const onFileChange = async (ev) => {
    setError(null);
    setProductData(null);
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await new Promise((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('Failed to load image'));
      });
      const result = await codeReaderRef.current.decodeFromImage(img).catch(err => { throw err; });
      if (result && result.getText()) {
        const code = result.getText();
        setLastBarcode(code);
        fetchProduct(code);
      } else {
        setError('No barcode detected in the image.');
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const onManualSubmit = (ev) => {
    ev.preventDefault();
    if (!manualInput) {
      setError('Please enter a barcode number.');
      return;
    }
    setLastBarcode(manualInput.trim());
    fetchProduct(manualInput.trim());
  };

  return (
    <div className="bs-container">
      <div className="bs-header">
        <div>
          <div className="bs-title">Food Barcode Scanner</div>
          <div className="bs-sub">Scan product barcodes with camera or upload an image — fetch nutrition data instantly.</div>
        </div>
        <div className="bs-sub">Professional • Privacy-first • Lightweight</div>
      </div>

      <div className="bs-grid">
        <div className="bs-card">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Live camera</label>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 8 }}></video>

              <div className="controls">
                {!scanning ? (
                  <button className="btn-scan" onClick={startCamera} type="button">Start camera scan</button>
                ) : (
                  <button className="btn-stop" onClick={stopCamera} type="button">Stop camera</button>
                )}

                <label className="btn-upload" htmlFor="file-upload" style={{ display: 'inline-block' }}>Upload image</label>
                <input id="file-upload" type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
              </div>

              <div className="upload">
                <div className="muted">Tip: For best results, align the barcode horizontally and make sure it's well lit.</div>
              </div>

              <form className="manual" onSubmit={onManualSubmit} style={{ marginTop: 8 }}>
                <input placeholder="Enter barcode manually (e.g. 0028400199148)" value={manualInput} onChange={(e) => setManualInput(e.target.value)} />
                <button className="btn-scan" type="submit">Lookup</button>
              </form>

              {error && <div className="result" style={{ borderColor: '#ffe4e6', background: '#fff5f5' }}>{error}</div>}
              {loadingProduct && <div className="result">Fetching product data…</div>}

              {productData && (
                <div className="result">
                  <div className="product-name">{productData.name || 'Unknown product'}</div>
                  <div className="muted">Barcode: {lastBarcode}</div>

                  {productData.image && (
                    <img src={productData.image} alt={productData.name} style={{ width: 120, marginTop: 8, borderRadius: 8, border: '1px solid #eef3ff' }} />
                  )}

                  {productData.nutrition && Object.keys(productData.nutrition).length > 0 ? (
                    <table className="nutri-table">
                      <tbody>
                        {Object.entries(productData.nutrition).map(([k, v]) => (
                          <tr key={k}>
                            <td style={{ width: '60%', fontWeight: 600 }}>{k}</td>
                            <td style={{ textAlign: 'right' }}>{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ marginTop: 10 }} className="muted">
                      <div><strong>Brand:</strong> {productData.brand || '—'}</div>
                      <div><strong>Nutrition grade:</strong> {productData.nutritionGrade || '—'}</div>
                      <div style={{ marginTop: 6 }}><strong>Ingredients:</strong> {productData.ingredients || '—'}</div>
                      <div style={{ marginTop: 6 }}><strong>Allergens:</strong> {productData.allergens || '—'}</div>
                    </div>
                  )}

                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: 'pointer' }}>Raw response</summary>
                    <pre style={{ maxHeight: 220, overflow: 'auto', background: '#071125', color: '#cfe8ff', padding: 10, borderRadius: 8 }}>
                      {JSON.stringify(productData, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>

            <aside style={{ width: 240 }}>
              <div className="label">Last scanned</div>
              <div className="bs-card" style={{ padding: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{lastBarcode || '—'}</div>
                <div className="muted" style={{ marginTop: 8 }}>{productData?.name ? productData.name : 'No product fetched yet'}</div>

                <div style={{ marginTop: 12 }}>
                  <button className="btn-scan" type="button" onClick={() => { if (lastBarcode) fetchProduct(lastBarcode); }}>Refetch</button>
                  <button style={{ marginLeft: 8 }} type="button" className="btn-stop" onClick={() => { setLastBarcode(''); setProductData(null); setError(null); }}>Clear</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }} className="muted">If your API runs on another port, update <code>VITE_API_BASE</code> in <code>.env</code>.</div>
            </aside>
          </div>
        </div>

        <div className="bs-card">
          <div className="label">How it works</div>
          <ol style={{ paddingLeft: 18 }}>
            <li className="muted">Start the camera scanner — the app continuously decodes barcodes from the live stream.</li>
            <li className="muted">Or upload a photo containing the barcode.</li>
            <li className="muted">On successful decode the app makes a GET request to <code>{API_BASE}/product/&lt;barcode&gt;</code> and displays nutrition data.</li>
          </ol>

          <div style={{ marginTop: 12 }}>
            <div className="label">Privacy</div>
            <div className="muted">Images are decoded locally in the browser; only the barcode number is sent to your backend.</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="label">Troubleshooting</div>
            <ul style={{ paddingLeft: 18 }}>
              <li className="muted">Grant camera permission and prefer rear camera on phones.</li>
              <li className="muted">Ensure the barcode is not too small or blurred in photos.</li>
              <li className="muted">If your backend is on a different origin, enable CORS for GET /api/product/:barcode.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
