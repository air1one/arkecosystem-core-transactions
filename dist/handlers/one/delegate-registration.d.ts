import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";
export declare class DelegateRegistrationTransactionHandler extends TransactionHandler {
    private readonly poolQuery;
    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    walletAttributes(): ReadonlyArray<string>;
    getConstructor(): Transactions.TransactionConstructor;
    bootstrap(): Promise<void>;
    isActivated(): Promise<boolean>;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, wallet: Contracts.State.Wallet): Promise<void>;
    emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void;
    throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void>;
    applyToSender(transaction: Interfaces.ITransaction): Promise<void>;
    revertForSender(transaction: Interfaces.ITransaction): Promise<void>;
    applyToRecipient(transaction: Interfaces.ITransaction): Promise<void>;
    revertForRecipient(transaction: Interfaces.ITransaction): Promise<void>;
}
