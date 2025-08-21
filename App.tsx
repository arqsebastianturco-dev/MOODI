import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { INITIAL_USERS, INITIAL_MATERIALS, INITIAL_PRODUCTS, INITIAL_QUOTES, INITIAL_SETTINGS, INITIAL_VOUCHERS, INITIAL_RECEIPTS } from './constants.ts';
import { User, Material, Product, Quote, Settings, UserRole, QuoteStatus, ProductMaterial, QuoteItem, Voucher, Receipt, ReceiptStatus } from './types.ts';
import { formatCurrency, generateCode, getStatusClasses } from './utils/helpers.ts';
import { 
    exportMaterialsToCsv, exportMaterialsToPdf, exportProductsToCsv, exportProductsToPdf, 
    generateQuotePdf, generateTaskOrderPackage, generateCataloguePdf, generateVoucherReceiptPdf,
    generateMoneyReceiptPdf, generateModuleReportPdf, exportModuleReportToCsv, exportModuleToSketchup
} from './services/exportService.ts';
import { calculateModule, CalculationResult, MaterialSummary } from './utils/moduleCalculator.ts';


// --- TYPE DEFINITIONS FOR CONTEXT ---
interface AppContextType {
    // State
    users: User[];
    currentUser: User | null;
    materials: Material[];
    products: Product[];
    quotes: Quote[];
    vouchers: Voucher[];
    receipts: Receipt[];
    settings: Settings;
    nextQuoteId: number;
    toast: { message: string; type: 'success' | 'error' } | null;
    completedTasks: Set<string>;
    quoteToDuplicate: Quote | null;

    // Actions
    login: (username: string, password: string) => boolean;
    logout: () => void;
    addUser: (user: User) => boolean;
    deleteUser: (username: string) => void;
    saveMaterial: (material: Omit<Material, 'id' | 'lastUpdated'> & { id?: string }) => void;
    deleteMaterial: (id: string) => void;
    saveProduct: (product: Omit<Product, 'id' | 'cost'> & { id?: string }, totalCost: number) => void;
    deleteProduct: (id: string) => void;
    saveQuote: (quote: Omit<Quote, 'id'>, quoteIdToUpdate?: number) => void;
    updateQuoteStatus: (id: number, status: QuoteStatus) => void;
    updateQuoteDeliveryDate: (id: number, date: string) => void;
    addVoucher: (voucher: Omit<Voucher, 'id'>) => void;
    deleteVoucher: (id: string) => void;
    updateVoucher: (voucherId: string, updates: Partial<Voucher>) => void;
    addReceipt: (receipt: Omit<Receipt, 'id' | 'status' | 'annulmentDate' | 'annulmentReason'>) => Receipt;
    updateReceipt: (receiptId: string, updates: Partial<Receipt>) => void;
    getQuoteForDuplication: (id: number) => Quote | undefined;
    saveSettings: (settings: Settings) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
    updateProductCosts: () => void;
    updateMaterialPrices: (type: string, percentage: number) => void;
    toggleTaskCompletion: (taskId: string) => void;
    setQuoteToDuplicate: (quote: Quote | null) => void;
    downloadBackup: () => void;
    restoreBackup: (file: File) => void;
}

// --- APP CONTEXT ---
const AppContext = createContext<AppContextType | undefined>(undefined);

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};


// --- APP PROVIDER ---
const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- STATE INITIALIZATION ---
    const loadState = () => {
        try {
            const serializedState = localStorage.getItem('moodiGestionState');
            if (serializedState === null) return null;
            return JSON.parse(serializedState);
        } catch (err) {
            console.error("Error loading state from localStorage:", err);
            return null;
        }
    };
    
    const savedState = loadState();

    const [users, setUsers] = useState<User[]>(savedState?.users || INITIAL_USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [materials, setMaterials] = useState<Material[]>(savedState?.materials || INITIAL_MATERIALS);
    const [products, setProducts] = useState<Product[]>(savedState?.products || INITIAL_PRODUCTS);
    const [quotes, setQuotes] = useState<Quote[]>(savedState?.quotes || INITIAL_QUOTES);
    const [vouchers, setVouchers] = useState<Voucher[]>(savedState?.vouchers || INITIAL_VOUCHERS);
    const [receipts, setReceipts] = useState<Receipt[]>(savedState?.receipts || INITIAL_RECEIPTS);
    const [settings, setSettings] = useState<Settings>(savedState?.settings || INITIAL_SETTINGS);
    const [nextQuoteId, setNextQuoteId] = useState<number>(savedState?.nextQuoteId || INITIAL_QUOTES.length + 1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set(savedState?.completedTasks || []));
    const [quoteToDuplicate, setQuoteToDuplicate] = useState<Quote | null>(null);


    // --- Automatic Save to LocalStorage on Change ---
    useEffect(() => {
        try {
            const stateToSave = {
                users, materials, products, quotes, vouchers, receipts, settings, nextQuoteId, 
                completedTasks: Array.from(completedTasks) // Convert Set to Array for JSON
            };
            const serializedState = JSON.stringify(stateToSave);
            localStorage.setItem('moodiGestionState', serializedState);
        } catch (err) {
            console.error("Error saving state to localStorage:", err);
        }
    }, [users, materials, products, quotes, vouchers, receipts, settings, nextQuoteId, completedTasks]);


    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const login = (username: string, password: string): boolean => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };
    
    const logout = () => setCurrentUser(null);
    
    const addUser = (user: User) => {
        if (users.some(u => u.username === user.username)) {
            showToast('El nombre de usuario ya existe.', 'error');
            return false;
        }
        setUsers(prev => [...prev, user]);
        showToast('Usuario agregado correctamente.');
        return true;
    };
    
    const deleteUser = (username: string) => {
        if (username === 'admin') {
            showToast('No se puede eliminar al usuario administrador.', 'error');
            return;
        }
        setUsers(prev => prev.filter(u => u.username !== username));
        showToast('Usuario eliminado.', 'error');
    };

    const updateProductCosts = useCallback(() => {
        setProducts(prevProducts => prevProducts.map(prod => {
            let materialCost = 0;
            prod.materials.forEach(mat => {
                const materialData = materials.find(m => m.id === mat.materialId);
                if (materialData) {
                    materialCost += materialData.price * mat.quantity;
                }
            });
            const newCost = materialCost * (1 + prod.laborPercent / 100);
            return { ...prod, cost: newCost };
        }));
    }, [materials]);

    useEffect(() => {
        updateProductCosts();
    }, [materials, updateProductCosts]);


    const saveMaterial = (materialData: Omit<Material, 'id' | 'lastUpdated'> & { id?: string }) => {
        setMaterials(prev => {
            if (materialData.id) {
                return prev.map(m => m.id === materialData.id ? { ...m, ...materialData, lastUpdated: new Date().toISOString() } : m);
            } else {
                return [...prev, { ...materialData, id: `mat-${Date.now()}`, lastUpdated: new Date().toISOString() }];
            }
        });
        showToast(`Material ${materialData.id ? 'actualizado' : 'agregado'} correctamente.`);
    };

    const deleteMaterial = (id: string) => {
        setMaterials(prev => prev.filter(m => m.id !== id));
        showToast('Material eliminado.', 'error');
    };

    const saveProduct = (productData: Omit<Product, 'id' | 'cost'> & { id?: string }, totalCost: number) => {
        setProducts(prev => {
            if (productData.id) {
                return prev.map(p => p.id === productData.id ? { ...p, ...productData, cost: totalCost } : p);
            } else {
                return [...prev, { ...productData, id: `prod-${Date.now()}`, cost: totalCost }];
            }
        });
        showToast(`Producto ${productData.id ? 'actualizado' : 'creado'}.`);
    };

    const deleteProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        showToast('Producto eliminado.', 'error');
    };

    const saveQuote = (quoteData: Omit<Quote, 'id'>, quoteIdToUpdate?: number) => {
        if (quoteIdToUpdate) {
            setQuotes(prev => prev.map(q => q.id === quoteIdToUpdate ? { ...q, ...quoteData } : q));
            showToast(`Presupuesto Nº${String(quoteIdToUpdate).padStart(5, '0')} actualizado.`);
        } else {
            const newQuote = { ...quoteData, id: nextQuoteId };
            setQuotes(prev => [...prev, newQuote]);
            setNextQuoteId(prev => prev + 1);
            showToast(`Presupuesto Nº${String(newQuote.id).padStart(5, '0')} guardado.`);
        }
    };

    const updateQuoteStatus = (id: number, status: QuoteStatus) => {
        setQuotes(prev => prev.map(q => {
            if (q.id === id) {
                const updatedQuote = { ...q, status };
                if (status === QuoteStatus.Aprobado && !q.approvalDate) {
                    updatedQuote.approvalDate = new Date().toISOString();
                }
                return updatedQuote;
            }
            return q;
        }));
        showToast('Estado del presupuesto actualizado.');
    };
    
    const updateQuoteDeliveryDate = (id: number, date: string) => {
        setQuotes(prev => prev.map(q => q.id === id ? { ...q, estimatedDeliveryDate: date } : q));
        showToast('Fecha de entrega actualizada.');
    };

    const addVoucher = (voucher: Omit<Voucher, 'id'>) => {
        const newVoucher = { ...voucher, id: `vch-${Date.now()}` };
        setVouchers(prev => [...prev, newVoucher]);
        showToast('Comprobante agregado correctamente.');
    };

    const deleteVoucher = (id: string) => {
        setVouchers(prev => prev.filter(v => v.id !== id));
        showToast('Comprobante eliminado.', 'error');
    };
    
    const updateVoucher = (voucherId: string, updates: Partial<Voucher>) => {
        setVouchers(prev => prev.map(v => 
            v.id === voucherId ? { ...v, ...updates } : v
        ));
        showToast('Comprobante actualizado.');
    };

    const addReceipt = (receipt: Omit<Receipt, 'id' | 'status' | 'annulmentDate' | 'annulmentReason'>): Receipt => {
        const newReceipt: Receipt = { 
            ...receipt, 
            id: `rec-${Date.now()}`,
            status: ReceiptStatus.Active,
        };
        setReceipts(prev => [...prev, newReceipt]);
        showToast('Recibo guardado correctamente.');
        return newReceipt;
    };

    const updateReceipt = (receiptId: string, updates: Partial<Receipt>) => {
        setReceipts(prev => prev.map(r => {
            if (r.id === receiptId) {
                return { ...r, ...updates };
            }
            return r;
        }));
        showToast('Recibo actualizado.');
    };

    const getQuoteForDuplication = (id: number) => quotes.find(q => q.id === id);
    
    const saveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        showToast('Configuración guardada correctamente.');
    };

    const updateMaterialPrices = (type: string, percentage: number) => {
        setMaterials(prev => {
            const updatedMaterials = prev.map(material => {
                if (type === 'all' || material.type === type) {
                    const newCommercialPrice = material.commercialPrice * (1 + percentage / 100);
                    const newPrice = material.unitsPerCommercialUnit > 0 ? newCommercialPrice / material.unitsPerCommercialUnit : 0;
                    return {
                        ...material,
                        commercialPrice: newCommercialPrice,
                        price: newPrice,
                        lastUpdated: new Date().toISOString()
                    };
                }
                return material;
            });
            return updatedMaterials;
        });
        showToast(`Precios para ${type === 'all' ? 'todos los materiales' : `tipo '${type}'`} actualizados en un ${percentage}%.`);
    };

    const toggleTaskCompletion = (taskId: string) => {
        setCompletedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };
    
    const downloadBackup = () => {
        const stateToSave = {
            users, materials, products, quotes, vouchers, receipts, settings, nextQuoteId, 
            completedTasks: Array.from(completedTasks)
        };
        const blob = new Blob([JSON.stringify(stateToSave, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `backup-moodi-gestion-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Copia de seguridad descargada.');
    };

    const restoreBackup = (file: File) => {
        if (!window.confirm("ADVERTENCIA: Esta acción reemplazará todos los datos actuales de la aplicación con el contenido del archivo de respaldo. ¿Está seguro de que desea continuar?")) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const restoredState = JSON.parse(event.target?.result as string);
                
                if (!restoredState.materials || !restoredState.products || !restoredState.quotes) {
                    throw new Error("Archivo de respaldo inválido o corrupto.");
                }

                setUsers(restoredState.users || INITIAL_USERS);
                setMaterials(restoredState.materials || INITIAL_MATERIALS);
                setProducts(restoredState.products || INITIAL_PRODUCTS);
                setQuotes(restoredState.quotes || INITIAL_QUOTES);
                setVouchers(restoredState.vouchers || INITIAL_VOUCHERS);
                setReceipts(restoredState.receipts || INITIAL_RECEIPTS);
                setSettings(restoredState.settings || INITIAL_SETTINGS);
                setNextQuoteId(restoredState.nextQuoteId || (restoredState.quotes?.length || 0) + 1);
                setCompletedTasks(new Set(restoredState.completedTasks || []));

                showToast('Restauración completada exitosamente.');
            } catch (err) {
                console.error("Error restoring backup:", err);
                showToast(err instanceof Error ? err.message : 'Error al restaurar la copia.', 'error');
            }
        };
        reader.readAsText(file);
    };


    const value = {
        users, currentUser, materials, products, quotes, vouchers, receipts, settings, nextQuoteId, toast, completedTasks, quoteToDuplicate,
        login, logout, addUser, deleteUser, saveMaterial, deleteMaterial, saveProduct, deleteProduct,
        saveQuote, updateQuoteStatus, updateQuoteDeliveryDate, addVoucher, deleteVoucher, updateVoucher, addReceipt, updateReceipt, getQuoteForDuplication,
        saveSettings, showToast, updateProductCosts, updateMaterialPrices, toggleTaskCompletion, setQuoteToDuplicate,
        downloadBackup, restoreBackup,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- HELPER & UI COMPONENTS ---

const Toast: React.FC = () => {
    const { toast } = useAppContext();
    if (!toast) return null;

    const bgColor = toast.type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-lg transition-opacity duration-300 ${bgColor}`}>
            <p>{toast.message}</p>
        </div>
    );
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, children, title, size = 'lg' }) => {
    if (!isOpen) return null;
    
    const sizeClasses = {
        sm: 'md:w-1/3',
        md: 'md:w-1/2',
        lg: 'md:w-2/3',
        xl: 'md:w-5/6'
    }[size];

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-11/12 ${sizeClasses} max-h-[90vh] overflow-y-auto z-50`}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 className="text-2xl font-bold">{title}</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                    </div>
                    {children}
                </div>
            </div>
        </>
    );
};

// --- AUTHENTICATION COMPONENT ---
const LoginScreen: React.FC = () => {
    const { login } = useAppContext();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!login(username, password)) {
            setError('Usuario o contraseña incorrectos.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar sesión en el sistema
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">Usuario</label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Usuario (ej: admin, ventas, taller)"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Contraseña (ej: admin, ventas, taller)"
                            />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Ingresar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN LAYOUT COMPONENTS ---
const Header: React.FC = () => {
    const { currentUser, logout } = useAppContext();
    return (
        <header className="mb-8 flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-bold text-gray-900">MOODI Gestion</h1>
                <p className="text-lg text-gray-600 mt-1">Administra materiales, productos y presupuestos de forma centralizada.</p>
            </div>
            <div>
                {currentUser && <span className="text-sm text-gray-600 mr-4">Usuario: {currentUser.username} (Rol: {currentUser.role})</span>}
                <button onClick={logout} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium">Cerrar Sesión</button>
            </div>
        </header>
    );
};

const Tabs: React.FC<{ activeTab: string; setActiveTab: (tabId: string) => void }> = ({ activeTab, setActiveTab }) => {
    const { currentUser } = useAppContext();
    
    const allTabs = [
        { id: 'catalogo', label: 'Catálogo', roles: [UserRole.Admin, UserRole.Ventas, UserRole.Taller] },
        { id: 'materiales', label: 'Materiales', roles: [UserRole.Admin, UserRole.Taller] },
        { id: 'productos', label: 'Productos Compuestos', roles: [UserRole.Admin, UserRole.Ventas, UserRole.Taller] },
        { id: 'calculadora', label: 'Cómputo Rápido', roles: [UserRole.Admin, UserRole.Ventas, UserRole.Taller] },
        { id: 'presupuesto', label: 'Generar Presupuesto', roles: [UserRole.Admin, UserRole.Ventas] },
        { id: 'en-proceso', label: 'Trabajos en Proceso', roles: [UserRole.Admin, UserRole.Ventas, UserRole.Taller] },
        { id: 'historial', label: 'Historial', roles: [UserRole.Admin, UserRole.Ventas] },
        { id: 'calendario', label: 'Calendario y Tareas', roles: [UserRole.Admin, UserRole.Ventas, UserRole.Taller] },
        { id: 'configuracion', label: 'Configuración', roles: [UserRole.Admin] }
    ];

    const visibleTabs = useMemo(() => {
        if (!currentUser) return [];
        return allTabs.filter(tab => tab.roles.includes(currentUser.role));
    }, [currentUser]);

    return (
        <div className="mb-6 border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
                {visibleTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-6 block hover:text-blue-600 focus:outline-none font-medium ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};

// --- TAB CONTENT COMPONENTS ---

// --- SettingsTab ---
const SettingsTab: React.FC = () => {
    const { settings, saveSettings, users, addUser, deleteUser, showToast, downloadBackup, restoreBackup } = useAppContext();
    const [formState, setFormState] = useState(settings);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: UserRole.Ventas });
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormState(p => ({ ...p, logoUrl: event.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSettingsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveSettings(formState);
    };

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) {
            showToast('Nombre de usuario y contraseña son obligatorios.', 'error');
            return;
        }
        if (addUser({ ...newUser })) {
            setNewUser({ username: '', password: '', role: UserRole.Ventas });
        }
    };

    const handleDeleteUser = (username: string) => {
        if (window.confirm(`¿Está seguro que desea eliminar al usuario '${username}'?`)) {
            deleteUser(username);
        }
    };

    const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/json') {
            setRestoreFile(file);
        } else {
            if (file) showToast('Por favor, seleccione un archivo .json válido.', 'error');
            setRestoreFile(null);
            e.target.value = ''; // Reset file input
        }
    };

    const handleRestore = () => {
        if (restoreFile) {
            restoreBackup(restoreFile);
            setRestoreFile(null);
             // Manually reset the file input element if possible, needs a ref or form reset.
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Configuración de la Empresa</h2>
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nombre de la Empresa</label>
                        <input type="text" name="companyName" value={formState.companyName} onChange={handleSettingsChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Logo</label>
                        {formState.logoUrl && <img src={formState.logoUrl} alt="logo" className="h-16 mb-2" />}
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Dirección</label>
                        <input type="text" name="address" value={formState.address} onChange={handleSettingsChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Teléfono</label>
                        <input type="text" name="phone" value={formState.phone} onChange={handleSettingsChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input type="email" name="email" value={formState.email} onChange={handleSettingsChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Sitio Web</label>
                        <input type="text" name="website" value={formState.website} onChange={handleSettingsChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Guardar Configuración</button>
                </form>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
                <form onSubmit={handleAddUser} className="flex items-end gap-2 mb-4 p-3 bg-gray-50 rounded-md">
                    <div>
                        <label className="block text-sm font-medium">Usuario</label>
                        <input type="text" name="username" value={newUser.username} onChange={handleUserChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Contraseña</label>
                        <input type="password" name="password" value={newUser.password} onChange={handleUserChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Rol</label>
                        <select name="role" value={newUser.role} onChange={handleUserChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm">Añadir</button>
                </form>
                 <div className="overflow-x-auto border rounded-md">
                     <table className="min-w-full text-sm">
                         <thead className="bg-gray-100"><tr className="text-left"><th className="p-2">Usuario</th><th className="p-2">Rol</th><th className="p-2">Acción</th></tr></thead>
                         <tbody className="divide-y">
                             {users.map(user => (
                                 <tr key={user.username}>
                                     <td className="p-2">{user.username}</td>
                                     <td className="p-2">{user.role}</td>
                                     <td className="p-2">
                                        <button onClick={() => handleDeleteUser(user.username)} className="text-red-600 hover:underline" disabled={user.username === 'admin'}>Eliminar</button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">Copia de Seguridad y Restauración</h2>
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800">Descargar Copia de Seguridad</h3>
                        <p className="text-sm text-gray-600 my-2">Guarde todos los datos actuales de la aplicación (materiales, productos, presupuestos, etc.) en un único archivo JSON. Se recomienda hacer esto periódicamente.</p>
                        <button onClick={downloadBackup} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
                            Descargar Backup
                        </button>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h3 className="font-semibold text-red-800">Restaurar desde Copia de Seguridad</h3>
                        <p className="text-sm text-gray-600 my-2">
                            <span className="font-bold">¡Atención!</span> Esta acción reemplazará permanentemente todos los datos actuales con los del archivo seleccionado. La página se recargará después de la restauración.
                        </p>
                        <div className="flex items-center gap-2">
                            <input type="file" accept=".json" onChange={handleRestoreFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"/>
                            <button onClick={handleRestore} disabled={!restoreFile} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium disabled:bg-red-300 disabled:cursor-not-allowed">
                                Restaurar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SaveModuleAsProductModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    calculationResult: CalculationResult;
    moduleInfo: {
        moduleType: string;
        dimensions: { width: number; height: number; depth: number };
        moduleTypes: { [key:string]: string };
    };
}> = ({ isOpen, onClose, calculationResult, moduleInfo }) => {
    const { products, saveProduct, materials: allMaterials, showToast } = useAppContext();

    const [productData, setProductData] = useState({
        name: '',
        description: '',
        type: 'Mueble',
        laborPercent: 100,
        showInCatalogue: false,
        code: '',
    });

    const materialCost = useMemo(() => {
        if (!calculationResult) return 0;
        return calculationResult.materials.reduce((total, matSummary) => {
            const materialInfo = allMaterials.find(m => m.id === matSummary.materialId);
            return total + (materialInfo ? materialInfo.price * matSummary.quantity : 0);
        }, 0);
    }, [calculationResult, allMaterials]);

    const totalCost = useMemo(() => {
        return materialCost * (1 + productData.laborPercent / 100);
    }, [materialCost, productData.laborPercent]);
    
    useEffect(() => {
        if (isOpen && moduleInfo) {
            const { moduleType, dimensions, moduleTypes } = moduleInfo;
            const readableModuleType = moduleTypes[moduleType] || moduleType;
            
            const initialType = (
                moduleType.includes('mesada') || moduleType.includes('alacena') || moduleType.includes('columna') ? 'Cocina' :
                moduleType.includes('placard') || moduleType.includes('cama') ? 'Dormitorio' :
                moduleType.includes('vanitory') ? 'Baño' : 
                moduleType.includes('rack') || moduleType.includes('mesa') || moduleType.includes('escritorio') ? 'Living' : 'Mueble'
            );

            setProductData({
                name: `${readableModuleType} ${dimensions.width}x${dimensions.height}`,
                description: `Módulo de ${readableModuleType.toLowerCase()} de ${dimensions.width}mm de ancho, ${dimensions.height}mm de alto y ${dimensions.depth}mm de profundidad. Generado desde Cómputo Rápido.`,
                type: initialType,
                laborPercent: 100,
                showInCatalogue: false,
                code: generateCode(initialType, products),
            });
        }
    }, [isOpen, moduleInfo, products]);

    useEffect(() => {
        setProductData(prev => ({
            ...prev,
            code: generateCode(prev.type, products)
        }));
    }, [productData.type, products]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
             setProductData(p => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setProductData(p => ({ ...p, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newProductData = {
            name: productData.name,
            description: productData.description,
            code: productData.code,
            type: productData.type,
            laborPercent: Number(productData.laborPercent),
            imageUrl: null,
            planPdfUrl: null,
            planPdfFilename: null,
            showInCatalogue: productData.showInCatalogue,
            materials: calculationResult.materials.map(({ materialId, quantity }) => ({ materialId, quantity })),
        };
        
        saveProduct(newProductData, totalCost);
        showToast(`Producto '${productData.name}' creado desde el cómputo.`, 'success');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Guardar Módulo como Producto Compuesto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-600">Se creará un nuevo producto compuesto con los materiales calculados. Puede ajustar los detalles a continuación.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                        <input type="text" name="name" value={productData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea name="description" value={productData.description} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <input type="text" name="type" value={productData.type} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Código (Automático)</label>
                        <input type="text" name="code" value={productData.code} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100" readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Costo Materiales</label>
                        <input type="text" value={formatCurrency(materialCost)} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100" readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">% Mano de Obra</label>
                        <input type="number" name="laborPercent" value={productData.laborPercent} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-900">Costo Final Producto (Calculado)</label>
                        <input type="text" value={formatCurrency(totalCost)} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-lg font-semibold" readOnly />
                    </div>
                    <div className="md:col-span-2 flex items-center">
                        <input type="checkbox" id="showInCatalogue" name="showInCatalogue" checked={productData.showInCatalogue} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="showInCatalogue" className="ml-2 block text-sm text-gray-900">Mostrar en Catálogo público</label>
                    </div>
                </div>

                <div className="flex justify-end pt-5 space-x-3 border-t">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Guardar Producto</button>
                </div>
            </form>
        </Modal>
    );
};

const ModuleCalculatorTab: React.FC = () => {
    const { materials: allMaterials, showToast } = useAppContext();
    
    const moduleTypes = {
        'bajo-mesada': 'Bajo Mesada',
        'bajo-mesada-esquinero': 'Bajo Mesada Esquinero',
        'alacena': 'Alacena',
        'alacena-esquinera': 'Alacena Esquinera',
        'placard': 'Placard / Ropero',
        'columna-horno': 'Columna de Horno',
        'vanitory-colgante': 'Vanitory Colgante',
        'cajonera': 'Cajonera',
        'rack-tv': 'Rack de TV',
        'escritorio': 'Escritorio',
        'cama-cajones': 'Cama con Cajones',
        'zapatero': 'Zapatero',
        'mesa': 'Mesa',
        'respaldo-cama': 'Respaldo de Cama',
        'cuna-bebe': 'Cuna para Bebé',
        'porta-microondas': 'Porta Microondas',
        'estacion-trabajo': 'Estación de Trabajo',
        'barra-atencion': 'Barra de Atención al Público',
    };

    const [moduleType, setModuleType] = useState<string>('bajo-mesada');
    const [dimensions, setDimensions] = useState({ width: 800, height: 720, depth: 580 });
    const [config, setConfig] = useState({ doors: 2, drawers: 0, shelves: 1, divisions: 0, hangingRods: 0 });
    const [selectedComponentIds, setSelectedComponentIds] = useState({ 
        structural: allMaterials.find(m => m.description.includes('Melamina Blanca 18mm'))?.id || '',
        visible: allMaterials.find(m => m.description.includes('Paraíso 18mm'))?.id || allMaterials[0]?.id || '',
        back: allMaterials.find(m => m.description.includes('3mm'))?.id || '',
        edge: allMaterials.find(m => m.type === 'Tapacanto')?.id || '',
        drawer: allMaterials.find(m => m.description.includes('Melamina Blanca 18mm'))?.id || '',
        hinge: allMaterials.find(m => m.description.toLowerCase().includes('bisagra'))?.id || '',
        slide: allMaterials.find(m => m.description.toLowerCase().includes('corredera'))?.id || '',
        hangingRod: allMaterials.find(m => m.description.toLowerCase().includes('barral'))?.id || '',
        hangingRodSupport: allMaterials.find(m => m.description.toLowerCase().includes('soporte lateral para barral'))?.id || '',
        screwFix50: allMaterials.find(m => m.code === 'TOR-001')?.id || '',
        screwFix30: allMaterials.find(m => m.code === 'TOR-002')?.id || '',
        woodGlue: allMaterials.find(m => m.code === 'ADH-001')?.id || '',
        packagingFilm: allMaterials.find(m => m.code === 'EMB-001')?.id || '',
        handle: allMaterials.find(m => m.code === 'HER-004')?.id || '',
        glassDoorProfile: allMaterials.find(m => m.code === 'PER-BRO-001')?.id || '',
        glassPanel: allMaterials.find(m => m.code === 'VID-001')?.id || '',
    });
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [additionalHardware, setAdditionalHardware] = useState<{ materialId: string; quantity: number }[]>([]);
    const [selectedHardware, setSelectedHardware] = useState('');
    const [hardwareQty, setHardwareQty] = useState(1);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isOpenModule, setIsOpenModule] = useState(false);
    const [doorType, setDoorType] = useState<'board' | 'glass'>('board');
    
    useEffect(() => {
        if (moduleType === 'placard') {
            setDimensions({ width: 1800, height: 2200, depth: 550 });
            setConfig({ doors: 2, drawers: 4, shelves: 4, divisions: 1, hangingRods: 2 });
        } else if (moduleType === 'rack-tv') {
            setDimensions({ width: 1600, height: 500, depth: 400 });
            setConfig({ doors: 2, drawers: 1, shelves: 1, divisions: 1, hangingRods: 0 });
        } else if (moduleType === 'escritorio') {
            setDimensions({ width: 1200, height: 750, depth: 600 });
            setConfig({ doors: 0, drawers: 0, shelves: 0, divisions: 0, hangingRods: 0 });
        } else if (moduleType === 'cama-cajones') {
            // Para colchon de 140cm
            setDimensions({ width: 1400, height: 350, depth: 1900 });
            setConfig({ doors: 0, drawers: 4, shelves: 0, divisions: 1, hangingRods: 0 });
        } else if (moduleType === 'zapatero') {
            setDimensions({ width: 800, height: 1200, depth: 350 });
            setConfig({ doors: 2, drawers: 0, shelves: 5, divisions: 0, hangingRods: 0 });
        } else if (moduleType === 'mesa') {
            setDimensions({ width: 1400, height: 750, depth: 800 });
            setConfig({ doors: 0, drawers: 0, shelves: 0, divisions: 0, hangingRods: 0 });
        } else if (moduleType === 'bajo-mesada-esquinero') {
            setDimensions({ width: 900, height: 720, depth: 900 });
            setConfig({ doors: 2, drawers: 0, shelves: 1, divisions: 0, hangingRods: 0 });
        } else if (moduleType === 'alacena-esquinera') {
            setDimensions({ width: 600, height: 720, depth: 600 });
            setConfig({ doors: 2, drawers: 0, shelves: 2, divisions: 0, hangingRods: 0 });
        } else if (moduleType === 'respaldo-cama') {
            setDimensions({ width: 1500, height: 1200, depth: 40 });
            setConfig({ doors: 0, drawers: 0, shelves: 0, divisions: 0, hangingRods: 0 });
        } else if (moduleType === 'cuna-bebe') {
            setDimensions({ width: 1240, height: 900, depth: 640 });
            setConfig({ doors: 0, drawers: 0, shelves: 0, divisions: 0, hangingRods: 0 });
        } else if (moduleType === 'porta-microondas') {
            setDimensions({ width: 600, height: 400, depth: 400 });
            setConfig({ doors: 0, drawers: 0, shelves: 1, divisions: 0, hangingRods: 0 });
        } else if (moduleType === 'estacion-trabajo') {
            setDimensions({ width: 1400, height: 750, depth: 600 });
            setConfig({ doors: 0, drawers: 1, shelves: 0, divisions: 1, hangingRods: 0 });
        } else if (moduleType === 'barra-atencion') {
            setDimensions({ width: 1800, height: 1100, depth: 700 });
            setConfig({ doors: 0, drawers: 0, shelves: 1, divisions: 1, hangingRods: 0 });
        }
        else {
            setDimensions({ width: 800, height: 720, depth: 580 });
            setConfig({ doors: 2, drawers: 0, shelves: 1, divisions: 0, hangingRods: 0 });
        }
        setResult(null);
    }, [moduleType]);


    const hingeOptions = useMemo(() => allMaterials.filter(m => m.type === 'Herraje' && m.description.toLowerCase().includes('bisagra')), [allMaterials]);
    const slideOptions = useMemo(() => allMaterials.filter(m => m.type === 'Herraje' && m.description.toLowerCase().includes('corredera')), [allMaterials]);
    const hangingRodOptions = useMemo(() => allMaterials.filter(m => m.description.toLowerCase().includes('barral')), [allMaterials]);
    const hangingRodSupportOptions = useMemo(() => allMaterials.filter(m => m.description.toLowerCase().includes('soporte lateral para barral')), [allMaterials]);
    const handleOptions = useMemo(() => allMaterials.filter(m => m.type === 'Herraje' && (m.description.toLowerCase().includes('manija') || m.description.toLowerCase().includes('tirador'))), [allMaterials]);
    const aluminumProfileOptions = useMemo(() => allMaterials.filter(m => m.type === 'Perfil'), [allMaterials]);
    const glassOptions = useMemo(() => allMaterials.filter(m => m.type === 'Vidrio'), [allMaterials]);


    const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDimensions(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) || 0 }));
    };

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    };
    

    const handleComponentIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedComponentIds(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleAddHardware = () => {
        if (!selectedHardware || hardwareQty <= 0) {
            showToast('Seleccione un herraje y una cantidad válida.', 'error');
            return;
        }
        const existingIndex = additionalHardware.findIndex(h => h.materialId === selectedHardware);
        if (existingIndex > -1) {
            const newHardwareList = [...additionalHardware];
            newHardwareList[existingIndex].quantity += hardwareQty;
            setAdditionalHardware(newHardwareList);
        } else {
            setAdditionalHardware(prev => [...prev, { materialId: selectedHardware, quantity: hardwareQty }]);
        }
        setSelectedHardware('');
        setHardwareQty(1);
    };

    const handleRemoveHardware = (index: number) => {
        setAdditionalHardware(prev => prev.filter((_, i) => i !== index));
    };

    const handleCalculate = () => {
        try {
            const finalConfig = isOpenModule ? { ...config, doors: 0, drawers: 0 } : config;
            const calculatedResult = calculateModule(moduleType, dimensions, finalConfig, {...selectedComponentIds, doorType});
            
            const finalMaterials = new Map<string, MaterialSummary>();

            calculatedResult.materials.forEach(mat => {
                finalMaterials.set(mat.materialId, { ...mat });
            });

            additionalHardware.forEach(hw => {
                const existing = finalMaterials.get(hw.materialId);
                const materialInfo = allMaterials.find(m => m.id === hw.materialId);
                if (existing) {
                    existing.quantity += hw.quantity;
                } else if (materialInfo) {
                    finalMaterials.set(hw.materialId, {
                        materialId: hw.materialId,
                        quantity: hw.quantity,
                        unit: materialInfo.unit,
                    });
                }
            });
            
            setResult({
                pieces: calculatedResult.pieces,
                materials: Array.from(finalMaterials.values())
            });

        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Error en el cálculo', 'error');
            setResult(null);
        }
    };

    const renderConfigOptions = () => {
        const commonDoorDrawerConfig = (
            <>
                <div>
                    <label className="block text-sm font-medium">Nº Puertas</label>
                    <input type="number" name="doors" value={config.doors} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" disabled={isOpenModule} />
                </div>
                {config.doors > 0 && !isOpenModule && (
                    <>
                        <div>
                            <label className="block text-sm font-medium">Tipo de Puerta</label>
                            <select value={doorType} onChange={e => setDoorType(e.target.value as 'board' | 'glass')} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                <option value="board">Placa</option>
                                <option value="glass">Vidrio/Aluminio</option>
                            </select>
                        </div>
                        {doorType === 'glass' ? (
                            <>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium">Perfil Aluminio (Marco)</label>
                                    <select name="glassDoorProfile" value={selectedComponentIds.glassDoorProfile} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                        {aluminumProfileOptions.map(p => <option key={p.id} value={p.id}>{p.description}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium">Vidrio</label>
                                    <select name="glassPanel" value={selectedComponentIds.glassPanel} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                        {glassOptions.map(g => <option key={g.id} value={g.id}>{g.description}</option>)}
                                    </select>
                                </div>
                            </>
                        ) : null}
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Tipo de Bisagra</label>
                            <select name="hinge" value={selectedComponentIds.hinge} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                {hingeOptions.map(h => <option key={h.id} value={h.id}>{h.description}</option>)}
                            </select>
                        </div>
                    </>
                )}
                <div>
                    <label className="block text-sm font-medium">Nº Cajones</label>
                    <input type="number" name="drawers" value={config.drawers} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" disabled={isOpenModule} />
                </div>
                 {config.drawers > 0 && !isOpenModule && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Tipo de Corredera</label>
                        <select name="slide" value={selectedComponentIds.slide} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                             {slideOptions.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}
                        </select>
                    </div>
                 )}
            </>
        );

        switch (moduleType) {
            case 'bajo-mesada':
            case 'alacena':
            case 'columna-horno':
            case 'bajo-mesada-esquinero':
            case 'alacena-esquinera':
            case 'porta-microondas':
                return (
                    <>
                        {commonDoorDrawerConfig}
                        <div><label className="block text-sm font-medium">Nº Estantes</label><input type="number" name="shelves" value={config.shelves} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm" /></div>
                    </>
                );
            case 'placard':
            case 'rack-tv':
            case 'estacion-trabajo':
            case 'barra-atencion':
                return (
                     <>
                        {commonDoorDrawerConfig}
                        <div><label className="block text-sm font-medium">Nº Estantes</label><input type="number" name="shelves" value={config.shelves} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm" /></div>
                        <div><label className="block text-sm font-medium">Nº Divisiones Vert.</label><input type="number" name="divisions" value={config.divisions} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm" /></div>
                        { moduleType === 'placard' && 
                            <>
                                <div><label className="block text-sm font-medium">Nº Barrales</label><input type="number" name="hangingRods" value={config.hangingRods} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm" /></div>
                                {config.hangingRods > 0 && (
                                    <>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium">Tipo de Barral</label>
                                            <select name="hangingRod" value={selectedComponentIds.hangingRod} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                                {hangingRodOptions.map(h => <option key={h.id} value={h.id}>{h.description}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium">Soporte Barral</label>
                                            <select name="hangingRodSupport" value={selectedComponentIds.hangingRodSupport} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                                {hangingRodSupportOptions.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </>
                        }
                    </>
                );
            case 'zapatero':
                 return (
                    <>
                        <div>
                            <label className="block text-sm font-medium">Nº Puertas</label>
                            <input type="number" name="doors" value={config.doors} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" disabled={isOpenModule} />
                        </div>
                        {config.doors > 0 && !isOpenModule && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium">Tipo de Bisagra</label>
                                <select name="hinge" value={selectedComponentIds.hinge} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                    {hingeOptions.map(h => <option key={h.id} value={h.id}>{h.description}</option>)}
                                </select>
                            </div>
                        )}
                         <div><label className="block text-sm font-medium">Nº Estantes</label><input type="number" name="shelves" value={config.shelves} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm" /></div>
                    </>
                );
            case 'vanitory-colgante':
                return commonDoorDrawerConfig;
            case 'cama-cajones':
                 return (
                     <>
                        <div>
                            <label className="block text-sm font-medium">Nº Cajones (Total)</label>
                            <input type="number" name="drawers" value={config.drawers} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" disabled={isOpenModule} />
                        </div>
                        {config.drawers > 0 && !isOpenModule && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium">Tipo de Corredera</label>
                                <select name="slide" value={selectedComponentIds.slide} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                    {slideOptions.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}
                                </select>
                            </div>
                        )}
                         <div>
                             <label className="block text-sm font-medium">Divisiones Centrales</label>
                             <input type="number" name="divisions" value={config.divisions} onChange={handleConfigChange} min="0" className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                    </>
                 );
            case 'cajonera':
                 return (
                    <>
                        <div>
                            <label className="block text-sm font-medium">Nº Cajones</label>
                            <input type="number" name="drawers" value={config.drawers} onChange={handleConfigChange} min="1" className="mt-1 w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100" disabled={isOpenModule} />
                        </div>
                        {config.drawers > 0 && !isOpenModule && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium">Tipo de Corredera</label>
                                <select name="slide" value={selectedComponentIds.slide} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">
                                    {slideOptions.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}
                                </select>
                            </div>
                        )}
                    </>
                );
            case 'mesa':
            case 'escritorio':
                return <p className="text-sm text-gray-500 md:col-span-3">Este módulo no tiene configuraciones adicionales. Se calcula con una tapa, dos laterales y un faldón trasero.</p>;
            case 'respaldo-cama':
            case 'cuna-bebe':
                 return <p className="text-sm text-gray-500 md:col-span-3">Este módulo no tiene configuraciones adicionales.</p>;
            default: return null;
        }
    };
    
    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Calculadora Rápida de Módulos</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna de Configuración */}
                    <div className="lg:col-span-1 space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">1. Tipo de Módulo y Dimensiones (mm)</h3>
                            <div className="space-y-3">
                                <div><label className="block text-sm font-medium">Tipo de Módulo</label><select value={moduleType} onChange={e => setModuleType(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">{Object.entries(moduleTypes).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div><label className="block text-sm font-medium">Ancho</label><input type="number" name="width" value={dimensions.width} onChange={handleDimensionChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" /></div>
                                    <div><label className="block text-sm font-medium">Alto</label><input type="number" name="height" value={dimensions.height} onChange={handleDimensionChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" /></div>
                                    <div><label className="block text-sm font-medium">Prof.</label><input type="number" name="depth" value={dimensions.depth} onChange={handleDimensionChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" /></div>
                                </div>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">2. Materiales</h3>
                            <div className="space-y-3">
                               <div><label className="block text-sm font-medium">Placa Estructural (Interior)</label><select name="structural" value={selectedComponentIds.structural} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">{allMaterials.filter(m => m.type === 'Tablero').map(m => <option key={m.id} value={m.id}>{m.description}</option>)}</select></div>
                               <div><label className="block text-sm font-medium">Placa a la Vista (Frentes)</label><select name="visible" value={selectedComponentIds.visible} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">{allMaterials.filter(m => m.type === 'Tablero').map(m => <option key={m.id} value={m.id}>{m.description}</option>)}</select></div>
                               <div><label className="block text-sm font-medium">Placa de Fondo (3-6mm)</label><select name="back" value={selectedComponentIds.back} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">{allMaterials.filter(m => m.type === 'Tablero').map(m => <option key={m.id} value={m.id}>{m.description}</option>)}</select></div>
                               <div><label className="block text-sm font-medium">Placa de Cajón (Interior)</label><select name="drawer" value={selectedComponentIds.drawer} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">{allMaterials.filter(m => m.type === 'Tablero').map(m => <option key={m.id} value={m.id}>{m.description}</option>)}</select></div>
                               <div><label className="block text-sm font-medium">Tapacanto</label><select name="edge" value={selectedComponentIds.edge} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">{allMaterials.filter(m => m.type === 'Tapacanto').map(m => <option key={m.id} value={m.id}>{m.description}</option>)}</select></div>
                               <div><label className="block text-sm font-medium">Tirador (Manija)</label><select name="handle" value={selectedComponentIds.handle} onChange={handleComponentIdChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm">{handleOptions.map(m => <option key={m.id} value={m.id}>{m.description}</option>)}</select></div>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">3. Configuración</h3>
                            <div className="flex items-center space-x-2 mb-3">
                                <input 
                                    type="checkbox" 
                                    id="open-module-checkbox" 
                                    checked={isOpenModule} 
                                    onChange={e => setIsOpenModule(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="open-module-checkbox" className="text-sm font-medium">Módulo Abierto (sin frentes)</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-2 gap-y-4 items-end">{renderConfigOptions()}</div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">4. Herrajes Adicionales</h3>
                            <div className="space-y-2">
                                <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-md">
                                    <div className="flex-grow">
                                        <label className="block text-sm font-medium">Herraje</label>
                                        <select value={selectedHardware} onChange={e => setSelectedHardware(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 shadow-sm text-sm">
                                            <option value="">Seleccione...</option>
                                            {allMaterials.filter(m => m.type === 'Herraje').map(h => (
                                                <option key={h.id} value={h.id}>{h.description}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-20">
                                        <label className="block text-sm font-medium">Cant.</label>
                                        <input type="number" value={hardwareQty} onChange={e => setHardwareQty(Number(e.target.value))} min="1" className="mt-1 w-full rounded-md border-gray-300 shadow-sm"/>
                                    </div>
                                    <button type="button" onClick={handleAddHardware} className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm">Añadir</button>
                                </div>
                                {additionalHardware.length > 0 && (
                                    <ul className="mt-2 space-y-1 p-2 border rounded-md max-h-32 overflow-y-auto">
                                        {additionalHardware.map((hw, index) => {
                                            const materialInfo = allMaterials.find(m => m.id === hw.materialId);
                                            return (
                                                <li key={index} className="flex justify-between items-center text-sm p-1 bg-gray-100 rounded">
                                                    <span>{materialInfo?.description || 'Herraje no encontrado'} (x{hw.quantity})</span>
                                                    <button onClick={() => handleRemoveHardware(index)} className="text-red-500 font-bold px-2">&times;</button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <button onClick={handleCalculate} className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-semibold text-lg">Calcular Despiece</button>
                    </div>

                    {/* Columna de Resultados */}
                    <div className="lg:col-span-2">
                        {!result ? (
                            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-8">
                                <p className="text-gray-500 text-center">Configure un módulo y presione 'Calcular' para ver el despiece y los materiales necesarios.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Resumen de Materiales</h3>
                                    <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md space-y-1">
                                        {result.materials.map(mat => {
                                            const materialInfo = allMaterials.find(m => m.id === mat.materialId);
                                            return <li key={mat.materialId}><strong>{materialInfo?.description || 'Material no encontrado'}:</strong> {mat.quantity.toFixed(2)} {mat.unit}</li>
                                        })}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Lista de Despiece</h3>
                                    <div className="overflow-x-auto border rounded-md">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-100"><tr className="text-left"><th className="p-2">Pieza</th><th className="p-2">Cant.</th><th className="p-2">Largo (mm)</th><th className="p-2">Ancho (mm)</th><th className="p-2">Tapacanto</th></tr></thead>
                                            <tbody className="divide-y">
                                                {result.pieces.map((p, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="p-2 font-medium">{p.name}</td><td className="p-2">{p.qty}</td><td className="p-2">{p.length}</td><td className="p-2">{p.width}</td>
                                                        <td className="p-2 text-xs">{[p.edgeL1 && 'L1', p.edgeL2 && 'L2', p.edgeW1 && 'A1', p.edgeW2 && 'A2'].filter(Boolean).join(', ')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                                    <button
                                        onClick={() => setIsSaveModalOpen(true)}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-semibold text-sm"
                                    >
                                        Guardar como Producto
                                    </button>
                                    <button 
                                        onClick={() => exportModuleReportToCsv(result, allMaterials, moduleType, dimensions, moduleTypes)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold text-sm"
                                    >
                                        Exportar Planilla (CSV)
                                    </button>
                                    <button 
                                        onClick={() => generateModuleReportPdf(result, allMaterials, moduleType, dimensions, moduleTypes)}
                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold text-sm"
                                    >
                                        Exportar Reporte (PDF)
                                    </button>
                                    <button
                                        onClick={() => exportModuleToSketchup(result, moduleType, dimensions, moduleTypes, allMaterials, selectedComponentIds)}
                                        className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900 font-semibold text-sm"
                                        title="Genera un archivo .rb para importar en SketchUp"
                                    >
                                        Exportar a SketchUp (.rb)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {result && (
                 <SaveModuleAsProductModal 
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    calculationResult={result}
                    moduleInfo={{ moduleType, dimensions, moduleTypes }}
                />
            )}
        </>
    );
};

const CalendarAndTasksTab: React.FC = () => {
    const { quotes, receipts, vouchers, completedTasks, toggleTaskCompletion } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [searchTerm, setSearchTerm] = useState('');

    const eventColors: { [key: string]: string } = {
        'Presupuesto': 'bg-blue-500',
        'Aprobación': 'bg-green-500',
        'Entrega': 'bg-orange-500',
        'Recibo': 'bg-purple-500',
        'Comprobante': 'bg-gray-500'
    };

    const allEvents = useMemo(() => {
        const events: { date: string; type: string; text: string; quoteId: number }[] = [];

        const addEvent = (date: Date | string | null, type: string, text: string, quoteId: number) => {
            if (!date) return;
            const dateKey = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
            events.push({ date: dateKey, type, text, quoteId });
        };
        
        quotes.forEach(q => {
            addEvent(q.date, 'Presupuesto', `Creado P. Nº${String(q.id).padStart(5, '0')} para ${q.client}`, q.id);
            if (q.approvalDate) {
                addEvent(q.approvalDate, 'Aprobación', `Aprobado P. Nº${String(q.id).padStart(5, '0')}`, q.id);
            }
            if (q.estimatedDeliveryDate) {
                addEvent(q.estimatedDeliveryDate, 'Entrega', `Entrega P. Nº${String(q.id).padStart(5, '0')}`, q.id);
            }
        });

        receipts.forEach(r => {
            addEvent(r.date, 'Recibo', `Recibo Nº${r.receiptNumber} para P. Nº${String(r.quoteId).padStart(5, '0')}`, r.quoteId);
        });

        vouchers.forEach(v => {
            addEvent(v.date, 'Comprobante', `Comprobante P. Nº${String(v.quoteId).padStart(5, '0')}: ${v.description}`, v.quoteId);
        });

        return events;
    }, [quotes, receipts, vouchers]);

    const eventsByDate = useMemo(() => {
        const events: { [key: string]: { type: string; text: string; quoteId: number }[] } = {};
        allEvents.forEach(event => {
            const { date, ...rest } = event;
            if (!events[date]) {
                events[date] = [];
            }
            events[date].push(rest);
        });
        return events;
    }, [allEvents]);

    const highlightedDates = useMemo(() => {
        if (!searchTerm.trim()) return new Set<string>();
        const lowerCaseSearch = searchTerm.toLowerCase();
        const dates = new Set<string>();
        allEvents.forEach(event => {
            if (event.text.toLowerCase().includes(lowerCaseSearch)) {
                dates.add(event.date);
            }
        });
        return dates;
    }, [allEvents, searchTerm]);

    const pendingTasks = useMemo(() => {
        const tasks: { id: string; text: string; quoteId: number; date?: string | null }[] = [];
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        quotes.forEach(q => {
            const quoteIdStr = String(q.id).padStart(5, '0');
            
            if (q.status === QuoteStatus.Pendiente) {
                tasks.push({
                    id: `followup-${q.id}`,
                    text: `Hacer seguimiento del Presupuesto Nº${quoteIdStr} para ${q.client}.`,
                    quoteId: q.id
                });
            }
            if (q.status === QuoteStatus.Aprobado && !q.estimatedDeliveryDate) {
                 tasks.push({
                    id: `deliverydate-${q.id}`,
                    text: `Definir fecha de entrega para P. Nº${quoteIdStr} (${q.client}).`,
                    quoteId: q.id
                });
            }
            if (q.status === QuoteStatus.Aprobado && q.estimatedDeliveryDate) {
                const deliveryDate = new Date(q.estimatedDeliveryDate + 'T00:00:00');
                if (deliveryDate >= today && deliveryDate <= nextWeek) {
                    const formattedDate = deliveryDate.toLocaleDateString('es-AR');
                    tasks.push({
                        id: `upcoming-${q.id}`,
                        text: `Coordinar entrega de P. Nº${quoteIdStr} (${q.client}) para el ${formattedDate}.`,
                        quoteId: q.id,
                        date: q.estimatedDeliveryDate
                    });
                }
            }
        });

        const allTasks = tasks.sort((a,b) => (a.date || '').localeCompare(b.date || ''));
        
        if (!searchTerm.trim()) {
            return allTasks;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();
        return allTasks.filter(task => task.text.toLowerCase().includes(lowerCaseSearch));
    }, [quotes, searchTerm]);

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

        const calendarDays = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            calendarDays.push(<div key={`empty-start-${i}`} className="border p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toISOString().split('T')[0];
            const dayEvents = eventsByDate[dateKey] || [];
            
            const isToday = dateKey === new Date().toISOString().split('T')[0];
            const isSelected = selectedDate && dateKey === selectedDate.toISOString().split('T')[0];
            const isHighlighted = highlightedDates.has(dateKey);

            calendarDays.push(
                <div key={day} onClick={() => setSelectedDate(date)} className={`border p-2 cursor-pointer transition-colors ${isSelected ? 'bg-blue-200' : isHighlighted ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}>
                    <div className={`flex justify-center items-center h-8 w-8 mx-auto rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>
                        {day}
                    </div>
                    <div className="flex justify-center mt-1 space-x-1">
                        {dayEvents.slice(0, 4).map((event, index) => (
                           <div key={index} title={event.type} className={`w-2 h-2 rounded-full ${eventColors[event.type] || 'bg-gray-400'}`}></div>
                        ))}
                    </div>
                </div>
            );
        }
        return calendarDays;
    };
    
    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = selectedDate.toISOString().split('T')[0];
        const dayEvents = allEvents.filter(e => e.date === dateKey);

        if (!searchTerm.trim()) {
            return dayEvents;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        return dayEvents.filter(event => event.text.toLowerCase().includes(lowerCaseSearch));
    }, [selectedDate, allEvents, searchTerm]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">Calendario y Tareas</h2>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por cliente, Nº presupuesto, tarea..."
                    className="block w-full sm:w-72 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>
             <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                <div className="xl:col-span-3">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-200 rounded">&lt;</button>
                        <h3 className="text-xl font-bold text-center capitalize">
                            {currentDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-200 rounded">&gt;</button>
                    </div>
                    <div className="grid grid-cols-7 text-center font-semibold text-gray-600 mb-2">
                        <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                    </div>
                    <div className="grid grid-cols-7 text-center">{renderCalendar()}</div>
                </div>
                <div className="xl:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold mb-3 border-b pb-2">Eventos del día</h3>
                        {selectedDate ? (
                            <div>
                                <p className="font-semibold mb-2">{selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                {selectedDayEvents.length > 0 ? (
                                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedDayEvents.map((event, index) => (
                                            <li key={index} className="flex items-start">
                                                <div className={`w-3 h-3 rounded-full mt-1.5 mr-2 flex-shrink-0 ${eventColors[event.type]}`}></div>
                                                <span className="text-sm">{event.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-gray-500">{searchTerm.trim() ? 'No hay eventos que coincidan con la búsqueda.' : 'No hay eventos para este día.'}</p>}
                            </div>
                        ) : <p className="text-sm text-gray-500">Seleccione un día en el calendario.</p>}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-3 border-b pb-2">Tareas Pendientes</h3>
                        {pendingTasks.length > 0 ? (
                             <ul className="space-y-3 max-h-80 overflow-y-auto">
                                {pendingTasks.map(task => {
                                    const isCompleted = completedTasks.has(task.id);
                                    return (
                                        <li key={task.id} className="flex items-start">
                                            <input type="checkbox" checked={isCompleted} onChange={() => toggleTaskCompletion(task.id)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 mr-3"/>
                                            <label className={`text-sm ${isCompleted ? 'line-through text-gray-500' : ''}`}>{task.text}</label>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">{searchTerm.trim() ? 'No hay tareas que coincidan con la búsqueda.' : '¡No hay tareas pendientes!'}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const CatalogueTab: React.FC = () => {
    const { products, settings } = useAppContext();
    const [filter, setFilter] = useState('');

    const catalogueProducts = useMemo(() => {
        const lowerCaseFilter = filter.toLowerCase();
        return products.filter(p => {
            if (!p.showInCatalogue) return false;
            if (!filter) return true;
            return (
                p.name.toLowerCase().includes(lowerCaseFilter) ||
                (p.type && p.type.toLowerCase().includes(lowerCaseFilter)) ||
                (p.code && p.code.toLowerCase().includes(lowerCaseFilter))
            );
        });
    }, [products, filter]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">Catálogo de Productos</h2>
                <div className="flex items-center space-x-2">
                    <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar en catálogo..." className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    <button onClick={() => generateCataloguePdf(catalogueProducts, settings)} className="bg-red-500 text-white px-3 py-2 text-sm rounded-md hover:bg-red-600">Exportar PDF</button>
                </div>
            </div>
            {catalogueProducts.length === 0 ? (
                <p className="text-center text-gray-500 col-span-full py-10">No hay productos para mostrar en el catálogo.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {catalogueProducts.map(prod => (
                         <div key={prod.id} className="bg-white border rounded-lg shadow overflow-hidden flex flex-col">
                             <img src={prod.imageUrl || `https://picsum.photos/600/400?random=${prod.id}`} alt={prod.name} className="w-full h-48 object-cover" onError={(e) => (e.currentTarget.src = 'https://picsum.photos/600/400?grayscale')}/>
                             <div className="p-4 flex flex-col flex-grow">
                                 <h3 className="text-lg font-bold mb-1">{prod.name}</h3>
                                 <p className="text-sm text-gray-500 mb-2">{prod.type || ''}</p>
                                 <p className="text-sm text-gray-600 mb-3 flex-grow">{prod.description || 'Sin descripción detallada.'}</p>
                                 <p className="text-gray-900 font-semibold text-2xl mt-auto">{formatCurrency(prod.cost)}</p>
                             </div>
                         </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MaterialModal: React.FC<{ material: Material | null; onClose: () => void }> = ({ material, onClose }) => {
    const { materials, saveMaterial, showToast, updateProductCosts } = useAppContext();

    const [formState, setFormState] = useState({
        id: material?.id || '',
        code: material?.code || '',
        description: material?.description || '',
        type: material?.type || '',
        unit: material?.unit || '',
        price: String(material?.price || 0),
        commercialUnit: material?.commercialUnit || '',
        commercialPrice: String(material?.commercialPrice || ''),
        unitsPerCommercialUnit: String(material?.unitsPerCommercialUnit || ''),
        imageUrl: material?.imageUrl || null,
        brochureUrl: material?.brochureUrl || null,
        brochureFilename: material?.brochureFilename || null,
    });

    const materialTypes = useMemo(() => {
        const types = new Set(materials.map(m => m.type).filter(m => m && m.trim() !== ''));
        return Array.from(types).sort();
    }, [materials]);

    useEffect(() => {
        const commPrice = parseFloat(formState.commercialPrice);
        const units = parseFloat(formState.unitsPerCommercialUnit);
        if (!isNaN(commPrice) && !isNaN(units) && units > 0) {
            const unitPrice = commPrice / units;
            setFormState(p => ({ ...p, price: unitPrice.toFixed(4) }));
        } else {
            setFormState(p => ({ ...p, price: '0.00' }));
        }
    }, [formState.commercialPrice, formState.unitsPerCommercialUnit]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newType = e.target.value;
        setFormState(prev => ({ ...prev, type: newType }));
        if (!material) {
            const code = generateCode(newType, materials);
            setFormState(prev => ({ ...prev, code: code }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        const file = files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (name === 'imageFile') {
                setFormState(p => ({ ...p, imageUrl: dataUrl }));
            } else if (name === 'brochureFile') {
                setFormState(p => ({ ...p, brochureUrl: dataUrl, brochureFilename: file.name }));
            }
        };
        reader.readAsDataURL(file);
    };

    const removeFile = (fileType: 'image' | 'brochure') => {
        if (fileType === 'image') {
            setFormState(p => ({ ...p, imageUrl: null }));
        } else {
            setFormState(p => ({ ...p, brochureUrl: null, brochureFilename: null }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.code) {
            showToast('El código es obligatorio. Por favor, ingrese un tipo.', 'error');
            return;
        }

        saveMaterial({
            id: formState.id || undefined,
            code: formState.code,
            description: formState.description,
            type: formState.type,
            unit: formState.unit,
            price: parseFloat(formState.price),
            commercialUnit: formState.commercialUnit,
            commercialPrice: parseFloat(formState.commercialPrice),
            unitsPerCommercialUnit: parseFloat(formState.unitsPerCommercialUnit),
            imageUrl: formState.imageUrl,
            brochureUrl: formState.brochureUrl,
            brochureFilename: formState.brochureFilename,
        });
        updateProductCosts();
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={material?.id ? 'Editar Material' : 'Crear Nuevo Material'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="material-tipo" className="block text-sm font-medium text-gray-700">Tipo</label>
                        <input type="text" id="material-tipo" list="material-types-list" value={formState.type} onChange={handleTypeChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Tablero, Herraje..." />
                        <datalist id="material-types-list">
                            {materialTypes.map(type => <option key={type} value={type} />)}
                        </datalist>
                    </div>
                    <div>
                        <label htmlFor="material-codigo" className="block text-sm font-medium text-gray-700">Código</label>
                        <input type="text" id="material-codigo" value={formState.code} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100" readOnly />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="material-descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                        <input type="text" id="material-descripcion" name="description" value={formState.description} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="material-unidad" className="block text-sm font-medium text-gray-700">Unidad de Cálculo</label>
                        <input type="text" id="material-unidad" name="unit" value={formState.unit} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="m², ml, kg, u" required />
                    </div>
                    <div>
                        <label htmlFor="material-commercial-unit" className="block text-sm font-medium text-gray-700">Presentación</label>
                        <input type="text" id="material-commercial-unit" name="commercialUnit" value={formState.commercialUnit} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="placa, rollo, caja" required />
                    </div>
                    <div>
                        <label htmlFor="material-units-per" className="block text-sm font-medium text-gray-700">Unidades / Pres.</label>
                        <input type="number" id="material-units-per" name="unitsPerCommercialUnit" step="0.01" value={formState.unitsPerCommercialUnit} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="material-commercial-price" className="block text-sm font-medium text-gray-700">Precio / Pres. ($)</label>
                        <input type="number" id="material-commercial-price" name="commercialPrice" step="0.01" value={formState.commercialPrice} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                    <div className="md:col-span-4">
                        <label htmlFor="material-precio" className="block text-sm font-medium text-gray-700">Precio Unitario (Calculado)</label>
                        <input type="text" id="material-precio" value={formatCurrency(parseFloat(formState.price) || 0)} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100" readOnly />
                    </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Imagen del Material</label>
                        <input type="file" name="imageFile" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {formState.imageUrl && (
                            <div className="mt-2 relative w-32 h-32">
                                <img src={formState.imageUrl} alt="Vista previa" className="rounded-md object-cover w-full h-full" />
                                <button type="button" onClick={() => removeFile('image')} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center">&times;</button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Folleto Técnico (PDF)</label>
                        <input type="file" name="brochureFile" accept="application/pdf" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {formState.brochureUrl && (
                            <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                <a href={formState.brochureUrl} download={formState.brochureFilename || 'folleto.pdf'} className="text-blue-600 hover:underline truncate text-sm">{formState.brochureFilename}</a>
                                <button type="button" onClick={() => removeFile('brochure')} className="text-red-500 font-bold px-2">&times;</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end pt-5 space-x-3 border-t">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Guardar Material</button>
                </div>
            </form>
        </Modal>
    );
};

// --- MaterialsTab ---
const MaterialsTab: React.FC = () => {
    const { materials, deleteMaterial, updateMaterialPrices, showToast } = useAppContext();
    const [editingMaterial, setEditingMaterial] = useState<Material | null | 'new'>(null);
    const [filter, setFilter] = useState({ text: '', type: 'all' });
    
    const materialTypes = useMemo(() => Array.from(new Set(materials.map(m => m.type))).sort(), [materials]);

    const filteredMaterials = useMemo(() => {
        const lowerCaseText = filter.text.toLowerCase();
        return materials.filter(m => 
            (filter.type === 'all' || m.type === filter.type) &&
            (m.description.toLowerCase().includes(lowerCaseText) || m.code.toLowerCase().includes(lowerCaseText))
        );
    }, [materials, filter]);

    const [priceUpdate, setPriceUpdate] = useState({ type: 'all', percentage: '' });

    const handlePriceUpdate = () => {
        const percentage = parseFloat(priceUpdate.percentage);
        if (isNaN(percentage)) {
            showToast('Porcentaje inválido.', 'error');
            return;
        }
        updateMaterialPrices(priceUpdate.type, percentage);
        setPriceUpdate({ type: 'all', percentage: '' });
    };

    const handleDelete = (material: Material) => {
        if (window.confirm(`¿Está seguro que desea eliminar el material "${material.description}"?`)) {
            deleteMaterial(material.id);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {editingMaterial !== null && <MaterialModal material={editingMaterial === 'new' ? null : editingMaterial} onClose={() => setEditingMaterial(null)} />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Gestión de Materiales</h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <input type="text" placeholder="Buscar por código o descripción..." value={filter.text} onChange={e => setFilter(p => ({ ...p, text: e.target.value }))} className="flex-grow rounded-md border-gray-300 shadow-sm" />
                        <select value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))} className="rounded-md border-gray-300 shadow-sm">
                            <option value="all">Todos los tipos</option>
                            {materialTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                         <button onClick={() => setEditingMaterial('new')} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Nuevo Material</button>
                    </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Actualización de Precios por Lote</h3>
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <label className="block text-sm">Tipo de material</label>
                            <select value={priceUpdate.type} onChange={e => setPriceUpdate(p => ({...p, type: e.target.value}))} className="w-full mt-1 rounded-md border-gray-300 shadow-sm">
                                <option value="all">Todos</option>
                                {materialTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="w-28">
                             <label className="block text-sm">Aumento %</label>
                             <input type="number" placeholder="Ej: 10" value={priceUpdate.percentage} onChange={e => setPriceUpdate(p => ({...p, percentage: e.target.value}))} className="w-full mt-1 rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <button onClick={handlePriceUpdate} className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700">Aplicar</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mb-4">
                <button onClick={() => exportMaterialsToCsv(filteredMaterials)} className="bg-green-500 text-white px-3 py-1 text-sm rounded-md hover:bg-green-600">Exportar a CSV</button>
                <button onClick={() => exportMaterialsToPdf(filteredMaterials)} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600">Exportar a PDF</button>
            </div>
            
            <div className="overflow-x-auto border rounded-md">
                 <table className="min-w-full text-sm">
                     <thead className="bg-gray-100">
                        <tr className="text-left">
                            <th className="p-2">Código</th>
                            <th className="p-2">Descripción</th>
                            <th className="p-2">Tipo</th>
                            <th className="p-2">Presentación</th>
                            <th className="p-2">Precio Pres.</th>
                            <th className="p-2">Precio Unit.</th>
                            <th className="p-2">Acciones</th>
                        </tr>
                    </thead>
                     <tbody className="divide-y">
                         {filteredMaterials.map(m => (
                             <tr key={m.id} className="hover:bg-gray-50">
                                 <td className="p-2 font-mono">{m.code}</td>
                                 <td className="p-2">{m.description}</td>
                                 <td className="p-2">{m.type}</td>
                                 <td className="p-2">{`${m.unitsPerCommercialUnit.toLocaleString('es-AR')} ${m.unit} / ${m.commercialUnit}`}</td>
                                 <td className="p-2">{formatCurrency(m.commercialPrice)}</td>
                                 <td className="p-2">{formatCurrency(m.price)} / {m.unit}</td>
                                 <td className="p-2 space-x-3">
                                     <button onClick={() => setEditingMaterial(m)} className="text-blue-600 hover:underline">Editar</button>
                                     <button onClick={() => handleDelete(m)} className="text-red-600 hover:underline">Eliminar</button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    );
};

// --- ProductsTab ---
const ProductModal: React.FC<{ product: Product | null; onClose: () => void }> = ({ product, onClose }) => {
    const { materials, products, saveProduct, showToast } = useAppContext();
    
    const [formState, setFormState] = useState({
        id: product?.id || '',
        code: product?.code || '',
        name: product?.name || '',
        description: product?.description || '',
        type: product?.type || '',
        laborPercent: String(product?.laborPercent || 100),
        showInCatalogue: product?.showInCatalogue || false,
        imageUrl: product?.imageUrl || null,
        planPdfUrl: product?.planPdfUrl || null,
        planPdfFilename: product?.planPdfFilename || null,
    });
    
    const [productMaterials, setProductMaterials] = useState<ProductMaterial[]>(product?.materials || []);
    const [newMaterial, setNewMaterial] = useState({ id: '', qty: '1' });

    const productTypes = useMemo(() => Array.from(new Set(products.map(p => p.type).filter(Boolean))).sort(), [products]);

    useEffect(() => {
        if (!product && formState.type) {
            setFormState(p => ({ ...p, code: generateCode(p.type, products)}));
        }
    }, [formState.type, product, products]);
    
    const materialCost = useMemo(() => {
        return productMaterials.reduce((sum, pm) => {
            const mat = materials.find(m => m.id === pm.materialId);
            return sum + (mat ? mat.price * pm.quantity : 0);
        }, 0);
    }, [productMaterials, materials]);

    const totalCost = useMemo(() => {
        return materialCost * (1 + (parseFloat(formState.laborPercent) / 100));
    }, [materialCost, formState.laborPercent]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, type } = e.target;
        const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (e.target as HTMLInputElement).value;
        setFormState(p => ({ ...p, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        const file = files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (name === 'imageFile') {
                setFormState(p => ({ ...p, imageUrl: dataUrl }));
            } else if (name === 'planPdfFile') {
                setFormState(p => ({ ...p, planPdfUrl: dataUrl, planPdfFilename: file.name }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAddMaterial = () => {
        const qty = parseFloat(newMaterial.qty);
        if (!newMaterial.id || isNaN(qty) || qty <= 0) {
            showToast('Seleccione un material y una cantidad válida.', 'error');
            return;
        }
        
        const existingIndex = productMaterials.findIndex(pm => pm.materialId === newMaterial.id);
        if (existingIndex > -1) {
            const updatedMaterials = [...productMaterials];
            updatedMaterials[existingIndex].quantity += qty;
            setProductMaterials(updatedMaterials);
        } else {
            setProductMaterials(prev => [...prev, { materialId: newMaterial.id, quantity: qty }]);
        }
        setNewMaterial({ id: '', qty: '1' });
    };
    
    const handleRemoveMaterial = (materialId: string) => {
        setProductMaterials(prev => prev.filter(pm => pm.materialId !== materialId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveProduct({
            id: formState.id || undefined,
            ...formState,
            laborPercent: parseFloat(formState.laborPercent),
            materials: productMaterials
        }, totalCost);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={product ? 'Editar Producto' : 'Crear Producto'} size="xl">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda: Detalles del producto */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-medium">Tipo</label>
                            <input type="text" list="product-types" name="type" value={formState.type} onChange={handleFormChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                            <datalist id="product-types">{productTypes.map(t => <option key={t} value={t} />)}</datalist>
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Código</label>
                            <input type="text" value={formState.code} className="mt-1 w-full bg-gray-100 rounded-md border-gray-300" readOnly />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Nombre</label>
                        <input type="text" name="name" value={formState.name} onChange={handleFormChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Descripción</label>
                        <textarea name="description" value={formState.description} onChange={handleFormChange} rows={3} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">% Mano de Obra</label>
                        <input type="number" name="laborPercent" value={formState.laborPercent} onChange={handleFormChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                     <div className="flex items-center">
                        <input type="checkbox" name="showInCatalogue" checked={formState.showInCatalogue} onChange={handleFormChange} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                        <label className="ml-2 block text-sm">Mostrar en catálogo público</label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Imagen</label>
                        <input type="file" name="imageFile" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Plano PDF</label>
                        <input type="file" name="planPdfFile" accept="application/pdf" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                </div>
                {/* Columna Derecha: Materiales y Costos */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Materiales del Producto</h3>
                    <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-md">
                        <div className="flex-grow">
                            <label className="block text-sm">Material</label>
                            <select value={newMaterial.id} onChange={e => setNewMaterial(p => ({...p, id: e.target.value}))} className="w-full mt-1 rounded-md border-gray-300 shadow-sm">
                                <option value="">Seleccione un material</option>
                                {materials.map(m => <option key={m.id} value={m.id}>{m.description}</option>)}
                            </select>
                        </div>
                        <div className="w-24">
                            <label className="block text-sm">Cantidad</label>
                            <input type="number" value={newMaterial.qty} onChange={e => setNewMaterial(p => ({...p, qty: e.target.value}))} className="w-full mt-1 rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <button type="button" onClick={handleAddMaterial} className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 text-sm">Añadir</button>
                    </div>
                    <div className="border rounded-md max-h-64 overflow-y-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0"><tr className="text-left"><th className="p-2">Material</th><th className="p-2">Cant.</th><th className="p-2">Acción</th></tr></thead>
                            <tbody className="divide-y">
                                {productMaterials.map(pm => {
                                    const mat = materials.find(m => m.id === pm.materialId);
                                    return (
                                        <tr key={pm.materialId}>
                                            <td className="p-2">{mat?.description || 'N/A'}</td>
                                            <td className="p-2">{pm.quantity.toFixed(2)} {mat?.unit}</td>
                                            <td className="p-2"><button type="button" onClick={() => handleRemoveMaterial(pm.materialId)} className="text-red-600 hover:underline">Quitar</button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                     <div className="p-4 bg-gray-100 rounded-lg space-y-2 text-right">
                        <p>Costo Materiales: <span className="font-semibold">{formatCurrency(materialCost)}</span></p>
                        <p className="text-xl">Costo Total Producto: <span className="font-bold">{formatCurrency(totalCost)}</span></p>
                    </div>
                    <div className="flex justify-end pt-5 space-x-3 border-t">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Guardar Producto</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

const ProductsTab: React.FC = () => {
    const { products, materials, deleteProduct } = useAppContext();
    const [editingProduct, setEditingProduct] = useState<Product | null | 'new'>(null);
    const [filterText, setFilterText] = useState('');

    const filteredProducts = useMemo(() => {
        const lowerCaseFilter = filterText.toLowerCase();
        if (!lowerCaseFilter) return products;
        return products.filter(p => 
            p.name.toLowerCase().includes(lowerCaseFilter) ||
            p.code.toLowerCase().includes(lowerCaseFilter) ||
            p.type.toLowerCase().includes(lowerCaseFilter)
        );
    }, [products, filterText]);
    
    const handleDelete = (product: Product) => {
        if (window.confirm(`¿Está seguro que desea eliminar el producto "${product.name}"?`)) {
            deleteProduct(product.id);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {editingProduct !== null && <ProductModal product={editingProduct === 'new' ? null : editingProduct} onClose={() => setEditingProduct(null)} />}
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                 <h2 className="text-2xl font-bold">Gestión de Productos Compuestos</h2>
                 <div className="flex items-center gap-4">
                    <input type="text" placeholder="Buscar producto..." value={filterText} onChange={e => setFilterText(e.target.value)} className="rounded-md border-gray-300 shadow-sm" />
                    <button onClick={() => setEditingProduct('new')} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Nuevo Producto</button>
                 </div>
            </div>
             <div className="flex justify-end gap-2 mb-4">
                <button onClick={() => exportProductsToCsv(filteredProducts, materials)} className="bg-green-500 text-white px-3 py-1 text-sm rounded-md hover:bg-green-600">Exportar a CSV</button>
                <button onClick={() => exportProductsToPdf(filteredProducts, materials)} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600">Exportar a PDF</button>
            </div>
            <div className="overflow-x-auto border rounded-md">
                 <table className="min-w-full text-sm">
                     <thead className="bg-gray-100"><tr className="text-left"><th className="p-2">Código</th><th className="p-2">Nombre</th><th className="p-2">Tipo</th><th className="p-2">Costo Final</th><th className="p-2">Acciones</th></tr></thead>
                     <tbody className="divide-y">
                         {filteredProducts.map(p => (
                             <tr key={p.id} className="hover:bg-gray-50">
                                 <td className="p-2 font-mono">{p.code}</td>
                                 <td className="p-2">{p.name}</td>
                                 <td className="p-2">{p.type}</td>
                                 <td className="p-2">{formatCurrency(p.cost)}</td>
                                 <td className="p-2 space-x-3">
                                     <button onClick={() => setEditingProduct(p)} className="text-blue-600 hover:underline">Editar</button>
                                     <button onClick={() => handleDelete(p)} className="text-red-600 hover:underline">Eliminar</button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        </div>
    );
};

// --- QuoteGeneratorTab ---
const QuoteGeneratorTab: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
    const { products, saveQuote, nextQuoteId, quoteToDuplicate, setQuoteToDuplicate, showToast } = useAppContext();
    
    const BLANK_QUOTE_STATE = {
        idToUpdate: undefined as number | undefined,
        client: '', clientPhone: '', clientEmail: '',
        validity: '15',
        notes: '',
        items: [] as QuoteItem[],
        commissionPercent: 10,
        ivaPercent: 21,
    };
    
    const [quoteState, setQuoteState] = useState(BLANK_QUOTE_STATE);
    const [productToAdd, setProductToAdd] = useState('');

    useEffect(() => {
        if (quoteToDuplicate) {
            setQuoteState({
                idToUpdate: undefined, // It's a new quote, not an update
                client: quoteToDuplicate.client,
                clientPhone: quoteToDuplicate.clientPhone,
                clientEmail: quoteToDuplicate.clientEmail,
                validity: quoteToDuplicate.validity,
                notes: quoteToDuplicate.notes || '',
                items: quoteToDuplicate.items.map(item => ({...item})), // Deep copy
                commissionPercent: quoteToDuplicate.commissionPercent,
                ivaPercent: quoteToDuplicate.ivaPercent,
            });
            showToast(`Presupuesto Nº${String(quoteToDuplicate.id).padStart(5, '0')} cargado para duplicar.`, 'success');
            setQuoteToDuplicate(null);
        }
    }, [quoteToDuplicate, setQuoteToDuplicate, showToast]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setQuoteState(p => ({...p, [name]: value}));
    };

    const handleAddItem = () => {
        if (!productToAdd) return;
        const product = products.find(p => p.id === productToAdd);
        if (!product) return;

        const newItem: QuoteItem = {
            productId: product.id,
            name: product.name,
            quantity: 1,
            originalPrice: product.cost,
            discountPercent: 0,
            unitPrice: product.cost,
            subtotal: product.cost,
        };

        setQuoteState(p => ({...p, items: [...p.items, newItem]}));
        setProductToAdd('');
    };

    const handleItemChange = (index: number, field: 'quantity' | 'discountPercent', value: string) => {
        const numValue = parseFloat(value) || 0;
        const updatedItems = [...quoteState.items];
        const item = updatedItems[index];

        if (field === 'quantity') {
            item.quantity = numValue;
        } else if (field === 'discountPercent') {
            item.discountPercent = numValue;
        }
        
        item.unitPrice = item.originalPrice * (1 - item.discountPercent / 100);
        item.subtotal = item.unitPrice * item.quantity;
        
        setQuoteState(p => ({...p, items: updatedItems}));
    };

    const handleRemoveItem = (index: number) => {
        setQuoteState(p => ({...p, items: p.items.filter((_, i) => i !== index)}));
    };
    
    const totals = useMemo(() => {
        const itemsSubtotal = quoteState.items.reduce((sum, item) => sum + item.subtotal, 0);
        const commission = itemsSubtotal * (quoteState.commissionPercent / 100);
        const subtotal = itemsSubtotal + commission;
        const iva = subtotal * (quoteState.ivaPercent / 100);
        const total = subtotal + iva;
        return { itemsSubtotal, commission, subtotal, iva, total };
    }, [quoteState]);

    const handleSave = () => {
        if (!quoteState.client || quoteState.items.length === 0) {
            showToast('Debe ingresar un cliente y al menos un producto.', 'error');
            return;
        }
        
        const quoteToSave = {
            date: new Date().toISOString().split('T')[0],
            client: quoteState.client,
            clientPhone: quoteState.clientPhone,
            clientEmail: quoteState.clientEmail,
            validity: quoteState.validity,
            notes: quoteState.notes,
            items: quoteState.items,
            subtotal: totals.subtotal,
            commissionPercent: quoteState.commissionPercent,
            ivaPercent: quoteState.ivaPercent,
            total: totals.total,
            status: QuoteStatus.Pendiente,
            estimatedDeliveryDate: null,
            approvalDate: null,
        };

        saveQuote(quoteToSave, quoteState.idToUpdate);
        setQuoteState(BLANK_QUOTE_STATE);
        setActiveTab('historial');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Generar Presupuesto Nº {String(quoteState.idToUpdate || nextQuoteId).padStart(5, '0')}</h2>
                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">Datos del Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input name="client" value={quoteState.client} onChange={handleInputChange} placeholder="Nombre del Cliente" className="md:col-span-3 rounded-md border-gray-300" />
                        <input name="clientPhone" value={quoteState.clientPhone} onChange={handleInputChange} placeholder="Teléfono" className="rounded-md border-gray-300" />
                        <input name="clientEmail" value={quoteState.clientEmail} onChange={handleInputChange} placeholder="Email" className="rounded-md border-gray-300" />
                        <input name="validity" value={quoteState.validity} onChange={handleInputChange} type="number" placeholder="Validez (días)" className="rounded-md border-gray-300" />
                    </div>
                     <h3 className="font-semibold mb-2 mt-4">Aclaraciones</h3>
                    <textarea 
                        name="notes" 
                        value={quoteState.notes} 
                        onChange={handleInputChange} 
                        placeholder="Ej: Condiciones de entrega, detalles de materiales, etc." 
                        className="w-full rounded-md border-gray-300" 
                        rows={3}
                    ></textarea>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">Agregar Productos</h3>
                    <div className="flex items-center gap-2">
                        <select value={productToAdd} onChange={e => setProductToAdd(e.target.value)} className="flex-grow rounded-md border-gray-300">
                            <option value="">Seleccione un producto...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.cost)})</option>)}
                        </select>
                        <button onClick={handleAddItem} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Agregar</button>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100"><tr className="text-left"><th className="p-2">Producto</th><th className="p-2 w-20">Cant.</th><th className="p-2 w-28">P. Unit.</th><th className="p-2 w-24">Desc.%</th><th className="p-2 w-32">Subtotal</th><th className="p-2"></th></tr></thead>
                        <tbody className="divide-y">
                            {quoteState.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-2">{item.name}</td>
                                    <td className="p-1"><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-full p-1 rounded-md border-gray-300" /></td>
                                    <td className="p-2">{formatCurrency(item.originalPrice)}</td>
                                    <td className="p-1"><input type="number" value={item.discountPercent} onChange={e => handleItemChange(index, 'discountPercent', e.target.value)} className="w-full p-1 rounded-md border-gray-300" /></td>
                                    <td className="p-2 font-semibold">{formatCurrency(item.subtotal)}</td>
                                    <td className="p-2 text-center"><button onClick={() => handleRemoveItem(index)} className="text-red-500 font-bold"> &times; </button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                 <h3 className="text-xl font-bold mb-4">Resumen y Totales</h3>
                 <div className="space-y-2 text-right">
                    <p>Subtotal Items: <span className="font-semibold">{formatCurrency(totals.itemsSubtotal)}</span></p>
                    <div className="flex items-center justify-end">
                        <span>Honorarios (%):</span>
                        <input type="number" name="commissionPercent" value={quoteState.commissionPercent} onChange={handleInputChange} className="w-20 ml-2 text-right rounded-md border-gray-300" />
                    </div>
                     <p>Subtotal: <span className="font-semibold">{formatCurrency(totals.subtotal)}</span></p>
                    <div className="flex items-center justify-end">
                        <span>IVA (%):</span>
                        <input type="number" name="ivaPercent" value={quoteState.ivaPercent} onChange={handleInputChange} className="w-20 ml-2 text-right rounded-md border-gray-300" />
                    </div>
                    <p className="text-2xl font-bold border-t pt-2 mt-2">TOTAL: {formatCurrency(totals.total)}</p>
                 </div>
                 <button onClick={handleSave} className="w-full bg-green-600 text-white py-3 mt-6 rounded-md hover:bg-green-700 text-lg font-semibold">Guardar Presupuesto</button>
            </div>
        </div>
    );
};

// --- WipTab ---
const WipTab: React.FC = () => {
    const { quotes, updateQuoteDeliveryDate, products, materials, settings } = useAppContext();
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

    const wipQuotes = useMemo(() => {
        return quotes
            .filter(q => q.status === QuoteStatus.Aprobado)
            .sort((a, b) => new Date(b.approvalDate!).getTime() - new Date(a.approvalDate!).getTime());
    }, [quotes]);
    
    const handleDeliveryDateChange = (quoteId: number, date: string) => {
        updateQuoteDeliveryDate(quoteId, date);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            {selectedQuote && <PaymentManagerModal quote={selectedQuote} onClose={() => setSelectedQuote(null)} />}
            <h2 className="text-2xl font-bold mb-4">Trabajos en Proceso ({wipQuotes.length})</h2>
            <div className="space-y-4">
                {wipQuotes.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">No hay trabajos aprobados en proceso.</p>
                ) : (
                    wipQuotes.map(q => (
                        <div key={q.id} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <div>
                                    <p className="font-bold text-lg">{q.client}</p>
                                    <p className="text-sm text-gray-600">Presupuesto Nº {String(q.id).padStart(5, '0')}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Aprobado: {new Date(q.approvalDate!).toLocaleDateString('es-AR')}</p>
                                    <p className="font-semibold">{formatCurrency(q.total)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">F. Entrega:</label>
                                    <input
                                        type="date"
                                        value={q.estimatedDeliveryDate || ''}
                                        onChange={(e) => handleDeliveryDateChange(q.id, e.target.value)}
                                        className="p-1 rounded-md border-gray-300"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setSelectedQuote(q)} className="bg-purple-600 text-white px-3 py-1 text-sm rounded-md hover:bg-purple-700">Pagos</button>
                                    <button onClick={() => generateTaskOrderPackage(q, products, materials, settings)} className="bg-yellow-600 text-white px-3 py-1 text-sm rounded-md hover:bg-yellow-700">Orden Taller</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const PaymentManagerModal: React.FC<{ quote: Quote; onClose: () => void }> = ({ quote, onClose }) => {
    const { receipts, vouchers, addReceipt, addVoucher, deleteVoucher, updateVoucher, settings, showToast } = useAppContext();
    const [view, setView] = useState<'receipts' | 'vouchers'>('receipts');

    const quoteReceipts = useMemo(() => receipts.filter(r => r.quoteId === quote.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [receipts, quote.id]);
    const quoteVouchers = useMemo(() => vouchers.filter(v => v.quoteId === quote.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [vouchers, quote.id]);
    
    const totalPaid = useMemo(() => quoteReceipts.reduce((sum, r) => sum + r.amount, 0), [quoteReceipts]);
    const totalVouchers = useMemo(() => quoteVouchers.reduce((sum, v) => sum + v.amount, 0), [quoteVouchers]);
    const balanceDue = quote.total - totalPaid;

    const [newReceipt, setNewReceipt] = useState({ amount: '', receiptNumber: '', date: new Date().toISOString().split('T')[0]});
    const [voucherForm, setVoucherForm] = useState({ description: '', amount: '', file: null as File | null, fileName: '' });
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

    const handleAddReceipt = () => {
        const amount = parseFloat(newReceipt.amount);
        const receiptNumber = parseInt(newReceipt.receiptNumber);
        if (isNaN(amount) || amount <= 0 || isNaN(receiptNumber)) {
            showToast('Monto y número de recibo inválidos.', 'error');
            return;
        }
        const createdReceipt = addReceipt({ quoteId: quote.id, amount, receiptNumber, date: newReceipt.date });
        generateMoneyReceiptPdf(createdReceipt, quote, settings, totalPaid + amount, balanceDue - amount);
        setNewReceipt({ amount: '', receiptNumber: '', date: new Date().toISOString().split('T')[0]});
    };
    
    const handleVoucherFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVoucherForm(p => ({ ...p, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setVoucherForm(p => ({ ...p, file, fileName: file ? file.name : '' }));
    };
    
    const handleEditVoucherClick = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        setVoucherForm({
            description: voucher.description,
            amount: String(voucher.amount),
            file: null,
            fileName: voucher.fileName
        });
    };

    const cancelEdit = () => {
        setEditingVoucher(null);
        setVoucherForm({ description: '', amount: '', file: null, fileName: '' });
    };

    const handleVoucherSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(voucherForm.amount);
        if (isNaN(amount) || amount <= 0 || !voucherForm.description) {
            showToast('Descripción y monto son obligatorios.', 'error');
            return;
        }

        if (editingVoucher) {
            updateVoucher(editingVoucher.id, {
                description: voucherForm.description,
                amount: amount,
            });
            cancelEdit();
        } else {
            const processVoucher = (fileUrl: string, fileName: string) => {
                addVoucher({
                    quoteId: quote.id,
                    description: voucherForm.description,
                    amount: amount,
                    fileUrl: fileUrl,
                    fileName: fileName,
                    date: new Date().toISOString().split('T')[0]
                });
                setVoucherForm({ description: '', amount: '', file: null, fileName: '' });
            };

            if (voucherForm.file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    processVoucher(dataUrl, voucherForm.file!.name);
                };
                reader.readAsDataURL(voucherForm.file);
            } else {
                const fileUrl = generateVoucherReceiptPdf(voucherForm.description, amount, settings, quote);
                const fileName = `comprobante-generado-${quote.id}-${Date.now()}.pdf`;
                processVoucher(fileUrl, fileName);
            }
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Gestión de Pagos - P. Nº ${String(quote.id).padStart(5, '0')}`}>
            <div className="p-4 bg-blue-50 rounded-lg grid grid-cols-4 gap-4 text-center mb-4">
                <div><p className="text-sm text-gray-600">Total Presupuesto</p><p className="font-bold text-lg">{formatCurrency(quote.total)}</p></div>
                <div><p className="text-sm text-gray-600">Total Pagado</p><p className="font-bold text-lg text-green-600">{formatCurrency(totalPaid)}</p></div>
                <div><p className="text-sm text-gray-600">Total Gastos</p><p className="font-bold text-lg text-orange-600">{formatCurrency(totalVouchers)}</p></div>
                <div><p className="text-sm text-gray-600">Saldo Pendiente</p><p className="font-bold text-lg text-red-600">{formatCurrency(balanceDue)}</p></div>
            </div>
            <div className="flex border-b mb-4">
                <button onClick={() => setView('receipts')} className={`px-4 py-2 text-sm font-medium ${view === 'receipts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Recibos ({quoteReceipts.length})</button>
                <button onClick={() => setView('vouchers')} className={`px-4 py-2 text-sm font-medium ${view === 'vouchers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Comprobantes ({quoteVouchers.length})</button>
            </div>
            {view === 'receipts' ? (
                <div>
                    <div className="flex items-end gap-2 mb-4 p-3 bg-gray-50 rounded-md">
                        <div><label className="text-xs">Monto</label><input type="number" value={newReceipt.amount} onChange={e => setNewReceipt(p=>({...p, amount: e.target.value}))} className="w-full mt-1 p-1 border rounded" /></div>
                        <div><label className="text-xs">Nº Recibo</label><input type="number" value={newReceipt.receiptNumber} onChange={e => setNewReceipt(p=>({...p, receiptNumber: e.target.value}))} className="w-full mt-1 p-1 border rounded" /></div>
                        <div><label className="text-xs">Fecha</label><input type="date" value={newReceipt.date} onChange={e => setNewReceipt(p=>({...p, date: e.target.value}))} className="w-full mt-1 p-1 border rounded" /></div>
                        <button onClick={handleAddReceipt} className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 text-sm">Añadir Recibo</button>
                    </div>
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {quoteReceipts.map(r => (
                            <li key={r.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                                <span>Recibo Nº{r.receiptNumber} - {new Date(r.date + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                                <span className="font-semibold">{formatCurrency(r.amount)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div>
                    <form onSubmit={handleVoucherSubmit} className="flex items-end gap-2 mb-4 p-3 bg-gray-50 rounded-md">
                        <div className="flex-grow">
                            <label className="text-xs">Descripción</label>
                            <input type="text" name="description" value={voucherForm.description} onChange={handleVoucherFormChange} className="w-full mt-1 p-1 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">Monto</label>
                            <input type="number" name="amount" value={voucherForm.amount} onChange={handleVoucherFormChange} className="w-28 mt-1 p-1 border rounded" />
                        </div>
                        {editingVoucher ? (
                            <>
                                <button type="submit" className="bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 text-sm">Guardar</button>
                                <button type="button" onClick={cancelEdit} className="bg-gray-400 text-white px-3 py-1.5 rounded-md hover:bg-gray-500 text-sm">Cancelar</button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="text-xs">Archivo (Opcional)</label>
                                    <input type="file" onChange={handleFileChange} className="text-xs mt-1"/>
                                </div>
                                <button type="submit" className="bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 text-sm">Añadir Comp.</button>
                            </>
                        )}
                    </form>
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {quoteVouchers.map(v => (
                            <li key={v.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                                <div className="flex-grow">
                                    <p>{v.description}</p>
                                    {v.fileUrl && <a href={v.fileUrl} download={v.fileName} className="text-xs text-blue-600 hover:underline">Ver archivo</a>}
                                </div>
                                <div className="text-right ml-4">
                                    <p className="font-semibold">{formatCurrency(v.amount)}</p>
                                    <div className="space-x-2">
                                        <button onClick={() => handleEditVoucherClick(v)} className="text-xs text-blue-600">Editar</button>
                                        <button onClick={() => deleteVoucher(v.id)} className="text-xs text-red-600">Eliminar</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Modal>
    );
};

// --- HistoryTab ---
const HistoryTab: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
    const { quotes, updateQuoteStatus, getQuoteForDuplication, setQuoteToDuplicate, settings, showToast } = useAppContext();
    const [filter, setFilter] = useState({ text: '', status: 'all' as QuoteStatus | 'all' });

    const filteredQuotes = useMemo(() => {
        return quotes
            .filter(q => {
                const lowerCaseText = filter.text.toLowerCase();
                const textMatch = q.client.toLowerCase().includes(lowerCaseText) || String(q.id).includes(lowerCaseText);
                const statusMatch = filter.status === 'all' || q.status === filter.status;
                return textMatch && statusMatch;
            })
            .sort((a, b) => b.id - a.id);
    }, [quotes, filter]);

    const handleDuplicate = (id: number) => {
        const quote = getQuoteForDuplication(id);
        if (quote) {
            setQuoteToDuplicate(quote);
            setActiveTab('presupuesto');
        } else {
            showToast('No se encontró el presupuesto para duplicar.', 'error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Historial de Presupuestos</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Buscar por cliente o Nº..."
                    value={filter.text}
                    onChange={e => setFilter(p => ({ ...p, text: e.target.value }))}
                    className="flex-grow rounded-md border-gray-300 shadow-sm"
                />
                <select
                    value={filter.status}
                    onChange={e => setFilter(p => ({ ...p, status: e.target.value as QuoteStatus | 'all' }))}
                    className="rounded-md border-gray-300 shadow-sm"
                >
                    <option value="all">Todos los estados</option>
                    {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100"><tr className="text-left"><th className="p-2">Nº</th><th className="p-2">Fecha</th><th className="p-2">Cliente</th><th className="p-2">Total</th><th className="p-2">Estado</th><th className="p-2">Acciones</th></tr></thead>
                    <tbody className="divide-y">
                        {filteredQuotes.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50">
                                <td className="p-2 font-mono">{String(q.id).padStart(5, '0')}</td>
                                <td className="p-2">{new Date(q.date + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                                <td className="p-2">{q.client}</td>
                                <td className="p-2">{formatCurrency(q.total)}</td>
                                <td className="p-2">
                                    <select
                                        value={q.status}
                                        onChange={e => updateQuoteStatus(q.id, e.target.value as QuoteStatus)}
                                        className={`rounded-md p-1 border-0 text-xs ${getStatusClasses(q.status)}`}
                                    >
                                        {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="p-2 space-x-2">
                                    <button onClick={() => generateQuotePdf(q, settings)} className="text-blue-600 hover:underline">PDF</button>
                                    <button onClick={() => handleDuplicate(q.id)} className="text-green-600 hover:underline">Duplicar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const AppContent: React.FC = () => {
    const { currentUser } = useAppContext();
    const [activeTab, setActiveTab] = useState('catalogo');

    if (!currentUser) {
        return <LoginScreen />;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <Header />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <main>
                {activeTab === 'catalogo' && <CatalogueTab />}
                {activeTab === 'materiales' && <MaterialsTab />}
                {activeTab === 'productos' && <ProductsTab />}
                {activeTab === 'calculadora' && <ModuleCalculatorTab />}
                {activeTab === 'presupuesto' && <QuoteGeneratorTab setActiveTab={setActiveTab} />}
                {activeTab === 'en-proceso' && <WipTab />}
                {activeTab === 'historial' && <HistoryTab setActiveTab={setActiveTab} />}
                {activeTab === 'calendario' && <CalendarAndTasksTab />}
                {activeTab === 'configuracion' && <SettingsTab />}
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
            <Toast />
        </AppProvider>
    );
};

export default App;