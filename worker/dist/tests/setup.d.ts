import { Miniflare } from 'miniflare';
declare global {
    var miniflare: Miniflare;
    var workerTestUtils: {
        createTestRequest: (method: string, url: string, options?: RequestInit) => Request;
        createAuthenticatedRequest: (method: string, url: string, token: string, options?: RequestInit) => Request;
        parseJsonResponse: (response: Response) => Promise<any>;
        createMockFormData: (files?: File[]) => FormData;
        createTestJWTToken: (payload: any) => string;
        mockCloudflareBindings: () => any;
    };
}
