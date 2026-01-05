// ============================================
// JSON-BASED STORAGE (Minimal Image Size)
// ============================================
class JSONStorage {
    constructor() {
        this.baseURL = 'https://api.npoint.io/'; // Free JSON hosting
        this.jsonBins = {
            carousel: 'YOUR_JSONBIN_ID_1',
            works: 'YOUR_JSONBIN_ID_2',
            news: 'YOUR_JSONBIN_ID_3'
        };
    }

    // Generate data structure with minimal image info
    generateItem(type, data) {
        const baseItem = {
            id: Date.now(),
            title: data.title,
            description: data.description,
            createdAt: new Date().toISOString(),
            likes: 0,
            views: 0
        };

        switch(type) {
            case 'carousel':
                return {
                    ...baseItem,
                    // Store only image ID or compressed data
                    image: this.compressImageData(data.image),
                    imageSource: 'unsplash', // or 'local', 'firebase'
                    imageId: data.imageId || null
                };
            
            case 'works':
                return {
                    ...baseItem,
                    student: data.student,
                    grade: data.grade,
                    // Store work as JSON structure, not image
                    workData: data.workData || null,
                    thumbnail: data.thumbnail || null
                };
            
            case 'news':
                return {
                    ...baseItem,
                    author: data.author,
                    category: data.category,
                    // Store content as markdown/plain text
                    content: data.content || '',
                    readTime: data.readTime || '2 min'
                };
            
            default:
                return baseItem;
        }
    }

    // Compress image data to minimal JSON
    compressImageData(imageUrl) {
        // For free hosting, just store the URL
        // For advanced: extract dominant color, dimensions, etc.
        return {
            url: imageUrl,
            // Store placeholder color based on image
            placeholder: this.extractColorPlaceholder(imageUrl),
            dimensions: '1200x400'
        };
    }

    extractColorPlaceholder(imageUrl) {
        // Simple color extraction from URL
        const colors = ['#4A90E2', '#06D6A0', '#EF476F', '#FFD166'];
        const hash = imageUrl.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    }

    // Upload JSON to free hosting (jsonbin.io, npoint.io, etc.)
    async uploadJSON(type, data) {
        try {
            const jsonData = JSON.stringify(data);
            const binId = this.jsonBins[type];
            
            const response = await fetch(`https://api.npoint.io/${binId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonData
            });
            
            return await response.json();
        } catch (error) {
            console.error('JSON upload error:', error);
            // Fallback to localStorage
            localStorage.setItem(`json_${type}`, JSON.stringify(data));
            return { success: true, local: true };
        }
    }

    // Fetch JSON data
    async fetchJSON(type) {
        try {
            const binId = this.jsonBins[type];
            const response = await fetch(`https://api.npoint.io/${binId}`);
            return await response.json();
        } catch (error) {
            console.error('JSON fetch error:', error);
            // Fallback to localStorage
            const localData = localStorage.getItem(`json_${type}`);
            return localData ? JSON.parse(localData) : [];
        }
    }

    // Generate placeholder images with CSS/Canvas
    generatePlaceholder(title, width = 1200, height = 400) {
        // Create a simple colored placeholder with text
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#4A90E2');
        gradient.addColorStop(1, '#06D6A0');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width/2, height/2);
        
        return canvas.toDataURL(); // Returns data URL
    }
}