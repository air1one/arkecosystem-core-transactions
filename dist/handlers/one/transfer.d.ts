import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";
export declare class TransferTransactionHandler extends TransactionHandler {
    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    walletAttributes(): ReadonlyArray<string>;
    getConstructor(): Transactions.TransactionConstructor;
    bootstrap(): Promise<void>;
    isActivated(): Promise<boolean>;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, sender: Contracts.State.Wallet): Promise<void>;
    hasVendorField(): boolean;
    throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void>;
    applyToRecipient(transaction: Interfaces.ITransaction): Promise<void>;
    revertForRecipient(transaction: Interfaces.ITransaction): Promise<void>;
}
