/**
 * Mapa centralizado de acciones y los roles que las pueden realizar.
 * Basado en la tabla de permisos del sistema.
 * 
 * ROLES EN LA BASE DE DATOS:
 * - idrol=1: Administrativo
 * - idrol=2: Gerencial/TeamLeader  
 * - idrol=3: VIP
 * - idrol=4: Vista
 * - idrol=5: Owner
 */
export const ROLE_PERMISSIONS = {
    /**
     * EXPORTAR REPORTES
     * Roles: Owner, Administrativo, Gerencial/TeamLeader, VIP
     */
    EXPORTAR_REPORTES: ['Owner', 'Administrativo', 'Gerencial/TeamLeader', 'VIP'],

    /**
     * VER DASHBOARD
     * Roles: Owner, Gerencial/TeamLeader, VIP
     */
    VER_DASHBOARD: ['Owner', 'Gerencial/TeamLeader', 'VIP'],

    /**
     * VER REPORTES (Módulo de reportes)
     * Roles: Owner, Administrativo, Gerencial/TeamLeader, VIP
     */
    VER_REPORTES: ['Owner', 'Administrativo', 'Gerencial/TeamLeader', 'VIP'],

    /**
     * CREAR COTIZACIONES (incluye nueva cotización desde contrato)
     * Roles: Owner, Administrativo
     */
    CREAR_COTIZACIONES: ['Owner', 'Administrativo'],

    /**
     * VER COTIZACIONES (Módulo de cotizaciones)
     * Roles: Todos los roles pueden ver
     */
    VER_COTIZACIONES: ['Owner', 'Administrativo', 'Gerencial/TeamLeader', 'VIP', 'Vista'],

    /**
     * GESTIONAR CLIENTES (crear, editar clientes/contactos)
     * Roles: Owner, Administrativo
     */
    GESTIONAR_CLIENTES: ['Owner', 'Administrativo'],

    /**
     * VER CLIENTES (Solo vista de clientes)
     * Roles: Todos excepto Vista
     */
    VER_CLIENTES: ['Owner', 'Administrativo', 'Gerencial/TeamLeader', 'VIP'],

    /**
     * GESTIONAR USUARIOS (Módulo de usuarios del sistema)
     * Roles: Solo Owner
     */
    GESTIONAR_USUARIOS: ['Owner'],

    /**
     * VER PROVEEDORES (Módulo de proveedores)
     * Roles: Owner, Administrativo, Gerencial/TeamLeader
     */
    VER_PROVEEDORES: ['Owner', 'Administrativo', 'Gerencial/TeamLeader'],

    /**
     * GESTIONAR PROVEEDORES (Crear, editar, eliminar proveedores y relacionar servicios)
     * Roles: Owner, Administrativo
     */
    GESTIONAR_PROVEEDORES: ['Owner', 'Administrativo'],

    /**
     * VER FAMILIA SERVICIOS (Módulo de familias de servicios y servicios)
     * Roles: Owner, Administrativo, Gerencial/TeamLeader
     */
    VER_FAMILIA_SERVICIOS: ['Owner', 'Administrativo', 'Gerencial/TeamLeader'],

    /**
     * GESTIONAR FAMILIA SERVICIOS (Crear, editar, eliminar familias y servicios)
     * Roles: Owner, Administrativo
     */
    GESTIONAR_FAMILIA_SERVICIOS: ['Owner', 'Administrativo'],

    /**
     * VER CADENCIA (Dashboard de cadencia)
     * Roles: Owner, Gerencial/TeamLeader, VIP (NO Administrativo)
     */
    VER_CADENCIA: ['Owner', 'Gerencial/TeamLeader', 'VIP'],

    /**
     * CAMBIAR ESTADO COTIZACION (Aprobar, anular, etc.)
     * Roles: Owner, Administrativo, Gerencial/TeamLeader
     * Nota: En estado solo puede cambiar de BORRADOR a VIGENTE o ANULAR
     */
    CAMBIAR_ESTADO_COTIZACION: ['Owner', 'Administrativo', 'Gerencial/TeamLeader'],
} as const;

/**
 * Tipo TypeScript para las acciones disponibles
 */
export type RoleAction = keyof typeof ROLE_PERMISSIONS;

/**
 * Nombres de roles en el sistema (según nombreRol en BD)
 */
export const ROLE_NAMES = {
    OWNER: 'Owner',
    ADMINISTRATIVO: 'Administrativo',
    GERENCIAL: 'Gerencial/TeamLeader',
    VIP: 'VIP',
    VISTA: 'Vista',
} as const;
