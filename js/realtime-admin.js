// ============================================
// REAL-TIME ADMIN PANEL
// ============================================
class RealtimeAdminPanel {
    constructor() {
        this.data = {
            carousel: [],
            works: [],
            news: []
        };
        
        this.listeners = [];
        this.init();
    }

    async init() {
        console.log('Initializing real-time admin panel...');
        
        // Start listening to all collections
        this.startListening();
        this.setupEvents();
    }

    startListening() {
        // Listen to carousel updates
        this.listeners.push(
            realtimeStorage.listen('carousel', (data) => {
                this.data.carousel = data;
                this.updateSection('carousel');
                console.log('Carousel updated:', data.length);
            })
        );

        // Listen to works updates
        this.listeners.push(
            realtimeStorage.listen('works', (data) => {
                this.data.works = data;
                this.updateSection('works');
                console.log('Works updated:', data.length);
            })
        );

        // Listen to news updates
        this.listeners.push(
            realtimeStorage.listen('news', (data) => {
                this.data.news = data;
                this.updateSection('news');
                console.log('News updated:', data.length);
            })
        );
    }

    updateSection(section) {
        const container = document.getElementById(`${section}-list`);
        if (!container) return;

        const items = this.data[section];
        
        if (items.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada data</td></tr>';
            return;
        }

        container.innerHTML = items.map(item => `
            <tr data-id="${item.id}">
                <td>${item.id.substring(0, 8)}...</td>
                <td>
                    <strong>${item.title || 'Tidak ada judul'}</strong>
                    ${item.description ? `<br><small>${item.description.substring(0, 50)}...</small>` : ''}
                </td>
                <td>
                    <div class="real-time-stats">
                        <span class="like-count" title="Likes">
                            <i class="fas fa-heart"></i> ${item.likes || 0}
                        </span>
                        <span class="view-count" title="Views">
                            <i class="fas fa-eye"></i> ${item.views || 0}
                        </span>
                    </div>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn-edit" data-id="${item.id}" data-type="${section}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" data-id="${item.id}" data-type="${section}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEvents() {
        // Event delegation for admin actions
        document.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const id = target.dataset.id;
            const type = target.dataset.type;

            if (target.classList.contains('btn-delete')) {
                await this.deleteItem(type, id);
            }
            else if (target.classList.contains('btn-edit')) {
                await this.editItem(type, id);
            }
            else if (target.classList.contains('btn-add')) {
                this.showAddForm(type);
            }
            else if (target.classList.contains('btn-refresh')) {
                this.updateAllSections();
            }
        });
    }

    async deleteItem(type, id) {
        if (!confirm('Yakin ingin menghapus item ini?')) return;
        
        try {
            await realtimeStorage.delete(type, id);
            this.showNotification('Item berhasil dihapus', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            this.showNotification('Gagal menghapus item', 'error');
        }
    }

    async editItem(type, id) {
        const item = this.data[type].find(i => i.id === id);
        if (!item) return;

        this.showEditForm(type, item);
    }

    showAddForm(type) {
        const formHtml = `
            <div class="modal active" id="addModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-plus"></i> Tambah ${type}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addForm" data-type="${type}">
                            <div class="form-group">
                                <label>Judul</label>
                                <input type="text" name="title" required class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Deskripsi</label>
                                <textarea name="description" class="form-control" rows="3"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary btn-cancel">Batal</button>
                                <button type="submit" class="btn-primary">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHtml);
        this.setupFormEvents();
    }

    showEditForm(type, item) {
        const formHtml = `
            <div class="modal active" id="editModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Edit ${type}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editForm" data-type="${type}" data-id="${item.id}">
                            <div class="form-group">
                                <label>Judul</label>
                                <input type="text" name="title" value="${item.title || ''}" required class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Deskripsi</label>
                                <textarea name="description" class="form-control" rows="3">${item.description || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Likes</label>
                                <input type="number" name="likes" value="${item.likes || 0}" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Views</label>
                                <input type="number" name="views" value="${item.views || 0}" class="form-control">
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary btn-cancel">Batal</button>
                                <button type="submit" class="btn-primary">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHtml);
        this.setupFormEvents();
    }

    setupFormEvents() {
        // Close modal
        document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.modal.active')?.remove();
            });
        });

        // Submit forms
        document.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const type = form.dataset.type;
            const id = form.dataset.id;
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Convert numbers
            if (data.likes) data.likes = parseInt(data.likes);
            if (data.views) data.views = parseInt(data.views);
            
            try {
                if (id) {
                    // Update existing
                    await realtimeStorage.set(type, id, data);
                    this.showNotification('Item berhasil diupdate', 'success');
                } else {
                    // Add new
                    data.createdAt = new Date().toISOString();
                    data.likes = data.likes || 0;
                    data.views = data.views || 0;
                    
                    await realtimeStorage.set(type, null, data);
                    this.showNotification('Item berhasil ditambahkan', 'success');
                }
                
                document.querySelector('.modal.active')?.remove();
            } catch (error) {
                console.error('Form error:', error);
                this.showNotification('Gagal menyimpan data', 'error');
            }
        });
    }

    updateAllSections() {
        this.updateSection('carousel');
        this.updateSection('works');
        this.updateSection('news');
        this.showNotification('Data diperbarui', 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    destroy() {
        // Clean up listeners
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}