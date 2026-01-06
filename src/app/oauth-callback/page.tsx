"use client";

import { useEffect } from "react";

/**
 * OAuth Callback Handler
 *
 * This page handles the redirect from Google OAuth.
 * It extracts the access token from the URL fragment and sends it
 * back to the parent window.
 */
export default function OAuthCallback() {
  useEffect(() => {
    // Parse the URL fragment for OAuth response
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const expiresIn = params.get("expires_in");
    const error = params.get("error");

    if (error) {
      // Send error back to parent window
      window.opener?.postMessage(
        {
          type: "GOOGLE_AUTH_ERROR",
          error: params.get("error_description") || error,
        },
        window.location.origin
      );
      window.close();
      return;
    }

    if (accessToken) {
      // Get user email from the token
      fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((userInfo) => {
          // Send success back to parent window
          window.opener?.postMessage(
            {
              type: "GOOGLE_AUTH_SUCCESS",
              accessToken,
              expiresIn: parseInt(expiresIn || "3600", 10),
              email: userInfo.email,
            },
            window.location.origin
          );
          window.close();
        })
        .catch(() => {
          // Send success without email if userinfo fails
          window.opener?.postMessage(
            {
              type: "GOOGLE_AUTH_SUCCESS",
              accessToken,
              expiresIn: parseInt(expiresIn || "3600", 10),
              email: null,
            },
            window.location.origin
          );
          window.close();
        });
    } else {
      // No token and no error - unexpected state
      window.opener?.postMessage(
        {
          type: "GOOGLE_AUTH_ERROR",
          error: "No access token received",
        },
        window.location.origin
      );
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cream-50 via-white to-saffron-50">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-navy-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
