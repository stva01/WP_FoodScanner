import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api'; 

function App() {
  const [view, setView] = useState('input');
  
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const [productData, setProductData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!barcodeInput) {
      setError('Please enter a barcode number');
      return;
    }

    setLoading(true);
    setError('');
    setProductData(null);

    try {
      const url = `${API_BASE_URL}/product/${barcodeInput}`;
      console.log("Fetching from:", url);

      const response = await fetch(url);
      const data = await response.json();

      if (response.status === 404) {
        setError('Product not found in database.');
      } else if (!response.ok) {
        setError(data.message || 'Server error occurred.');
      } else {
        setProductData(data);
        setView('output');
      }
    } catch (err) {
      console.error(err);
      setError('Network Error: Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setProductData(null);
    setBarcodeInput('');
    setError('');
    setView('input');
  };

 
  if (view === 'input') {
    return (
      <div style={styles.container}>
        <h1>Barcode Scanner</h1>
        
        <div style={styles.card}>
          <label style={styles.label}>Enter Barcode:</label>
          <input 
            type="text" 
            placeholder="Ex: 5449000000996" 
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            style={styles.input}
          />
          
          <button 
            onClick={handleScan} 
            disabled={loading} 
            style={styles.button}
          >
            {loading ? 'Scanning...' : 'Scan Product'}
          </button>

          {error && <p style={styles.error}>{error}</p>}
          
          <div style={styles.debug}>
            <small>Connecting to: {API_BASE_URL}</small>
          </div>
        </div>
      </div>
    );
  }

 
  if (view === 'output' && productData) {
    return (
      <div style={styles.container}>
        <button onClick={handleBack} style={styles.backButton}>
          ← Back to Search
        </button>

        <div style={styles.card}>
          <h1 style={styles.title}>{productData.name}</h1>
          
          <div style={styles.imageContainer}>
            {productData.image ? (
              <img 
                src={productData.image} 
                alt={productData.name} 
                style={styles.image}
                onError={(e) => e.target.src = 'https://placehold.co/200?text=No+Image'} 
              />
            ) : (
              <div style={styles.noImage}>No Image Available</div>
            )}
          </div>

          <div style={styles.details}>
            <p><strong>Barcode:</strong> {productData.barcode}</p>
            <p><strong>Brand:</strong> {productData.brand}</p>
            
            <p>
              <strong>Nutrition Grade: </strong> 
              <span style={{
                ...styles.gradeBadge, 
                backgroundColor: getGradeColor(productData.nutritionGrade)
              }}>
                {productData.nutritionGrade || '?'}
              </span>
            </p>
            
            <p><strong>Ingredients:</strong></p>
            <p style={styles.textBlock}>{productData.ingredients || 'Not listed'}</p>
            
            <p><strong>Allergens:</strong></p>
            <p style={styles.textBlock}>{productData.allergens || 'None'}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const getGradeColor = (grade) => {
  const map = { 'a': '#2e7d32', 'b': '#8bc34a', 'c': '#ffeb3b', 'd': '#ff9800', 'e': '#f44336' };
  return map[grade?.toLowerCase()] || '#9e9e9e';
};

const styles = {
  container: { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
  card: { border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  label: { display: 'block', marginBottom: '10px', fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', fontSize: '16px', marginBottom: '15px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
  backButton: { marginBottom: '15px', padding: '8px 12px', cursor: 'pointer', border: 'none', background: 'none', color: '#007bff', fontSize: '16px' },
  error: { color: 'red', marginTop: '15px' },
  debug: { marginTop: '20px', color: '#666', fontSize: '12px' },
  title: { marginTop: 0, color: '#333' },
  imageContainer: { textAlign: 'center', margin: '20px 0' },
  image: { maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' },
  noImage: { width: '100%', height: '200px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gradeBadge: { padding: '4px 12px', borderRadius: '12px', color: 'white', fontWeight: 'bold', textTransform: 'uppercase' },
  textBlock: { background: '#f9f9f9', padding: '10px', borderRadius: '4px', fontSize: '14px', lineHeight: '1.4' },
  details: { textAlign: 'left' }
};

export default App;