

import React, { useEffect } from 'react';

const FacebookAuth: React.FC = () => {
  useEffect(() => {
    // Load the Facebook SDK script
    const loadFacebookSDK = () => {
      if (window.FB) return;

      ((d, s, id) => {
        const fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;

        const js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = 'https://connect.facebook.net/en_US/sdk.js';
        js.onload = () => {
          window.FB.init({
            appId: '741074022014246', // ✅ Your Facebook App ID
            cookie: true,
            xfbml: true,
            version: 'v19.0',
          });
        };

        fjs.parentNode?.insertBefore(js, fjs);
      })(document, 'script', 'facebook-jssdk');
    };

    loadFacebookSDK();
  }, []);

  const handleFBLogin = () => {
    if (!window.FB) return;

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          window.FB.api('/me', { fields: 'name,email,picture' }, (userInfo: any) => {
            console.log('✅ Facebook Login Success');
            console.log('Name:', userInfo.name);
            console.log('Email:', userInfo.email);
            console.log('Picture:', userInfo.picture?.data?.url);
          });
        } else {
          console.error('❌ Facebook login failed or cancelled');
        }
      },
      { scope: 'email' }
    );
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Login with Facebook</h2>
      <button
        onClick={handleFBLogin}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4267B2',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Login with Facebook
      </button>
    </div>
  );
};

export default FacebookAuth;

// ✅ Declare the FB object globally to prevent TypeScript error
declare global {
  interface Window {
    FB: any;
  }
}
