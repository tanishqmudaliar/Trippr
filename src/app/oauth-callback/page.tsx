"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * OAuth Callback Handler
 *
 * This page handles the redirect from Google OAuth.
 * It extracts the access token from the URL fragment and sends it
 * back to the parent window.
 */
export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Parse the URL fragment for OAuth response
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const expiresIn = params.get("expires_in");
    const error = params.get("error");

    // Check if this page was opened as a popup by OAuth flow
    const isPopup = window.opener !== null;

    if (error) {
      if (isPopup) {
        // Send error back to parent window
        window.opener?.postMessage(
          {
            type: "GOOGLE_AUTH_ERROR",
            error: params.get("error_description") || error,
          },
          window.location.origin,
        );
        window.close();
      } else {
        setStatus("error");
        setErrorMessage(params.get("error_description") || error);
      }
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
          if (isPopup) {
            // Send success back to parent window
            window.opener?.postMessage(
              {
                type: "GOOGLE_AUTH_SUCCESS",
                accessToken,
                expiresIn: parseInt(expiresIn || "3600", 10),
                email: userInfo.email,
                name: userInfo.name || null,
              },
              window.location.origin,
            );
            window.close();
          } else {
            setStatus("success");
            // Redirect to settings after 2 seconds
            setTimeout(() => router.push("/settings"), 2000);
          }
        })
        .catch(() => {
          if (isPopup) {
            // Send success without email if userinfo fails
            window.opener?.postMessage(
              {
                type: "GOOGLE_AUTH_SUCCESS",
                accessToken,
                expiresIn: parseInt(expiresIn || "3600", 10),
                email: null,
                name: null,
              },
              window.location.origin,
            );
            window.close();
          } else {
            setStatus("success");
            setTimeout(() => router.push("/settings"), 2000);
          }
        });
    } else {
      // No token and no error - page accessed directly
      if (isPopup) {
        window.opener?.postMessage(
          {
            type: "GOOGLE_AUTH_ERROR",
            error: "No access token received",
          },
          window.location.origin,
        );
        window.close();
      } else {
        // Redirect to home after a short delay
        setStatus("error");
        setErrorMessage(
          "This page is used for Google authentication. Redirecting you to the app...",
        );
        setTimeout(() => router.push("/"), 2000);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cream-50 via-white to-saffron-50">
      <div className="text-center max-w-md px-4">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-navy-600 font-medium">Completing sign in...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-navy-600 font-medium mb-2">
              Authentication Issue
            </p>
            <p className="text-navy-500 text-sm">{errorMessage}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-navy-600 font-medium mb-2">
              Sign in successful!
            </p>
            <p className="text-navy-500 text-sm">
              Redirecting you back to settings...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
