/**
 * Azure Function - Upload de Áudio para "Quem Mente Menos?"
 * Endpoint principal com validação defensiva completa
 */
import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
export declare function audioUpload(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
export declare function healthCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
//# sourceMappingURL=audioUpload.d.ts.map