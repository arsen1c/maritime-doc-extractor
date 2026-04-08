#!/bin/bash

# Maritime Document Test Suite - Batch Conversion Script
# Converts MD files to PDF and then to images for testing

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Maritime Document Extraction Test Suite                    ║"
echo "║            Batch Conversion Script                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the tests directory
if [ ! -f "README.md" ] || [ ! -d "../src" ]; then
    echo "❌ Error: Please run this script from the /tests directory"
    echo "Usage: cd maritime-doc-extractor/tests && bash convert_documents.sh"
    exit 1
fi

# Check if required tools are installed
check_dependencies() {
    echo "Checking dependencies..."
    
    if ! command -v pandoc &> /dev/null; then
        echo "⚠️  Pandoc not found. Installing..."
        sudo apt-get update && sudo apt-get install -y pandoc
    fi
    
    if ! command -v convert &> /dev/null; then
        echo "⚠️  ImageMagick not found. Installing..."
        sudo apt-get update && sudo apt-get install -y imagemagick
    fi
    
    if ! command -v gs &> /dev/null; then
        echo "⚠️  Ghostscript not found. Installing..."
        sudo apt-get update && sudo apt-get install -y ghostscript
    fi
    
    if ! command -v identify &> /dev/null; then
        echo "⚠️  ImageMagick identify tool not found. Installing..."
        sudo apt-get update && sudo apt-get install -y imagemagick
    fi
    
    echo "✓ All dependencies available"
}

# Convert MD to PDF
convert_md_to_pdf() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "Step 1: Converting Markdown files to PDF"
    echo "═══════════════════════════════════════════════════════════════"
    
    pdf_count=0
    
    for file in [0-9][0-9]_*.md; do
        if [ -f "$file" ]; then
            pdf_name="${file%.md}.pdf"
            echo "  → Converting: $file → $pdf_name"
            
            if pandoc "$file" -o "$pdf_name" 2>/dev/null; then
                echo "    ✓ Success"
                ((pdf_count++))
            else
                echo "    ✗ Failed to convert $file"
            fi
        fi
    done
    
    echo ""
    echo "Total PDFs created: $pdf_count / 12"
}

# Convert PDF to PNG images
convert_pdf_to_images() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "Step 2: Converting PDF files to PNG images (300 DPI)"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "This may take a few minutes depending on system speed..."
    echo ""
    
    image_count=0
    
    for pdf_file in [0-9][0-9]_*.pdf; do
        if [ -f "$pdf_file" ]; then
            base_name="${pdf_file%.pdf}"
            echo "  → Converting: $pdf_file"
            
            if convert -density 300 "$pdf_file" -quality 85 "${base_name}.png" 2>/dev/null; then
                # Count generated images
                image_variants=$(ls "${base_name}"-[0-9]*.png 2>/dev/null | wc -l)
                if [ $image_variants -eq 0 ]; then
                    # Single page document
                    image_variants=$(ls "${base_name}.png" 2>/dev/null | wc -l)
                fi
                echo "    ✓ Success - Generated image(s)"
                ((image_count++))
            else
                echo "    ✗ Failed to convert $pdf_file"
            fi
        fi
    done
    
    echo ""
    echo "Total PDFs converted to images: $image_count / 12"
}

# Create output summary
create_summary() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "Conversion Summary"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    md_count=$(ls -1 [0-9][0-9]_*.md 2>/dev/null | wc -l)
    pdf_count=$(ls -1 [0-9][0-9]_*.pdf 2>/dev/null | wc -l)
    png_count=$(ls -1 [0-9][0-9]_*.png 2>/dev/null | wc -l)
    
    echo "  Markdown files:  $md_count / 12"
    echo "  PDF files:       $pdf_count / 12"
    echo "  Image files:     $png_count +"
    echo ""
    
    if [ "$pdf_count" -eq 12 ]; then
        echo "✓ PDF conversion: COMPLETE"
    else
        echo "✗ PDF conversion: INCOMPLETE ($pdf_count of 12)"
    fi
    
    if [ "$png_count" -gt 0 ]; then
        echo "✓ Image conversion: COMPLETE"
    else
        echo "✗ Image conversion: INCOMPLETE (No images found)"
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "Conversion Process Complete!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Your test documents are ready to use:"
    echo "  • PDF documents: Ready for upload to /api/extract endpoint"
    echo "  • PNG images: Ready for visual inspection or alternative format tests"
    echo ""
    echo "Next steps:"
    echo "  1. Review README.md for testing guidelines"
    echo "  2. Use TEST_SCENARIOS.md to plan your tests"
    echo "  3. Upload PDFs/images to the maritime app API"
    echo "  4. Verify extraction accuracy"
    echo ""
}

# Main execution
main() {
    check_dependencies
    convert_md_to_pdf
    convert_pdf_to_images
    create_summary
}

# Run main function
main

echo "Script completed!"
