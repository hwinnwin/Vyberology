#!/bin/bash

# Generate PWA icons from the main icon
# Requires ImageMagick (brew install imagemagick)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ICONS_DIR="$PROJECT_DIR/public/icons"
SOURCE_ICON="$PROJECT_DIR/src-tauri/icons/icon.png"

echo "Generating PWA icons from $SOURCE_ICON..."

# PWA required sizes
SIZES=(16 32 72 96 120 128 144 152 180 192 384 512)

for size in "${SIZES[@]}"; do
  output="$ICONS_DIR/icon-${size}x${size}.png"
  echo "Creating $output..."
  convert "$SOURCE_ICON" -resize ${size}x${size} "$output" 2>/dev/null || \
    sips -z $size $size "$SOURCE_ICON" --out "$output" 2>/dev/null || \
    echo "Warning: Could not create $output (install ImageMagick or use macOS sips)"
done

echo "Done! PWA icons created in $ICONS_DIR"
