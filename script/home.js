
// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyCynWgWLMcMf7V5rqWRPR96-2Mc7_JM_kI",
  authDomain: "full-setup955.firebaseapp.com",
  databaseURL: "https://full-setup955-default-rtdb.firebaseio.com",
  projectId: "full-setup955",
  storageBucket: "full-setup955.appspot.com",
  messagingSenderId: "875359285280",
  appId: "1:875359285280:web:49757b6501672dc0f8cc45"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Reference to the "Files" node
const filesRef = ref(database, 'Files');

// Pagination settings
const ITEMS_PER_PAGE = 18;
let currentPage = 1;
let allImages = [];
let filteredImages = [];
let totalPages = 1;
let searchTerm = '';

// Get DOM elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');

// Intersection Observer for lazy loading
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const placeholder = img.previousElementSibling;
            
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                
                img.onload = () => {
                    img.classList.add('loaded');
                    if (placeholder) {
                        placeholder.style.display = 'none';
                    }
                };
                
                img.onerror = () => {
                    handleImageError(img);
                    if (placeholder) {
                        placeholder.style.display = 'none';
                    }
                };
            }
            
            observer.unobserve(img);
        }
    });
}, {
    rootMargin: '50px',
    threshold: 0.01
});

// Function to extract valid links (for details page)
function extractValidLinks(linksData) {
    if (!linksData) return [];
    
    if (Array.isArray(linksData)) {
        return linksData.filter(item => 
            item !== null && 
            typeof item === 'object' && 
            item.link && 
            item.title
        );
    }
    
    if (typeof linksData === 'object' && linksData !== null) {
        return Object.values(linksData).filter(item => 
            item !== null && 
            typeof item === 'object' && 
            item.link && 
            item.title
        );
    }
    
    return [];
}

// Function to navigate to details page
function goToDetails(nodeName, imageUrl, description, linksData) {
    const validLinks = extractValidLinks(linksData);
    
    const params = new URLSearchParams({
        node: nodeName,
        url: imageUrl || '',
        desc: description || 'No description available'
    });
    
    if (validLinks && validLinks.length > 0) {
        params.append('links', encodeURIComponent(JSON.stringify(validLinks)));
    }
    
    window.location.href = `details.html?${params.toString()}`;
}

// Function to handle image loading errors
function handleImageError(imgElement) {
    imgElement.onerror = null;
    imgElement.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23f8d7da\'/%3E%3Ctext x=\'100\' y=\'100\' font-family=\'Arial\' font-size=\'14\' fill=\'%23dc3545\' text-anchor=\'middle\' dy=\'.3em\'%3EError%3C/text%3E%3C/svg%3E';
    imgElement.classList.add('loaded');
}

// Function to create image card (simplified - only image and name)
function createImageCard(imageData, fileName) {
    const card = document.createElement('div');
    card.className = 'image-card';
    
    const imageUrl = imageData && imageData['image-url'] ? imageData['image-url'] : null;
    const description = imageData && imageData['description'] ? imageData['description'] : 'No description available';
    const linksData = imageData && imageData['links'] ? imageData['links'] : null;
    
    card.onclick = () => goToDetails(fileName, imageUrl, description, linksData);
    
    
    // Image container with lazy loading
    const imgContainer = document.createElement('div');
    imgContainer.className = 'image-container';
    
    if (imageUrl) {
        // const placeholder = document.createElement('div');
        // placeholder.className = 'placeholder';
        // imgContainer.appendChild(placeholder);
        
        const img = document.createElement('img');
        img.dataset.src = imageUrl;

        img.alt = fileName;
        img.loading = 'lazy';
        
        imgContainer.appendChild(img);
        
        imageObserver.observe(img);
    } else {
        imgContainer.innerHTML = '<div style="color: #6c757d; text-align: center; padding: 20px;">📷 No Image</div>';
    }
    // Node name only
    const nameDiv = document.createElement('div');
    nameDiv.className = 'node-name';
    nameDiv.textContent = fileName;
    card.appendChild(nameDiv);
    
    
    card.appendChild(imgContainer);
    
    return card;
}

// Function to filter images based on search term
function filterImages() {
    if (!searchTerm.trim()) {
        filteredImages = [...allImages];
    } else {
        const term = searchTerm.toLowerCase().trim();
        filteredImages = allImages.filter(({fileName}) => 
            fileName.toLowerCase().includes(term)
        );
    }
    
    // Reset to first page when searching
    currentPage = 1;
    
    // Recalculate total pages
    totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
    
    // Render the filtered results
    renderCurrentPage();
}

// Function to render current page
function renderCurrentPage() {
    const container = document.getElementById('gallery-container');
    container.innerHTML = '';
    
    if (filteredImages.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <span>🔍</span>
                No content found matching "${searchTerm}"
            </div>
        `;
        document.getElementById('paginationInfo').style.display = 'none';
        updateStats();
        return;
    }
    
    document.getElementById('paginationInfo').style.display = 'flex';
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredImages.length);
    const pageImages = filteredImages.slice(startIndex, endIndex);
    
    pageImages.forEach(({fileName, fileData}) => {
        const card = createImageCard(fileData, fileName);
        container.appendChild(card);
    });
    
    // Update pagination UI
    updatePaginationUI();
    updateStats();
}

// Function to update pagination UI
function updatePaginationUI() {
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageNumbersDiv = document.getElementById('pageNumbers');
    
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages || 1;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    // Generate page numbers
    let pageNumbersHtml = '';
    const maxVisiblePages = window.innerWidth <= 767 ? 3 : 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageNumbersHtml += `<div class="page-number ${i === currentPage ? 'active' : ''}" onclick="window.goToPage(${i})">${i}</div>`;
    }
    
    pageNumbersDiv.innerHTML = pageNumbersHtml;
}

// Function to update statistics (simplified)
function updateStats() {
    const statsElement = document.getElementById('stats');
    
    if (filteredImages.length === 0) {
        statsElement.innerHTML = `No images found`;
        return;
    }
    
    statsElement.innerHTML = `${filteredImages.length} image${filteredImages.length !== 1 ? 's' : ''}`;
}

// Pagination functions
window.goToPage = function(page) {
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderCurrentPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Search functionality
function handleSearchInput() {
    searchTerm = searchInput.value;
    filterImages();
}

function clearSearch() {
    searchInput.value = '';
    searchTerm = '';
    filterImages();
}

// Event listeners
searchInput.addEventListener('input', handleSearchInput);
clearSearchBtn.addEventListener('click', clearSearch);

// Read data from Firebase
onValue(filesRef, (snapshot) => {
    const container = document.getElementById('gallery-container');
    
    const data = snapshot.val();
    
    if (data) {
        // Get all images
        allImages = Object.entries(data).map(([fileName, fileData]) => ({
            fileName,
            fileData
        }));
        
        // Initialize filtered images with all images
        filteredImages = [...allImages];
        
        if (allImages.length > 0) {
            totalPages = Math.ceil(allImages.length / ITEMS_PER_PAGE);
            renderCurrentPage();
        } else {
            container.innerHTML = '<div class="no-images">📭 No images found</div>';
            document.getElementById('stats').innerHTML = 'No images';
            document.getElementById('paginationInfo').style.display = 'none';
        }
    } else {
        container.innerHTML = '<div class="no-images">📭 No data found</div>';
        document.getElementById('stats').innerHTML = 'No data';
        document.getElementById('paginationInfo').style.display = 'none';
    }
}, (error) => {
    console.error('Error reading data:', error);
    const container = document.getElementById('gallery-container');
    
    container.innerHTML = `<div class="no-images error-card">
        ❌ Error loading data
    </div>`;
    
    document.getElementById('stats').innerHTML = 'Error';
    document.getElementById('paginationInfo').style.display = 'none';
});

// Event listeners for pagination buttons
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        window.goToPage(currentPage - 1);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
        window.goToPage(currentPage + 1);
    }
});

// Handle window resize for responsive pagination
window.addEventListener('resize', () => {
    updatePaginationUI();
});
