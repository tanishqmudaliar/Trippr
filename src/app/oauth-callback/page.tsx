"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // 1. Parse both search parameters (?code=...) and hash fragment (#access_token=...)
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const code = queryParams.get("code") || hashParams.get("code");
    const accessToken = queryParams.get("access_token") || hashParams.get("access_token");
    const expiresIn = queryParams.get("expires_in") || hashParams.get("expires_in");
    const error = queryParams.get("error") || hashParams.get("error");
    const errorDescription =
      queryParams.get("error_description") || hashParams.get("error_description");

    const isPopup = typeof window !== "undefined" && window.opener !== null && window.opener !== window;

    // Handle OAuth error
    if (error) {
      if (isPopup) {
        window.opener?.postMessage(
          {
            type: "GOOGLE_AUTH_ERROR",
            error: errorDescription || error,
          },
          window.location.origin,
        );
        window.close();
      } else {
        setStatus("error");
        setErrorMessage(errorDescription || error);
      }
      return;
    }

    // Handle Authorization Code (Solution A - with Refresh Token support)
    if (code) {
      if (isPopup) {
        window.opener?.postMessage(
          {
            type: "GOOGLE_AUTH_CODE",
            code,
          },
          window.location.origin,
        );
        window.close();
        return;
      }

      // If full-page redirect, perform exchange directly
      fetch("/api/auth/google/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri: `${window.location.origin}/oauth-callback`,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to exchange authorization code");
          return res.json();
        })
        .then((authData) => {
          localStorage.setItem(
            "trippr-google-auth",
            JSON.stringify({
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              email: authData.email,
              name: authData.name,
              expiresAt: Date.now() + (authData.expiresIn || 3600) * 1000,
            }),
          );
          setStatus("success");
          setTimeout(() => router.push("/settings"), 1500);
        })
        .catch((err) => {
          setStatus("error");
          setErrorMessage(err.message || "Failed to complete authentication");
        });
      return;
    }

    // Fallback: Handle direct access token (implicit flow)
    if (accessToken) {
      fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((userInfo) => {
          if (isPopup) {
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
            setTimeout(() => router.push("/settings"), 1500);
          }
        })
        .catch(() => {
          if (isPopup) {
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
            setTimeout(() => router.push("/settings"), 1500);
          }
        });
      return;
    }

    // Direct page access without code or token
    if (isPopup) {
      window.opener?.postMessage(
        {
          type: "GOOGLE_AUTH_ERROR",
          error: "No authorization code or token received",
        },
        window.location.origin,
      );
      window.close();
    } else {
      setStatus("error");
      setErrorMessage(
        "This callback endpoint requires Google authorization parameters. Redirecting...",
      );
      setTimeout(() => router.push("/"), 2000);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cream-50 via-white to-saffron-50">
      <div className="text-center max-w-md px-4">
        {status === "loading" && (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto border-4 border-saffron-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-navy-800">
              Connecting Google Drive...
            </p>
            <p className="text-xs text-navy-500">
              Securing authorization tokens
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm font-bold text-navy-950">Authentication Issue</p>
            <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
          </div>
        )}
        {status === "success" && (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-bold text-navy-950">Connection Established</p>
            <p className="text-xs text-navy-500">Returning to application...</p>
          </div>
        )}
      </div>
    </div>
  );
}
