// ============================================
// STORAGE MODULE (LocalStorage Backend)
// ============================================
const storage = (function() {
    let isInitialized = false;

    const init = async () => {
        if (isInitialized) return;
        
        // Initialize localStorage data
        const defaultData = {
            users: [
                {
                    id: 1,
                    username: "admin@sekolah.id",
                    email: "admin@sekolah.id",
                    password: "admin123",
                    name: "Administrator",
                    role: "admin"
                },
                {
                    id: 2,
                    username: "guru@sekolah.id",
                    email: "guru@sekolah.id",
                    password: "guru123",
                    name: "Guru Demo",
                    role: "guru"
                },
                {
                    id: 3,
                    username: "ortu@sekolah.id",
                    email: "ortu@sekolah.id",
                    password: "ortu123",
                    name: "Orang Tua Demo",
                    role: "ortu"
                }
            ],
            carousel: [],
            works: [],
            news: [],
            announcements: []
        };

        Object.keys(defaultData).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(defaultData[key]));
            }
        });

        isInitialized = true;
        console.log('Storage initialized');
    };

    const getItems = async (type) => {
        const data = localStorage.getItem(type);
        return data ? JSON.parse(data) : [];
    };

    const createItem = async (type, item) => {
        const items = await getItems(type);
        const newItem = { 
            ...item, 
            id: Date.now() + Math.floor(Math.random() * 1000) 
        };
        items.push(newItem);
        localStorage.setItem(type, JSON.stringify(items));
        return newItem;
    };

    const updateItem = async (type, id, updates) => {
        const items = await getItems(type);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;
        
        items[index] = { ...items[index], ...updates };
        localStorage.setItem(type, JSON.stringify(items));
        return items[index];
    };

    const deleteItem = async (type, id) => {
        const items = await getItems(type);
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(type, JSON.stringify(filtered));
        return true;
    };

    // User management
    const getCurrentUser = async () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    };

    const setCurrentUser = async (user) => {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    };

    const login = async (email, password) => {
        const users = await getItems('users');
        const user = users.find(u => 
            u.email === email && u.password === password
        );
        
        if (user) {
            // Remove password from stored user object
            const { password, ...userWithoutPassword } = user;
            await setCurrentUser(userWithoutPassword);
            return userWithoutPassword;
        }
        throw new Error('Email atau password salah');
    };

    const logout = async () => {
        await setCurrentUser(null);
    };

    return {
        init,
        getItems,
        createItem,
        updateItem,
        deleteItem,
        getCurrentUser,
        setCurrentUser,
        login,
        logout
    };
})();