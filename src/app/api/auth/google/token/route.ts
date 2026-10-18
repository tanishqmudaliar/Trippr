import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
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

    // Exchange authorization code for access_token and refresh_token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google token exchange error:", tokenData);
      return NextResponse.json(
        {
          error:
            tokenData.error_description ||
            tokenData.error ||
            "Failed to exchange authorization code",
        },
        { status: tokenResponse.status },
      );
    }

    // Retrieve user profile (email and name) using the fresh access token
    let email: string | null = null;
    let name: string | null = null;

    try {
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        },
      );
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.email || null;
        name = userInfo.name || null;
      }
    } catch {
      // Non-fatal if userinfo fails
    }

    return NextResponse.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresIn: tokenData.expires_in,
      email,
      name,
    });
  } catch (error) {
    console.error("OAuth token exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 },
    );
  }
}
