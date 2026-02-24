#!/usr/bin/env python3
"""
Installer script for the FusionMCP add-in.
Copies the add-in to the Fusion 360 add-ins directory.
"""

import os
import sys
import shutil
import platform

def get_addin_dir():
    """Get the Fusion 360 add-ins directory for the current platform."""
    system = platform.system()
    if system == "Windows":
        appdata = os.environ.get("APPDATA", "")
        return os.path.join(appdata, "Autodesk", "Autodesk Fusion 360", "API", "AddIns")
    elif system == "Darwin":
        home = os.path.expanduser("~")
        return os.path.join(home, "Library", "Application Support", "Autodesk", "Autodesk Fusion 360", "API", "AddIns")
    else:
        print(f"Unsupported platform: {system}")
        sys.exit(1)

def install():
    """Install the FusionMCP add-in."""
    src_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "FusionMCP")
    dest_dir = os.path.join(get_addin_dir(), "FusionMCP")

    if not os.path.exists(src_dir):
        print(f"Error: Source directory not found: {src_dir}")
        sys.exit(1)

    addin_dir = get_addin_dir()
    if not os.path.exists(addin_dir):
        os.makedirs(addin_dir, exist_ok=True)
        print(f"Created add-ins directory: {addin_dir}")

    if os.path.exists(dest_dir):
        print(f"Removing existing installation at: {dest_dir}")
        shutil.rmtree(dest_dir)

    shutil.copytree(src_dir, dest_dir)
    print(f"FusionMCP add-in installed to: {dest_dir}")
    print("\nNext steps:")
    print("1. Open Fusion 360")
    print("2. Go to UTILITIES > ADD-INS (Shift+S)")
    print("3. Click 'Add-Ins' tab")
    print("4. Find 'FusionMCP' and click 'Run'")
    print("5. The add-in will start listening on 127.0.0.1:8765")

def uninstall():
    """Uninstall the FusionMCP add-in."""
    dest_dir = os.path.join(get_addin_dir(), "FusionMCP")
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)
        print(f"FusionMCP add-in removed from: {dest_dir}")
    else:
        print("FusionMCP add-in is not installed.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "uninstall":
        uninstall()
    else:
        install()
