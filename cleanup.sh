#!/bin/bash
# Remove the legacy lib directory containing Dart files
rm -rf lib/

# Remove the Flutter configuration file
rm -f pubspec.yaml

echo "Legacy Flutter files have been removed successfully."
