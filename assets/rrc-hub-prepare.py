#!/usr/bin/env python3
"""Runs before rrcd on every start.

rrcd exits after creating any missing file, so the hub identity has to exist
before it starts. The package seeds rrcd.toml and rooms.toml itself; this
creates the identity on first start and records the hub address it implies, so
the Hub Info action can show it without starting Reticulum.
"""
import os

import RNS

RRCD_DIR = "/data/rrcd"
IDENTITY = os.path.join(RRCD_DIR, "hub_identity")
ADDRESS = os.path.join(RRCD_DIR, "hub_address")

os.makedirs(RRCD_DIR, mode=0o700, exist_ok=True)
os.makedirs("/data/rns", mode=0o700, exist_ok=True)

if not os.path.exists(IDENTITY):
    RNS.Identity().to_file(IDENTITY)
    os.chmod(IDENTITY, 0o600)
    print("Created a new hub identity")

identity = RNS.Identity.from_file(IDENTITY)
if identity is None:
    raise SystemExit(f"Cannot read the hub identity at {IDENTITY}")

address = RNS.Destination.hash(identity, "rrc", "hub").hex()
with open(ADDRESS, "w", encoding="utf-8") as f:
    f.write(address + "\n")
print(f"Hub address: {address}")
