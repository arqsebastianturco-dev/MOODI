import { User, Material, Product, Quote, Settings, UserRole, QuoteStatus, Voucher, Receipt } from './types.ts';

export const INITIAL_USERS: User[] = [
    { username: 'admin', password: 'admin', role: UserRole.Admin },
    { username: 'ventas', password: 'ventas', role: UserRole.Ventas },
    { username: 'taller', password: 'taller', role: UserRole.Taller }
];

export const INITIAL_MATERIALS: Material[] = [
    // Tableros de MDF y Aglomerado
    { id: 'mat-1', code: 'TAB-001', description: 'Melamina Blanca 18mm sobre MDF', type: 'Tablero', unit: 'm²', price: 15904.57, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 80000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-2', code: 'TAB-002', description: 'Melamina Blanca 15mm sobre MDF', type: 'Tablero', unit: 'm²', price: 14910.53, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 75000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-3', code: 'TAB-003', description: 'Melamina Blanca 12mm sobre MDF', type: 'Tablero', unit: 'm²', price: 13916.5, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 70000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-4', code: 'TAB-004', description: 'Melamina Haya 18mm sobre MDF', type: 'Tablero', unit: 'm²', price: 18886.68, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 95000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-5', code: 'TAB-005', description: 'Melamina Wengue 18mm sobre MDF', type: 'Tablero', unit: 'm²', price: 18886.68, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 95000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-6', code: 'TAB-006', description: 'MDF Crudo 18mm', type: 'Tablero', unit: 'm²', price: 11928.43, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 60000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-7', code: 'TAB-007', description: 'MDF Crudo 5.5mm', type: 'Tablero', unit: 'm²', price: 5964.21, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 30000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-8', code: 'TAB-008', description: 'MDF Crudo 3mm (Fibroplus)', type: 'Tablero', unit: 'm²', price: 3976.14, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 20000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-9', code: 'TAB-009', description: 'Melamina Blanca 18mm sobre Aglomerado', type: 'Tablero', unit: 'm²', price: 12922.46, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 65000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-10', code: 'TAB-010', description: 'MDF Enchapado Paraíso 18mm', type: 'Tablero', unit: 'm²', price: 29821.07, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 150000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-11', code: 'TAB-011', description: 'Fenólico 18mm', type: 'Tablero', unit: 'm²', price: 18000, lastUpdated: '2025-08-10T12:00:00.000Z', commercialUnit: 'placa', commercialPrice: 54000, unitsPerCommercialUnit: 3, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // Tapacantos
    { id: 'mat-12', code: 'TAP-001', description: 'Tapacanto PVC Blanco 0.45mm', type: 'Tapacanto', unit: 'ml', price: 275, lastUpdated: '2025-08-11T09:30:00.000Z', commercialUnit: 'rollo', commercialPrice: 27500, unitsPerCommercialUnit: 100, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-13', code: 'TAP-002', description: 'Tapacanto PVC Haya 0.45mm', type: 'Tapacanto', unit: 'ml', price: 350, lastUpdated: '2025-08-11T09:30:00.000Z', commercialUnit: 'rollo', commercialPrice: 35000, unitsPerCommercialUnit: 100, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-14', code: 'TAP-003', description: 'Tapacanto PVC Blanco 2mm', type: 'Tapacanto', unit: 'ml', price: 800, lastUpdated: '2025-08-11T09:30:00.000Z', commercialUnit: 'rollo', commercialPrice: 40000, unitsPerCommercialUnit: 50, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-15', code: 'TAP-004', description: 'Tapacanto ABS Paraíso 0.45mm', type: 'Tapacanto', unit: 'ml', price: 500, lastUpdated: '2025-08-11T09:30:00.000Z', commercialUnit: 'rollo', commercialPrice: 50000, unitsPerCommercialUnit: 100, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // Herrajes
    { id: 'mat-16', code: 'HER-001', description: 'Corredera Telescópica 400mm', type: 'Herraje', unit: 'u', price: 4500, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 4500, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-17', code: 'HER-002', description: 'Bisagra Codo 0 (recta)', type: 'Herraje', unit: 'u', price: 900, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 900, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-18', code: 'HER-003', description: 'Pistón a Gas 80N', type: 'Herraje', unit: 'u', price: 2500, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 2500, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-19', code: 'HER-004', description: 'Manija Barral 128mm Aluminio', type: 'Herraje', unit: 'u', price: 1800, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 1800, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-20', code: 'HER-005', description: 'Sistema Push-on para puerta', type: 'Herraje', unit: 'u', price: 2200, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 2200, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-21', code: 'HER-006', description: 'Pata Plástica Regulable 10cm', type: 'Herraje', unit: 'u', price: 500, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 500, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // Uniones y Tornillería
    { id: 'mat-22', code: 'TOR-001', description: 'Tornillo Fix 3.5x50mm', type: 'Tornillería', unit: 'u', price: 50, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'caja', commercialPrice: 10000, unitsPerCommercialUnit: 200, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-23', code: 'TOR-002', description: 'Tornillo Fix 4x30mm', type: 'Tornillería', unit: 'u', price: 40, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'caja', commercialPrice: 8000, unitsPerCommercialUnit: 200, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-24', code: 'TOR-003', description: 'Sistema Minifix 15mm', type: 'Unión', unit: 'u', price: 300, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 300, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-25', code: 'TOR-004', description: 'Tarugo de Madera 8mm', type: 'Unión', unit: 'u', price: 20, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'bolsa', commercialPrice: 2000, unitsPerCommercialUnit: 100, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-26', code: 'ADH-001', description: 'Cola de Carpintero 1kg', type: 'Adhesivo', unit: 'kg', price: 5000, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 5000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // Terminaciones
    { id: 'mat-27', code: 'TER-001', description: 'Laca Poliuretánica Transparente', type: 'Terminación', unit: 'litro', price: 15000, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'lata', commercialPrice: 15000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-28', code: 'TER-002', description: 'Barniz Marino', type: 'Terminación', unit: 'litro', price: 10000, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'lata', commercialPrice: 10000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-29', code: 'TER-003', description: 'Sellador para Madera', type: 'Terminación', unit: 'litro', price: 8000, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'lata', commercialPrice: 8000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // Servicios
    { id: 'mat-30', code: 'SER-001', description: 'Corte de placa', type: 'Servicio', unit: 'u', price: 2000, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'placa', commercialPrice: 2000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-31', code: 'SER-002', description: 'Pegado de canto PVC 0.45mm', type: 'Servicio', unit: 'ml', price: 350, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'ml', commercialPrice: 350, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-32', code: 'SER-003', description: 'Pegado de canto PVC 2mm', type: 'Servicio', unit: 'ml', price: 900, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'ml', commercialPrice: 900, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-33', code: 'SER-004', description: 'Maquinado CNC (Perforaciones para Minifix)', type: 'Servicio', unit: 'u', price: 150, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'u', commercialPrice: 150, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-34', code: 'SER-005', description: 'Servicio de Laqueado', type: 'Servicio', unit: 'm²', price: 25000, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'm²', commercialPrice: 25000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-35', code: 'SER-006', description: 'Armado de mueble', type: 'Servicio', unit: 'hora', price: 10000, lastUpdated: '2025-08-12T15:00:00.000Z', commercialUnit: 'hora', commercialPrice: 10000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    
    // Herrajes de Placard
    { id: 'mat-36', code: 'HER-007', description: 'Barral Oval Cromado', type: 'Herraje', unit: 'ml', price: 4500, lastUpdated: '2025-08-15T10:00:00.000Z', commercialUnit: 'tira 3m', commercialPrice: 13500, unitsPerCommercialUnit: 3, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-37', code: 'HER-008', description: 'Soporte Central para Barral Oval', type: 'Herraje', unit: 'u', price: 800, lastUpdated: '2025-08-15T10:00:00.000Z', commercialUnit: 'u', commercialPrice: 800, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-38', code: 'HER-009', description: 'Soporte Lateral para Barral Oval', type: 'Herraje', unit: 'u', price: 600, lastUpdated: '2025-08-15T10:00:00.000Z', commercialUnit: 'u', commercialPrice: 600, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- FAPLAC (Tableros) ---
    { id: 'mat-39', code: 'TAB-FAP-001', description: 'FAPLAC Melamina Lino 18mm', type: 'Tablero', unit: 'm²', price: 19880.71, lastUpdated: '2025-08-16T10:00:00.000Z', commercialUnit: 'placa', commercialPrice: 100000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-40', code: 'TAB-FAP-002', description: 'FAPLAC Melamina Teka Oslo 18mm', type: 'Tablero', unit: 'm²', price: 21878.72, lastUpdated: '2025-08-16T10:00:00.000Z', commercialUnit: 'placa', commercialPrice: 110000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-41', code: 'TAB-FAP-003', description: 'FAPLAC Melamina Báltico 18mm', type: 'Tablero', unit: 'm²', price: 21878.72, lastUpdated: '2025-08-16T10:00:00.000Z', commercialUnit: 'placa', commercialPrice: 110000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-42', code: 'TAB-FAP-004', description: 'FAPLAC Melamina Negro 18mm', type: 'Tablero', unit: 'm²', price: 20874.75, lastUpdated: '2025-08-16T10:00:00.000Z', commercialUnit: 'placa', commercialPrice: 105000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- HEGGER (Tableros) ---
    { id: 'mat-43', code: 'TAB-HEG-001', description: 'HEGGER Melamina Roble Americano 18mm', type: 'Tablero', unit: 'm²', price: 22872.76, lastUpdated: '2025-08-16T10:00:00.000Z', commercialUnit: 'placa', commercialPrice: 115000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-44', code: 'TAB-HEG-002', description: 'HEGGER Melamina Cemento Alisado 18mm', type: 'Tablero', unit: 'm²', price: 23870.77, lastUpdated: '2025-08-16T10:00:00.000Z', commercialUnit: 'placa', commercialPrice: 120000, unitsPerCommercialUnit: 5.03, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- Tapacantos (Coincidentes) ---
    { id: 'mat-45', code: 'TAP-FAP-001', description: 'Tapacanto PVC Lino 0.45mm', type: 'Tapacanto', unit: 'ml', price: 400, lastUpdated: '2025-08-16T11:00:00.000Z', commercialUnit: 'rollo', commercialPrice: 40000, unitsPerCommercialUnit: 100, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-46', code: 'TAP-FAP-002', description: 'Tapacanto PVC Teka Oslo 0.45mm', type: 'Tapacanto', unit: 'ml', price: 450, lastUpdated: '2025-08-16T11:00:00.000Z', commercialUnit: 'rollo', commercialPrice: 45000, unitsPerCommercialUnit: 100, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-47', code: 'TAP-HEG-001', description: 'Tapacanto PVC Roble Americano 2mm', type: 'Tapacanto', unit: 'ml', price: 950, lastUpdated: '2025-08-16T11:00:00.000Z', commercialUnit: 'rollo', commercialPrice: 47500, unitsPerCommercialUnit: 50, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- BLUM (Herrajes) ---
    { id: 'mat-48', code: 'HER-BLU-001', description: 'Bisagra CLIP top BLUMOTION 110° Codo 0', type: 'Herraje', unit: 'u', price: 5500, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'u', commercialPrice: 5500, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-49', code: 'HER-BLU-002', description: 'Sistema Aventos HK-S BLUMOTION', type: 'Herraje', unit: 'u', price: 35000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'juego', commercialPrice: 35000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-50', code: 'HER-BLU-003', description: 'Guía TANDEM plus BLUMOTION 500mm', type: 'Herraje', unit: 'u', price: 28000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'juego', commercialPrice: 28000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-51', code: 'HER-BLU-004', description: 'Cajón LEGRABOX pure M 500mm', type: 'Herraje', unit: 'u', price: 65000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'juego', commercialPrice: 65000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- HAFELE (Herrajes) ---
    { id: 'mat-52', code: 'HER-HAF-001', description: 'Corredera Telescópica C/S 450mm Hafele', type: 'Herraje', unit: 'u', price: 7500, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'juego', commercialPrice: 7500, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-53', code: 'HER-HAF-002', description: 'Perno de unión Minifix 15 Hafele', type: 'Herraje', unit: 'u', price: 450, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'u', commercialPrice: 450, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-54', code: 'HER-HAF-003', description: 'Tira LED Loox 24V 3000K', type: 'Iluminación', unit: 'ml', price: 12000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'rollo 5m', commercialPrice: 60000, unitsPerCommercialUnit: 5, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-55', code: 'HER-HAF-004', description: 'Transformador Loox 24V 30W', type: 'Iluminación', unit: 'u', price: 25000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'u', commercialPrice: 25000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- DUCASSE (Herrajes y Sistemas) ---
    { id: 'mat-56', code: 'SIS-DUC-001', description: 'Sistema Corredizo CD50 M Ducasse', type: 'Sistema Corredizo', unit: 'u', price: 25000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'kit', commercialPrice: 25000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-57', code: 'HER-DUC-001', description: 'Pistón a Gas Inverso 100N Ducasse', type: 'Herraje', unit: 'u', price: 3200, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'u', commercialPrice: 3200, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- EUROHARD (Herrajes) ---
    { id: 'mat-58', code: 'HER-EUR-001', description: 'Corredera Telescópica Push Open 400mm Eurohard', type: 'Herraje', unit: 'u', price: 6800, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'juego', commercialPrice: 6800, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-59', code: 'HER-EUR-002', description: 'Bisagra Cierre Suave Codo 0 Eurohard', type: 'Herraje', unit: 'u', price: 1500, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'u', commercialPrice: 1500, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-60', code: 'HER-EUR-003', description: 'Tirador Perfil Aluminio Negro', type: 'Herraje', unit: 'ml', price: 9000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'tira 3m', commercialPrice: 27000, unitsPerCommercialUnit: 3, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- GRUPO EURO & BRONZE (Perfiles de Aluminio) ---
    { id: 'mat-61', code: 'PER-GEU-001', description: 'Perfil Gola Superior Aluminio Anodizado', type: 'Perfil', unit: 'ml', price: 10000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'tira 3m', commercialPrice: 30000, unitsPerCommercialUnit: 3, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-62', code: 'PER-GEU-002', description: 'Perfil Gola Inferior (L) Aluminio Anodizado', type: 'Perfil', unit: 'ml', price: 11500, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'tira 3m', commercialPrice: 34500, unitsPerCommercialUnit: 3, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-63', code: 'PER-BRO-001', description: 'Perfil Puerta Vidrio 4mm Anodizado', type: 'Perfil', unit: 'ml', price: 8500, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'tira 3m', commercialPrice: 25500, unitsPerCommercialUnit: 3, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- UNIHOPPER (Sistemas) ---
    { id: 'mat-64', code: 'SIS-UNI-001', description: 'Kit Placard Classic 2 Puertas 2mts Uniluminio', type: 'Sistema Corredizo', unit: 'u', price: 45000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'kit', commercialPrice: 45000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    { id: 'mat-65', code: 'SIS-UNI-002', description: 'Kit Placard Colgante DN-80 PL 2mts', type: 'Sistema Corredizo', unit: 'u', price: 52000, lastUpdated: '2025-08-16T12:00:00.000Z', commercialUnit: 'kit', commercialPrice: 52000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null },
    
    // --- Embalaje ---
    { id: 'mat-66', code: 'EMB-001', description: 'Film Stretch 50cm', type: 'Embalaje', unit: 'ml', price: 100, lastUpdated: '2025-08-17T10:00:00.000Z', commercialUnit: 'rollo 100m', commercialPrice: 10000, unitsPerCommercialUnit: 100, imageUrl: null, brochureUrl: null, brochureFilename: null },

    // --- Vidrios ---
    { id: 'mat-67', code: 'VID-001', description: 'Vidrio Incoloro 3mm', type: 'Vidrio', unit: 'm²', price: 18000, lastUpdated: '2025-08-18T10:00:00.000Z', commercialUnit: 'm²', commercialPrice: 18000, unitsPerCommercialUnit: 1, imageUrl: null, brochureUrl: null, brochureFilename: null }
];


export const INITIAL_PRODUCTS: Product[] = [
    // --- COCINA ---
    {
        id: 'prod-1',
        name: 'Bajo Mesada 2 Puertas (80cm)',
        description: 'Bajo mesada estándar de 80cm con dos puertas y un estante interior regulable. Ideal para cocinas modernas y funcionales.',
        code: 'COC-001',
        type: 'Cocina',
        cost: 0,
        laborPercent: 100,
        imageUrl: 'https://picsum.photos/600/400?random=1',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 3.5 },    // Melamina Blanca 18mm
            { materialId: 'mat-8', quantity: 0.6 },    // MDF Crudo 3mm (Fondo)
            { materialId: 'mat-12', quantity: 10 },    // Tapacanto PVC Blanco 0.45mm
            { materialId: 'mat-17', quantity: 4 },     // Bisagra Codo 0
            { materialId: 'mat-21', quantity: 4 },     // Pata Plástica
            { materialId: 'mat-19', quantity: 2 },     // Manija Barral
        ]
    },
    {
        id: 'prod-2',
        name: 'Bajo Mesada Cajonero (60cm)',
        description: 'Módulo bajo mesada de 60cm con tres amplios cajones con correderas telescópicas. Perfecto para ollas y utensilios.',
        code: 'COC-002',
        type: 'Cocina',
        cost: 0,
        laborPercent: 120,
        imageUrl: 'https://picsum.photos/600/400?random=2',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 3.0 },     // Melamina Blanca 18mm (Estructura y frentes)
            { materialId: 'mat-2', quantity: 1.5 },     // Melamina Blanca 15mm (Interior cajones)
            { materialId: 'mat-8', quantity: 0.8 },     // MDF Crudo 3mm (Fondos)
            { materialId: 'mat-12', quantity: 12 },    // Tapacanto PVC Blanco
            { materialId: 'mat-16', quantity: 3 },     // Corredera Telescópica
            { materialId: 'mat-21', quantity: 4 },     // Pata Plástica
            { materialId: 'mat-19', quantity: 3 },     // Manija Barral
        ]
    },
    {
        id: 'prod-3',
        name: 'Alacena 2 Puertas (80cm)',
        description: 'Alacena de 80cm de ancho y 60cm de alto con dos puertas y estante interior. Maximiza el espacio de guardado aéreo.',
        code: 'COC-003',
        type: 'Cocina',
        cost: 0,
        laborPercent: 100,
        imageUrl: 'https://picsum.photos/600/400?random=3',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 2.5 },    // Melamina Blanca 18mm
            { materialId: 'mat-8', quantity: 0.5 },    // MDF Crudo 3mm (Fondo)
            { materialId: 'mat-12', quantity: 8 },     // Tapacanto PVC Blanco
            { materialId: 'mat-17', quantity: 4 },     // Bisagra Codo 0
            { materialId: 'mat-19', quantity: 2 },     // Manija Barral
        ]
    },
    {
        id: 'prod-4',
        name: 'Columna Horno y Microondas (60cm)',
        description: 'Módulo columna de 60cm de ancho para empotrar horno y microondas. Incluye puerta superior e inferior para guardado.',
        code: 'COC-004',
        type: 'Cocina',
        cost: 0,
        laborPercent: 110,
        imageUrl: 'https://picsum.photos/600/400?random=4',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 4.5 },    // Melamina Blanca 18mm
            { materialId: 'mat-8', quantity: 1.3 },    // MDF Crudo 3mm (Fondo)
            { materialId: 'mat-12', quantity: 15 },    // Tapacanto PVC Blanco
            { materialId: 'mat-17', quantity: 4 },     // Bisagra Codo 0
            { materialId: 'mat-19', quantity: 2 },     // Manija Barral
            { materialId: 'mat-21', quantity: 4 },     // Pata Plástica
        ]
    },
     // --- DORMITORIO ---
    {
        id: 'prod-5',
        name: 'Módulo Placard Cajonera (60cm)',
        description: 'Módulo para interior de placard de 60cm de ancho con 4 cajones. Ideal para organizar ropa interior, remeras y accesorios.',
        code: 'DOR-001',
        type: 'Dormitorio',
        cost: 0,
        laborPercent: 120,
        imageUrl: 'https://picsum.photos/600/400?random=5',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 2.8 },     // Melamina Blanca 18mm (Estructura y frentes)
            { materialId: 'mat-2', quantity: 1.8 },     // Melamina Blanca 15mm (Interior cajones)
            { materialId: 'mat-8', quantity: 0.6 },     // MDF Crudo 3mm (Fondos)
            { materialId: 'mat-12', quantity: 10 },    // Tapacanto PVC Blanco
            { materialId: 'mat-16', quantity: 4 },     // Corredera Telescópica
            { materialId: 'mat-19', quantity: 4 },     // Manija Barral
        ]
    },
    {
        id: 'prod-6',
        name: 'Módulo Placard Barral y Estantes (80cm)',
        description: 'Módulo de 80cm para interior de placard. Incluye doble barral para colgado corto y estante superior tipo baulera.',
        code: 'DOR-002',
        type: 'Dormitorio',
        cost: 0,
        laborPercent: 90,
        imageUrl: 'https://picsum.photos/600/400?random=6',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 3.8 },    // Melamina Blanca 18mm
            { materialId: 'mat-8', quantity: 1.8 },    // MDF Crudo 3mm (Fondo)
            { materialId: 'mat-12', quantity: 8 },     // Tapacanto PVC Blanco
            { materialId: 'mat-36', quantity: 1.6 },   // Barral Oval Cromado (2x 0.76m)
            { materialId: 'mat-38', quantity: 4 },     // Soporte Lateral Barral
        ]
    },
    {
        id: 'prod-7',
        name: 'Mesa de Luz 1 Cajón',
        description: 'Mesa de luz flotante o con patas, con un cajón y un hueco inferior. Diseño minimalista y funcional.',
        code: 'DOR-003',
        type: 'Dormitorio',
        cost: 0,
        laborPercent: 130,
        imageUrl: 'https://picsum.photos/600/400?random=7',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-4', quantity: 1.2 },    // Melamina Haya 18mm
            { materialId: 'mat-8', quantity: 0.3 },    // Fondo 3mm
            { materialId: 'mat-13', quantity: 5 },     // Tapacanto Haya
            { materialId: 'mat-16', quantity: 1 },     // Corredera Telescópica
        ]
    },
    {
        id: 'prod-8',
        name: 'Ropero 2 Puertas (80cm)',
        description: 'Ropero de 80cm de ancho por 1.80m de alto. Incluye barral para colgar, estante superior y dos cajones inferiores.',
        code: 'DOR-004',
        type: 'Dormitorio',
        cost: 0,
        laborPercent: 100,
        imageUrl: 'https://picsum.photos/600/400?random=8',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 6.5 },     // Melamina Blanca 18mm
            { materialId: 'mat-8', quantity: 1.5 },     // Fondo 3mm
            { materialId: 'mat-12', quantity: 20 },    // Tapacanto PVC Blanco
            { materialId: 'mat-17', quantity: 6 },     // Bisagras
            { materialId: 'mat-16', quantity: 2 },     // Correderas
            { materialId: 'mat-19', quantity: 4 },     // Manijas (2 puertas, 2 cajones)
            { materialId: 'mat-36', quantity: 0.8 },   // Barral
            { materialId: 'mat-38', quantity: 2 },     // Soportes barral
        ]
    },
    // --- LIVING ---
    {
        id: 'prod-9',
        name: 'Rack TV Flotante (140cm)',
        description: 'Módulo flotante para TV de 140cm de ancho. Cuenta con dos espacios de guardado con puertas rebatibles y estantes a la vista.',
        code: 'LIV-001',
        type: 'Living',
        cost: 0,
        laborPercent: 120,
        imageUrl: 'https://picsum.photos/600/400?random=9',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-5', quantity: 2.0 },    // Melamina Wengue 18mm
            { materialId: 'mat-12', quantity: 8 },     // Tapacanto PVC Blanco (para interior)
            { materialId: 'mat-18', quantity: 2 },     // Pistón a Gas
            { materialId: 'mat-17', quantity: 4 },     // Bisagras
        ]
    },
    {
        id: 'prod-10',
        name: 'Módulo Biblioteca (40cm)',
        description: 'Módulo de biblioteca de 40cm de ancho por 1.80m de alto con 5 estantes regulables. Combinable para armar grandes bibliotecas.',
        code: 'LIV-002',
        type: 'Living',
        cost: 0,
        laborPercent: 90,
        imageUrl: 'https://picsum.photos/600/400?random=10',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-10', quantity: 3.0 },   // MDF Enchapado Paraíso 18mm
            { materialId: 'mat-8', quantity: 0.8 },    // Fondo 3mm
            { materialId: 'mat-15', quantity: 12 },    // Tapacanto ABS Paraíso
            { materialId: 'mat-27', quantity: 0.5 },   // Laca Poliuretánica
        ]
    },
    // --- BAÑO ---
    {
        id: 'prod-11',
        name: 'Vanitory Colgante (60cm)',
        description: 'Mueble vanitory colgante de 60cm con dos puertas. Diseño moderno sin patas que facilita la limpieza del baño.',
        code: 'BAN-001',
        type: 'Baño',
        cost: 0,
        laborPercent: 110,
        imageUrl: 'https://picsum.photos/600/400?random=11',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-6', quantity: 1.5 },    // MDF Crudo 18mm (para laquear)
            { materialId: 'mat-12', quantity: 6 },     // Tapacanto (interno)
            { materialId: 'mat-17', quantity: 4 },     // Bisagras
            { materialId: 'mat-20', quantity: 2 },     // Sistema Push-on
            { materialId: 'mat-34', quantity: 1.0 },   // Servicio de Laqueado m²
        ]
    },
    // --- NUEVOS PRODUCTOS ---
    {
        id: 'prod-12',
        name: 'Bajo Mesada Premium (80cm)',
        description: 'Bajo mesada de 80cm con 2 cajones LEGRABOX de BLUM y 1 puerta con bisagras cierre suave. Frentes en melamina texturada HEGGER.',
        code: 'COC-PRE-001',
        type: 'Cocina',
        cost: 0,
        laborPercent: 150,
        imageUrl: 'https://picsum.photos/600/400?random=12',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 2.0 },    // Melamina Blanca 18mm (Interior)
            { materialId: 'mat-44', quantity: 1.5 },   // HEGGER Melamina Cemento (Frentes)
            { materialId: 'mat-8', quantity: 0.6 },    // MDF Crudo 3mm (Fondo)
            { materialId: 'mat-12', quantity: 8 },     // Tapacanto Blanco
            { materialId: 'mat-48', quantity: 2 },     // Bisagra BLUMOTION
            { materialId: 'mat-51', quantity: 2 },     // Cajón LEGRABOX
            { materialId: 'mat-21', quantity: 4 },     // Pata Plástica
            { materialId: 'mat-61', quantity: 0.8 },   // Perfil Gola Superior
        ]
    },
    {
        id: 'prod-13',
        name: 'Alacena Rebatible (90cm)',
        description: 'Alacena de 90cm de ancho con puerta rebatible y sistema de elevación Aventos de BLUM. Ideal para ubicar sobre heladeras o en espacios modernos.',
        code: 'COC-PRE-002',
        type: 'Cocina',
        cost: 0,
        laborPercent: 130,
        imageUrl: 'https://picsum.photos/600/400?random=13',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-40', quantity: 2.2 },   // FAPLAC Melamina Teka Oslo
            { materialId: 'mat-8', quantity: 0.5 },    // MDF Crudo 3mm (Fondo)
            { materialId: 'mat-46', quantity: 7 },     // Tapacanto Teka Oslo
            { materialId: 'mat-49', quantity: 1 },     // Sistema Aventos HK-S
        ]
    },
    {
        id: 'prod-14',
        name: 'Cajonera Chifonier (60cm)',
        description: 'Cajonera de 5 cajones con correderas telescópicas cierre suave. Cuerpo en melamina Lino y tapa superior en maderado.',
        code: 'DOR-005',
        type: 'Dormitorio',
        cost: 0,
        laborPercent: 110,
        imageUrl: 'https://picsum.photos/600/400?random=14',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-39', quantity: 3.5 },   // FAPLAC Melamina Lino
            { materialId: 'mat-43', quantity: 0.5 },   // HEGGER Roble Americano (Tapa)
            { materialId: 'mat-8', quantity: 1.0 },    // MDF Crudo 3mm (Fondos)
            { materialId: 'mat-45', quantity: 15 },    // Tapacanto Lino
            { materialId: 'mat-52', quantity: 5 },     // Corredera C/S Hafele
        ]
    },
    {
        id: 'prod-15',
        name: 'Cama 2 Plazas con 4 Cajones',
        description: 'Base de cama para colchón de 140x190cm. Incluye 4 amplios cajones laterales para guardado. No incluye respaldo.',
        code: 'DOR-006',
        type: 'Dormitorio',
        cost: 0,
        laborPercent: 100,
        imageUrl: 'https://picsum.photos/600/400?random=15',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 8.0 },    // Melamina Blanca 18mm
            { materialId: 'mat-8', quantity: 2.0 },    // Fondo 3mm
            { materialId: 'mat-12', quantity: 25 },    // Tapacanto PVC Blanco
            { materialId: 'mat-58', quantity: 4 },     // Corredera Push Open Eurohard
        ]
    },
    {
        id: 'prod-16',
        name: 'Rack TV Nórdico (160cm)',
        description: 'Rack de TV estilo nórdico, 160cm de ancho. Combina melamina blanca con detalles en Paraíso. Puertas con sistema push-on.',
        code: 'LIV-003',
        type: 'Living',
        cost: 0,
        laborPercent: 120,
        imageUrl: 'https://picsum.photos/600/400?random=16',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 2.5 },    // Melamina Blanca 18mm
            { materialId: 'mat-10', quantity: 1.0 },   // MDF Enchapado Paraíso (Puertas y patas)
            { materialId: 'mat-12', quantity: 10 },    // Tapacanto PVC Blanco
            { materialId: 'mat-15', quantity: 6 },     // Tapacanto Paraíso
            { materialId: 'mat-59', quantity: 4 },     // Bisagra CS Eurohard
            { materialId: 'mat-20', quantity: 2 },     // Sistema Push-on
            { materialId: 'mat-28', quantity: 0.2 },   // Barniz Marino (para paraíso)
        ]
    },
    {
        id: 'prod-17',
        name: 'Ropero Puertas Corredizas (180cm)',
        description: 'Ropero de 180cm de ancho con dos puertas corredizas con sistema Uniluminio. Interior completo con barrales, estantes y cajonera.',
        code: 'DOR-007',
        type: 'Dormitorio',
        cost: 0,
        laborPercent: 110,
        imageUrl: 'https://picsum.photos/600/400?random=17',
        planPdfUrl: null, planPdfFilename: null,
        showInCatalogue: true,
        materials: [
            { materialId: 'mat-1', quantity: 10.0 },   // Melamina Blanca 18mm (Interior)
            { materialId: 'mat-41', quantity: 4.5 },   // FAPLAC Báltico (Puertas)
            { materialId: 'mat-8', quantity: 3.0 },    // Fondo 3mm
            { materialId: 'mat-12', quantity: 15 },    // Tapacanto PVC Blanco
            { materialId: 'mat-16', quantity: 3 },     // Correderas (cajonera interna)
            { materialId: 'mat-36', quantity: 1.8 },   // Barral
            { materialId: 'mat-38', quantity: 4 },     // Soportes barral
            { materialId: 'mat-64', quantity: 1 },     // Kit Placard Classic Uniluminio
        ]
    }
];

export const INITIAL_QUOTES: Quote[] = [];
export const INITIAL_VOUCHERS: Voucher[] = [];
export const INITIAL_RECEIPTS: Receipt[] = [];


export const INITIAL_SETTINGS: Settings = {
    companyName: 'Tu Fábrica de Muebles',
    address: 'Calle Falsa 123, Ciudad',
    phone: '+54 9 11 1234-5678',
    email: 'contacto@tufabrica.com',
    website: 'www.tufabrica.com',
    logoUrl: 'https://picsum.photos/200/80'
};