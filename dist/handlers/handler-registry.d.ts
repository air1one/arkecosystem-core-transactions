import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";
export declare class TransactionHandlerRegistry {
    private readonly provider;
    private readonly handlers;
    initialize(): void;
    getRegisteredHandlers(): TransactionHandler[];
    getRegisteredHandlerByType(internalType: Transactions.InternalTransactionType, version?: number): TransactionHandler;
    getActivatedHandlers(): Promise<TransactionHandler[]>;
    getActivatedHandlerByType(internalType: Transactions.InternalTransactionType, version?: number): Promise<TransactionHandler>;
    getActivatedHandlerForData(transactionData: Interfaces.ITransactionData): Promise<TransactionHandler>;
}
