
// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const nodeName = urlParams.get('node');
const imageUrl = urlParams.get('url');
const description = urlParams.get('desc');

// Get links data (it's URL encoded, so we need to parse it)
let linksArray = [];
const linksParam = urlParams.get('links');

if (linksParam && linksParam !== 'null') {
    try {
        const parsedLinks = JSON.parse(decodeURIComponent(linksParam));
        console.log('Parsed links:', parsedLinks); // For debugging
        
        // Handle Firebase array format with null values
        if (Array.isArray(parsedLinks)) {
            // Filter out null values and keep only valid link objects
            linksArray = parsedLinks.filter(item => 
                item !== null && 
                typeof item === 'object' && 
                item.link && 
                item.title
            );
        } 
        // Handle object format (if it comes as an object with numeric keys)
        else if (typeof parsedLinks === 'object' && parsedLinks !== null) {
            linksArray = Object.values(parsedLinks).filter(item => 
                item !== null && 
                typeof item === 'object' && 
                item.link && 
                item.title
            );
        }
        
        console.log('Filtered links:', linksArray); // For debugging
    } catch (e) {
        console.error('Error parsing links:', e);
        linksArray = [];
    }
}

const container = document.getElementById('details-container');

// Function to generate links HTML
function generateLinksHTML(linksData) {
    if (!linksData || linksData.length === 0) {
        return `
            <div class="links-section">
                <div class="links-label">Links</div>
                <div class="no-links">No links available for this image</div>
            </div>
        `;
    }

    let linksHtml = '';
    
    // Iterate through each valid link object
    linksData.forEach((linkObj, index) => {
        if (linkObj && linkObj.link && linkObj.title) {
            linksHtml += `
                <div class="link-card">
                    
                    <a href="${linkObj.link}" class="link-button" target="_blank" rel="noopener noreferrer">
                        ${linkObj.title}
                    </a>
                </div>
            `;
        }
    });

    if (linksHtml) {
        return `
            <div class="links-section">
                <div class="links-label">Links (${linksData.length})</div>
                <div class="links-grid">
                    ${linksHtml}
                </div>
            </div>
        `;
    } else {
        return `
            <div class="links-section">
                <div class="links-label">Links</div>
                <div class="no-links">No valid links found</div>
            </div>
        `;
    }
}

// Check if we have the required data
if (!nodeName) {
    container.innerHTML = `
        <a href="index.html" class="back-button">← Back to Gallery</a>
        <div class="error-message">
            <h2>Error: No image selected</h2>
            <p>Please go back to the gallery and select an image.</p>
        </div>
    `;
} else {
    // Create the details HTML
    let imageHtml = '';
    if (imageUrl && imageUrl !== 'null') {
        imageHtml = `
            <div class="image-section">
                <div class="image-container">
                    <img src="${imageUrl}" 
                         alt="${nodeName}" 
                         onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f8d7da\'/%3E%3Ctext x=\'200\' y=\'150\' font-family=\'Arial\' font-size=\'16\' fill=\'%23dc3545\' text-anchor=\'middle\'%3EImage Failed to Load%3C/text%3E%3C/svg%3E';">
                </div>
            </div>
        `;
    } else {
        imageHtml = `
            <div class="image-section">
                <div class="image-container" style="background-color: #e9ecef; min-height: 200px;">
                    <div style="color: #6c757d;">No Image Available</div>
                </div>
            </div>
        `;
    }

    // Generate links HTML
    const linksHtml = generateLinksHTML(linksArray);

    container.innerHTML = `
        <a href="index.html" class="back-button">&lt;Back to Gallery</a>
        ${imageHtml}
        <div class="node-name">${nodeName}</div>
        <div class="description-section">
            <div class="description-label">Description</div>
            <div class="description-text">${description || 'No description available'}</div>
        </div>
        ${linksHtml}
        
            `;
}
