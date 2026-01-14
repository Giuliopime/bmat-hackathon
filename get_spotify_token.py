#!/usr/bin/env python3
"""Fetch a Spotify Web API app access token.

Usage:
    python get_spotify_token.py --client-id <id> --client-secret <secret>

If the flags are omitted, the script will fall back to the environment variables
`SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`.
"""

import argparse
import base64
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error

TOKEN_URL = "https://accounts.spotify.com/api/token"


def request_token(client_id: str, client_secret: str) -> dict:
  auth_header = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

  data = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode()

  request = urllib.request.Request(
    TOKEN_URL,
    data=data,
    headers={
      "Authorization": f"Basic {auth_header}",
      "Content-Type": "application/x-www-form-urlencoded"
    }
  )

  with urllib.request.urlopen(request) as response:
    payload = response.read().decode()
    return json.loads(payload)


def main() -> None:
  parser = argparse.ArgumentParser(description="Get a Spotify Web API access token")
  parser.add_argument("--client-id", default=os.getenv("SPOTIFY_CLIENT_ID"), help="Spotify client ID")
  parser.add_argument("--client-secret", default=os.getenv("SPOTIFY_CLIENT_SECRET"), help="Spotify client secret")

  args = parser.parse_args()

  if not args.client_id or not args.client_secret:
    print("Client ID and secret are required (pass flags or set env vars).", file=sys.stderr)
    sys.exit(1)

  try:
    token_info = request_token(args.client_id, args.client_secret)
  except urllib.error.HTTPError as exc:
    print(f"Request failed: {exc.read().decode()}", file=sys.stderr)
    sys.exit(exc.code)
  except Exception as exc:  # noqa: BLE001
    print(f"Unexpected error: {exc}", file=sys.stderr)
    sys.exit(1)

  print(json.dumps(token_info, indent=2))


if __name__ == "__main__":
  main()
