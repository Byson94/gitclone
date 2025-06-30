#!/bin/bash

# Exit immediately if any command fails
set -e

# Remove the output directory if it exists
rm -rf out

# Recreate the output directory
mkdir -p out
cd out
ls -a

# Create the SEA config
echo '{ "main": "../main.js", "output": "sea-prep.blob" }' > sea-config.json 

# Prepare the SEA blob
node --experimental-sea-config sea-config.json

# Copy the Node binary
cp "$(command -v node)" gitclone

# Inject the SEA blob into the binary
npx postject gitclone NODE_SEA_BLOB sea-prep.blob \
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
