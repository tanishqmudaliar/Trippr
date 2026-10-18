import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 },
      );
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Google OAuth credentials not configured on server" },
        { status: 500 },
      );
    }

    // Request new access token from Google using permanent refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google token refresh error:", tokenData);
      return NextResponse.json(
        {
          error:
            tokenData.error_description ||
            tokenData.error ||
            "Failed to refresh access token",
        },
        { status: tokenResponse.status },
      );
    }

    return NextResponse.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });
  } catch (error) {
    console.error("OAuth token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error during token refresh" },
      { status: 500 },
    );
  }
}
