import { Transactions } from "@arkecosystem/crypto";
import { One } from "../index";
export declare class TransferTransactionHandler extends One.TransferTransactionHandler {
    getConstructor(): Transactions.TransactionConstructor;
    bootstrap(): Promise<void>;
}
