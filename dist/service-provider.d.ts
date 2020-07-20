import { Providers } from "@arkecosystem/core-kernel";
export declare class ServiceProvider extends Providers.ServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    register(): Promise<void>;
    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    required(): Promise<boolean>;
}
