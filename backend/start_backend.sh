#!/bin/bash

# Navigate to the backend directory (if the script is run from project root)
# CD into the directory where this script resides
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$SCRIPT_DIR" || exit

# Activate the virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Check if activation was successful (optional, but good practice)
if [ $? -ne 0 ]; then
    echo "Error: Failed to activate virtual environment. Exiting."
    exit 1
fi

# Run Gunicorn
echo "Starting Gunicorn on port 5001..."
gunicorn -w 4 -b 0.0.0.0:5001 app:app