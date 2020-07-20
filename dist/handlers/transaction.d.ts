import { Repositories } from "@arkecosystem/core-database";
import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
export declare abstract class TransactionHandler {
    protected readonly app: Contracts.Kernel.Application;
    protected readonly blockRepository: Repositories.BlockRepository;
    protected readonly transactionRepository: Repositories.TransactionRepository;
    protected readonly walletRepository: Contracts.State.WalletRepository;
    protected readonly logger: Contracts.Kernel.Logger;
    verify(transaction: Interfaces.ITransaction): Promise<boolean>;
    dynamicFee({ addonBytes, satoshiPerByte, transaction, }: Contracts.Shared.DynamicFeeContext): Utils.BigNumber;
    throwIfCannotBeApplied(transaction: Interfaces.ITransaction, sender: Contracts.State.Wallet): Promise<void>;
    apply(transaction: Interfaces.ITransaction): Promise<void>;
    revert(transaction: Interfaces.ITransaction): Promise<void>;
    applyToSender(transaction: Interfaces.ITransaction): Promise<void>;
    revertForSender(transaction: Interfaces.ITransaction): Promise<void>;
    /**
     * Database Service
     */
    emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void;
    /**
     * Transaction Pool logic
     */
    throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void>;
    /**
     * @param {Contracts.State.Wallet} wallet
     * @param {Interfaces.ITransactionData} transaction
     * @param {Interfaces.IMultiSignatureAsset} [multiSignature]
     * @returns {boolean}
     * @memberof TransactionHandler
     */
    verifySignatures(wallet: Contracts.State.Wallet, transaction: Interfaces.ITransactionData, multiSignature?: Interfaces.IMultiSignatureAsset): boolean;
    protected performGenericWalletChecks(transaction: Interfaces.ITransaction, sender: Contracts.State.Wallet): Promise<void>;
    /**
     * Verify that the transaction's nonce is the wallet nonce plus one, so that the
     * transaction can be applied to the wallet. Throw an exception if it is not.
     *
     * @param {Interfaces.ITransaction} transaction
     * @memberof Wallet
     */
    protected verifyTransactionNonceApply(wallet: Contracts.State.Wallet, transaction: Interfaces.ITransaction): void;
    /**
     * Verify that the transaction's nonce is the same as the wallet nonce, so that the
     * transaction can be reverted from the wallet. Throw an exception if it is not.
     *
     * @param wallet
     * @param {Interfaces.ITransaction} transaction
     * @memberof Wallet
     */
    protected verifyTransactionNonceRevert(wallet: Contracts.State.Wallet, transaction: Interfaces.ITransaction): void;
    abstract getConstructor(): Transactions.TransactionConstructor;
    abstract dependencies(): ReadonlyArray<TransactionHandlerConstructor>;
    abstract walletAttributes(): ReadonlyArray<string>;
    abstract isActivated(): Promise<boolean>;
    /**
     * Wallet logic
     */
    abstract bootstrap(): Promise<void>;
    abstract applyToRecipient(transaction: Interfaces.ITransaction): Promise<void>;
    abstract revertForRecipient(transaction: Interfaces.ITransaction): Promise<void>;
}
export declare type TransactionHandlerConstructor = typeof TransactionHandler;
