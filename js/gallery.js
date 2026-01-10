// Gallery functionality for Firebase integration
document.addEventListener('DOMContentLoaded', function() {
    console.log("Gallery.js loaded");
    
    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // Check if user is logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("User is logged in:", user.email);
            // Enable admin features if needed
        } else {
            console.log("User is not logged in");
        }
    });
    
    // Load gallery images from Firestore
    function loadGalleryImages() {
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (!galleryGrid) return;
        
        db.collection('gallery').orderBy('timestamp', 'desc').limit(20)
            .get()
            .then((querySnapshot) => {
                galleryGrid.innerHTML = '';
                
                if (querySnapshot.empty) {
                    galleryGrid.innerHTML = `
                        <div class="col-span-3 text-center py-12">
                            <i class="fas fa-image text-gray-300 text-5xl mb-4"></i>
                            <p class="text-gray-500">Belum ada gambar di galeri.</p>
                        </div>
                    `;
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const html = `
                        <div class="relative overflow-hidden rounded-lg shadow-lg group cursor-pointer">
                            <img src="${data.imageUrl || 'https://placehold.co/400x300/e5e7eb/6b7280?text=Loading...'}" 
                                 alt="${data.title || 'Gallery image'}"
                                 class="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <div class="text-white">
                                    <h3 class="font-bold">${data.title || 'Untitled'}</h3>
                                    <p class="text-sm opacity-90">${data.description || ''}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    galleryGrid.innerHTML += html;
                });
            })
            .catch((error) => {
                console.error("Error loading gallery:", error);
                galleryGrid.innerHTML = `
                    <div class="col-span-3 text-center py-12">
                        <i class="fas fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
                        <p class="text-gray-500">Gagal memuat galeri. Menggunakan gambar default.</p>
                    </div>
                `;
                // Fallback to local images
                loadFallbackImages();
            });
    }
    
    // Fallback images if Firestore fails
    function loadFallbackImages() {
        const galleryGrid = document.getElementById('galleryGrid');
        if (!galleryGrid) return;
        
        const fallbackImages = [
            { url: 'https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Kaligrafi Arab Klasik' },
            { url: 'https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?ixlib=rb-4.0.3&auto=format&fit=crop&w-600&q=80', title: 'Seni Kaligrafi Modern' },
            { url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Workshop Kaligrafi' },
            { url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Karya Siswa' },
            { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Alat Kaligrafi' },
            { url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', title: 'Exhibition' }
        ];
        
        galleryGrid.innerHTML = '';
        fallbackImages.forEach(img => {
            galleryGrid.innerHTML += `
                <div class="relative overflow-hidden rounded-lg shadow-lg group cursor-pointer">
                    <img src="${img.url}" 
                         alt="${img.title}"
                         class="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div class="text-white">
                            <h3 class="font-bold">${img.title}</h3>
                            <p class="text-sm opacity-90">Koleksi KaligrafiMaster</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // Initialize gallery
    loadGalleryImages();
    
    // Upload functionality (for admin)
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadImage(file);
            }
        });
    }
    
    function uploadImage(file) {
        // Check if user is logged in
        const user = auth.currentUser;
        if (!user) {
            alert('Silakan login terlebih dahulu untuk mengupload gambar.');
            return;
        }
        
        const storageRef = storage.ref(`gallery/${Date.now()}_${file.name}`);
        const uploadTask = storageRef.put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload progress: ' + progress + '%');
            },
            (error) => {
                console.error("Upload error:", error);
                alert('Gagal mengupload gambar: ' + error.message);
            },
            () => {
                // Upload complete
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    // Save to Firestore
                    db.collection('gallery').add({
                        imageUrl: downloadURL,
                        title: prompt("Judul gambar:", "Kaligrafi"),
                        description: prompt("Deskripsi gambar:", "Karya siswa KaligrafiMaster"),
                        uploadedBy: user.email,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        alert('Gambar berhasil diupload!');
                        loadGalleryImages(); // Refresh gallery
                    }).catch((error) => {
                        console.error("Error saving to Firestore:", error);
                        alert('Gambar terupload tapi gagal menyimpan data.');
                    });
                });
            }
        );
    }
});
