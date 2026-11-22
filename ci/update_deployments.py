#!/usr/bin/env python3
"""Update the image in one selected FoodSpot Deployment manifest (Python stdlib)."""
import argparse
import re
from pathlib import Path

FILENAMES = {
    "frontend": "frontend-deployment.yaml",
    "user": "user-deployment.yaml",
    "food": "food-deployment.yaml",
    "order": "order-deployment.yaml",
    "notification": "notification-deployment.yaml",
}
IMAGE = re.compile(r"^([ \t]*image:[ \t]*).+$", re.MULTILINE)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dir", type=Path, required=True)
    p.add_argument("--service", choices=FILENAMES, required=True)
    p.add_argument("--image", required=True)
    args = p.parse_args()
    expected_suffix = f"/foodspot-{args.service}:"
    if (expected_suffix not in args.image or not re.fullmatch(
        r"[a-z0-9][a-z0-9_.-]*/foodspot-(frontend|user|food|order|notification):[A-Za-z0-9_.-]+",
        args.image,
    )):
        p.error("Invalid image reference or wrong service")

    target = args.dir / FILENAMES[args.service]
    if not target.is_file():
        p.error(f"Missing Deployment YAML: {target}")
    original = target.read_text(encoding="utf-8")
    updated, count = IMAGE.subn(lambda match: match.group(1) + args.image, original)
    if count != 1:
        p.error(f"Expected exactly one image field, found {count}: {target}")
    if updated != original:
        target.write_text(updated, encoding="utf-8")
        print(f"Updated {target}: {args.image}")
    else:
        print(f"Already up-to-date: {target}")


if __name__ == "__main__":
    main()
