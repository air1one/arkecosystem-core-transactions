import { Transactions } from "@arkecosystem/crypto";
import { One } from "../index";
import { TransactionHandlerConstructor } from "../transaction";
export declare class VoteTransactionHandler extends One.VoteTransactionHandler {
    private readonly transactionHistoryService;
    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    getConstructor(): Transactions.TransactionConstructor;
    bootstrap(): Promise<void>;
}
