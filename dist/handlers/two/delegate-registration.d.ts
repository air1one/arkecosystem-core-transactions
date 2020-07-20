import { Transactions } from "@arkecosystem/crypto";
import { One } from "../index";
export declare class DelegateRegistrationTransactionHandler extends One.DelegateRegistrationTransactionHandler {
    private readonly transactionHistoryService;
    getConstructor(): Transactions.TransactionConstructor;
    bootstrap(): Promise<void>;
}
