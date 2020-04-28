declare type ClientApi = {
    init: (config: Config) => void;
    track: (eventName: string, eventProperties?: Record<string, string | number | boolean>, callback?: () => void) => void;
    trackOnInit: (eventName: string, eventProperties?: Record<string, string | number | boolean>, callback?: () => void) => Promise<void>;
    updateTenant: (tenant: TenantConfig) => void;
    updateUser: (user: UserConfig) => void;
};
declare type Config = {
    apiKey: string;
    tenant?: TenantConfig;
    user?: UserConfig;
};
declare type TenantConfig = {
    distinctId: string;
    companyName: string;
    properties?: Record<string, string | number | boolean>;
};
declare type UserConfig = {
    distinctId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    properties?: Record<string, string | number | boolean>;
};
declare class LoopmetricsClient implements ClientApi {
    private internalTenantId;
    private internalUserId;
    private config;
    private httpClient;
    private onInitEvents;
    init(config: Config): Promise<void>;
    track(eventName: string, eventProperties?: Record<string, string | number | boolean>, callback?: () => void): Promise<void>;
    trackOnInit(eventName: string, eventProperties?: Record<string, string | number | boolean>, callback?: () => void): Promise<void>;
    updateTenant(updatedTenant: TenantConfig): void;
    private updateTenantAsync;
    updateUser(updatedUser: UserConfig): void;
    private updateUserAsync;
    private getGeolocation;
    private getDistinctUserIdFromLocalStorage;
    private appendProperties;
}
export declare const loopmetrics: LoopmetricsClient;
export default loopmetrics;
