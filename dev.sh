#!/bin/bash

# Development helper script for Google Calendar Extension
# This script provides useful commands for extension development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════╗
║                Google Calendar Extension DevKit              ║
╚══════════════════════════════════════════════════════════════╝${NC}"
}

# Function to validate extension files
validate_extension() {
    print_status "Validating extension files..."
    
    required_files=("manifest.json" "popup.html" "popup.js" "styles.css" "background.js" "options.html" "options.js")
    missing_files=()
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        print_status "✅ All required files are present"
    else
        print_error "❌ Missing files: ${missing_files[*]}"
        return 1
    fi
    
    # Check if icons directory exists
    if [[ ! -d "icons" ]]; then
        print_warning "⚠️  Icons directory not found"
    else
        print_status "✅ Icons directory found"
    fi
    
    # Validate JSON files
    if command -v jq &> /dev/null; then
        if jq empty manifest.json 2>/dev/null; then
            print_status "✅ manifest.json is valid JSON"
        else
            print_error "❌ manifest.json contains invalid JSON"
            return 1
        fi
    else
        print_warning "⚠️  jq not installed, skipping JSON validation"
    fi
}

# Function to check file sizes
check_file_sizes() {
    print_status "Checking file sizes..."
    
    total_size=0
    while IFS= read -r -d '' file; do
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        total_size=$((total_size + size))
        
        # Warn about large files
        if [[ $size -gt 102400 ]]; then  # 100KB
            print_warning "Large file detected: $file ($(numfmt --to=iec $size))"
        fi
    done < <(find . -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" \) -print0)
    
    print_status "Total extension size: $(numfmt --to=iec $total_size)"
    
    if [[ $total_size -gt 2097152 ]]; then  # 2MB
        print_warning "Extension size is over 2MB, consider optimization"
    fi
}

# Function to lint JavaScript files
lint_js() {
    print_status "Checking JavaScript syntax..."
    
    js_files=("popup.js" "background.js" "options.js")
    
    for file in "${js_files[@]}"; do
        if [[ -f "$file" ]]; then
            if node -c "$file" 2>/dev/null; then
                print_status "✅ $file syntax is valid"
            else
                print_error "❌ $file contains syntax errors"
                node -c "$file"
                return 1
            fi
        fi
    done
}

# Function to create a zip package for Chrome Web Store
package_extension() {
    print_status "Creating extension package..."
    
    # Create build directory
    mkdir -p build
    
    # Copy necessary files
    files_to_package=("manifest.json" "popup.html" "popup.js" "styles.css" "background.js" "options.html" "options.js" "README.md")
    
    for file in "${files_to_package[@]}"; do
        if [[ -f "$file" ]]; then
            cp "$file" build/
        fi
    done
    
    # Copy icons directory if it exists
    if [[ -d "icons" ]]; then
        cp -r icons build/
    fi
    
    # Create zip file
    cd build
    zip -r "../google-calendar-extension-$(date +%Y%m%d-%H%M%S).zip" .
    cd ..
    
    # Cleanup
    rm -rf build
    
    print_status "✅ Extension package created successfully"
}

# Function to start development server (if needed)
dev_server() {
    print_status "Starting development environment..."
    
    # Check if Python is available for local server
    if command -v python3 &> /dev/null; then
        print_status "Starting local server on http://localhost:8000"
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        print_status "Starting local server on http://localhost:8000"
        python -m SimpleHTTPServer 8000
    else
        print_warning "Python not found, cannot start local server"
        print_status "You can manually load the extension in Chrome developer mode"
    fi
}

# Function to show extension info
show_info() {
    if [[ -f "manifest.json" ]]; then
        name=$(grep '"name"' manifest.json | cut -d'"' -f4)
        version=$(grep '"version"' manifest.json | cut -d'"' -f4)
        description=$(grep '"description"' manifest.json | cut -d'"' -f4)
        
        echo -e "${BLUE}Extension Info:${NC}"
        echo "  Name: $name"
        echo "  Version: $version"
        echo "  Description: $description"
        echo ""
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  validate     Validate all extension files"
    echo "  check-size   Check file sizes and warn about large files"
    echo "  lint         Check JavaScript syntax"
    echo "  package      Create a zip package for Chrome Web Store"
    echo "  dev          Start development environment"
    echo "  info         Show extension information"
    echo "  all          Run validate, check-size, and lint"
    echo "  help         Show this help message"
    echo ""
}

# Main script logic
main() {
    print_header
    show_info
    
    case "${1:-help}" in
        "validate")
            validate_extension
            ;;
        "check-size")
            check_file_sizes
            ;;
        "lint")
            lint_js
            ;;
        "package")
            validate_extension && lint_js && package_extension
            ;;
        "dev")
            dev_server
            ;;
        "info")
            show_info
            ;;
        "all")
            validate_extension && check_file_sizes && lint_js
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
