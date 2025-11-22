import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Add error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error, event.filename, event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

console.log('🚀 App initialization starting...');

// Debug CSS loading
const cssCheck = () => {
  const styles = Array.from(document.styleSheets);
  console.log('📄 CSS files loaded:', styles.length);
  styles.forEach((sheet, index) => {
    try {
      console.log(`  ${index + 1}. ${sheet.href || 'Inline styles'}`);
    } catch (e) {
      console.log(`  ${index + 1}. Cross-origin stylesheet (${sheet.href})`);
    }
  });
};

const rootElement = document.getElementById('root');
console.log('🔍 Root element check:', rootElement ? 'Found' : 'NOT FOUND');

if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found. Please check the HTML structure.</div>';
} else {
  try {
    console.log('🌱 Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('🎯 Rendering App component...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ React app mounted successfully');
    
    // Check CSS after mounting
    setTimeout(cssCheck, 1000);
    
  } catch (error) {
    console.error('❌ Error mounting React app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>Application Error</h1>
        <p>Failed to mount React application.</p>
        <pre>${error.toString()}</pre>
        <p>Check the browser console for more details.</p>
      </div>
    `;
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
