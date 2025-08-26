import React from 'react';

const FallbackHomePage = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{ 
        backgroundColor: '#002F5F', 
        padding: '1rem', 
        color: 'white',
        marginBottom: '2rem',
        borderRadius: '0.5rem'
      }}>
        <h1 style={{ margin: '0' }}>Job Selection System (JSS)</h1>
      </header>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem'
      }}>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '1.5rem',
          borderRadius: '0.5rem'
        }}>
          <h2>Welcome to the Job Selection System</h2>
          <p>This system allows eligible drivers to select their preferred jobs based on seniority.</p>
          <div style={{ marginTop: '1.5rem' }}>
            <h3>How It Works</h3>
            <ol style={{ paddingLeft: '1.5rem' }}>
              <li>Log in using your employee ID</li>
              <li>View available jobs for the current selection period</li>
              <li>Rank your preferences in order</li>
              <li>Submit your selections before the deadline</li>
            </ol>
          </div>
        </div>
        
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '1.5rem',
          borderRadius: '0.5rem'
        }}>
          <h2>Driver Access</h2>
          <p>Please enter your employee ID to continue:</p>
          <div style={{ marginTop: '1rem' }}>
            <input 
              type="text" 
              placeholder="Enter Employee ID"
              style={{
                width: '100%',
                padding: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid #ccc',
                borderRadius: '0.25rem'
              }}
            />
            <button 
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#002F5F',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button 
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#002F5F',
                border: '1px solid #002F5F',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
      
      <footer style={{ 
        marginTop: '2rem',
        padding: '1rem',
        borderTop: '1px solid #ccc',
        textAlign: 'center',
        color: '#666'
      }}>
        <p>© {new Date().getFullYear()} Job Selection System | All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default FallbackHomePage;