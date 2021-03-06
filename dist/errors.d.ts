import { Contracts } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";
export declare class TransactionError extends Error {
    constructor(message: string);
}
export declare class InvalidTransactionTypeError extends TransactionError {
    constructor(type: Transactions.InternalTransactionType);
}
export declare class DeactivatedTransactionHandlerError extends TransactionError {
    constructor(type: Transactions.InternalTransactionType);
}
export declare class UnsatisfiedDependencyError extends TransactionError {
    constructor(type: Transactions.InternalTransactionType);
}
export declare class AlreadyRegisteredError extends TransactionError {
    constructor(type: Transactions.InternalTransactionType);
}
export declare class UnexpectedNonceError extends TransactionError {
    constructor(txNonce: Utils.BigNumber, sender: Contracts.State.Wallet, reversal: boolean);
}
export declare class ColdWalletError extends TransactionError {
    constructor();
}
export declare class InsufficientBalanceError extends TransactionError {
    constructor();
}
export declare class SenderWalletMismatchError extends TransactionError {
    constructor();
}
export declare class UnexpectedSecondSignatureError extends TransactionError {
    constructor();
}
export declare class UnexpectedMultiSignatureError extends TransactionError {
    constructor();
}
export declare class InvalidSecondSignatureError extends TransactionError {
    constructor();
}
export declare class WalletAlreadyResignedError extends TransactionError {
    constructor();
}
export declare class WalletNotADelegateError extends TransactionError {
    constructor();
}
export declare class WalletIsAlreadyDelegateError extends TransactionError {
    constructor();
}
export declare class WalletUsernameAlreadyRegisteredError extends TransactionError {
    constructor(username: string);
}
export declare class SecondSignatureAlreadyRegisteredError extends TransactionError {
    constructor();
}
export declare class NotSupportedForMultiSignatureWalletError extends TransactionError {
    constructor();
}
export declare class AlreadyVotedError extends TransactionError {
    constructor();
}
export declare class NoVoteError extends TransactionError {
    constructor();
}
export declare class UnvoteMismatchError extends TransactionError {
    constructor();
}
export declare class VotedForNonDelegateError extends TransactionError {
    constructor(vote: string);
}
export declare class VotedForResignedDelegateError extends TransactionError {
    constructor(vote: string);
}
export declare class NotEnoughDelegatesError extends TransactionError {
    constructor();
}
export declare class MultiSignatureAlreadyRegisteredError extends TransactionError {
    constructor();
}
export declare class InvalidMultiSignatureError extends TransactionError {
    constructor();
}
export declare class LegacyMultiSignatureError extends TransactionError {
    constructor();
}
export declare class MultiSignatureMinimumKeysError extends TransactionError {
    constructor();
}
export declare class MultiSignatureKeyCountMismatchError extends TransactionError {
    constructor();
}
export declare class IpfsHashAlreadyExists extends TransactionError {
    constructor();
}
export declare class HtlcLockTransactionNotFoundError extends TransactionError {
    constructor();
}
export declare class HtlcSecretHashMismatchError extends TransactionError {
    constructor();
}
export declare class HtlcLockNotExpiredError extends TransactionError {
    constructor();
}
export declare class HtlcLockExpiredError extends TransactionError {
    constructor();
}
