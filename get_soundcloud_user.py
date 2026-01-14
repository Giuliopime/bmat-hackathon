#!/usr/bin/env python3
"""Fetch basic SoundCloud account info (including numeric user ID).

Usage examples:
    python get_soundcloud_user.py --token YOUR_OAUTH_TOKEN
    SOUNDcloud_TOKEN=... python get_soundcloud_user.py

Pass the SoundCloud OAuth token via --token or the SOUNDCLOUD_TOKEN
environment variable. The script prints the JSON response from
https://api.soundcloud.com/me.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

API_URL = "https://api.soundcloud.com/me"


def request_profile(token: str) -> dict:
  request = urllib.request.Request(
    API_URL,
    headers={
      "Authorization": f"OAuth {token}",
      "Accept": "application/json"
    }
  )

  with urllib.request.urlopen(request) as response:
    payload = response.read().decode()
    return json.loads(payload)


def main() -> None:
  parser = argparse.ArgumentParser(description="Get SoundCloud user profile via OAuth token")
  parser.add_argument("--token", default=os.getenv("SOUNDCLOUD_TOKEN"), help="SoundCloud OAuth token")

  args = parser.parse_args()

  if not args.token:
    print("SoundCloud token is required (pass --token or set SOUNDCLOUD_TOKEN).", file=sys.stderr)
    sys.exit(1)

  try:
    data = request_profile(args.token)
  except urllib.error.HTTPError as exc:
    print(f"Request failed: {exc.read().decode()}", file=sys.stderr)
    sys.exit(exc.code)
  except Exception as exc:  # noqa: BLE001
    print(f"Unexpected error: {exc}", file=sys.stderr)
    sys.exit(1)

  print(json.dumps(data, indent=2))

  if "id" in data:
    print(f"\nUser ID: {data['id']}")


if __name__ == "__main__":
  main()
