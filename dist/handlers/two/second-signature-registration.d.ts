import { Transactions } from "@arkecosystem/crypto";
import { One } from "../index";
export declare class SecondSignatureRegistrationTransactionHandler extends One.SecondSignatureRegistrationTransactionHandler {
    private readonly transactionHistoryService;
    getConstructor(): Transactions.TransactionConstructor;
    bootstrap(): Promise<void>;
}
