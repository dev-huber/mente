/**
 * Development Server - Substitui Azure Functions Core Tools
 * Servidor Express.js que simula o ambiente Azure Functions para desenvolvimento local
 */
declare const app: import("express-serve-static-core").Express;
declare function startServer(): Promise<void>;
export { app, startServer };
//# sourceMappingURL=dev-server.d.ts.map