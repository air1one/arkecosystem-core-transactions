import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";
export declare class HtlcRefundTransactionHandler extends TransactionHandler {
    private readonly poolQuery;
    dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    walletAttributes(): ReadonlyArray<string>;
    getConstructor(): Transactions.TransactionConstructor;
    bootstrap(): Promise<void>;
    isActivated(): Promise<boolean>;
    dynamicFee(context: Contracts.Shared.DynamicFeeContext): Utils.BigNumber;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, sender: Contracts.State.Wallet): Promise<void>;
    throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void>;
    applyToSender(transaction: Interfaces.ITransaction): Promise<void>;
    revertForSender(transaction: Interfaces.ITransaction): Promise<void>;
    applyToRecipient(transaction: Interfaces.ITransaction): Promise<void>;
    revertForRecipient(transaction: Interfaces.ITransaction): Promise<void>;
}
