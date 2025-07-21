import React from 'react';

const NoInternet = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#f8d7da',
      color: '#721c24',
      fontFamily: 'Arial, sans-serif',
    }}>
      <svg width="80" height="80" fill="#721c24" viewBox="0 0 24 24" style={{marginBottom: 24}}>
        <path d="M12 4C7.03 4 2.73 6.81 0.46 11.01L2.21 11.99C4.13 8.25 7.8 6 12 6C16.2 6 19.87 8.25 21.79 11.99L23.54 11.01C21.27 6.81 16.97 4 12 4ZM12 8C8.13 8 4.84 10.13 3.13 13.44L4.87 14.42C6.22 11.98 8.92 10 12 10C15.08 10 17.78 11.98 19.13 14.42L20.87 13.44C19.16 10.13 15.87 8 12 8ZM12 12C10.07 12 8.41 13.23 7.74 15H16.26C15.59 13.23 13.93 12 12 12ZM12 20C13.1 20 14 19.1 14 18H10C10 19.1 10.9 20 12 20Z"/>
      </svg>
      <h1>No Internet Connection</h1>
      <p>It looks like you are offline. Please check your internet connection and try again.</p>
    </div>
  );
};

export default NoInternet;
