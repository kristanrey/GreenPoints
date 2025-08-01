// src/components/GoogleAuth.tsx
import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode'; // ✅ Correct for jwt-decode v4.x

// Define the payload structure of the Google JWT
interface GoogleTokenPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

const GoogleAuth: React.FC = () => {
  const handleLogin = (response: CredentialResponse) => {
    if (response.credential) {
      try {
        const decoded = jwtDecode<GoogleTokenPayload>(response.credential); // ✅ use jwtDecode

        console.log('✅ Google Login Success!');
        console.log('Name:', decoded.name);
        console.log('Email:', decoded.email);
        console.log('Picture:', decoded.picture);

        // Example: store user in localStorage
        // localStorage.setItem('user', JSON.stringify(decoded));
      } catch (error) {
        console.error('❌ Error decoding token:', error);
      }
    } else {
      console.error('❌ No credential received');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Login with Google</h2>
      <GoogleLogin
        onSuccess={handleLogin}
        onError={() => console.error('❌ Google Login Failed')}
      />
    </div>
  );
};

export default GoogleAuth;
