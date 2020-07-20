export declare class TransactionHandlerProvider {
    private readonly attributeSet;
    private readonly handlers;
    private registered;
    isRegistrationRequired(): boolean;
    registerHandlers(): void;
    private registerHandler;
    private hasOtherHandlerHandling;
    private hasOtherHandlerInstance;
}
