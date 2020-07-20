"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtlcClaimTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = require("assert");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
const htlc_lock_1 = require("./htlc-lock");
let HtlcClaimTransactionHandler = class HtlcClaimTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [htlc_lock_1.HtlcLockTransactionHandler];
    }
    walletAttributes() {
        return ["htlc", "htlc.locks", "htlc.lockedBalance"];
    }
    getConstructor() {
        return crypto_1.Transactions.Two.HtlcClaimTransaction;
    }
    async bootstrap() {
        const balances = await this.transactionRepository.getClaimedHtlcLockBalances();
        for (const { recipientId, claimedBalance } of balances) {
            const claimWallet = this.walletRepository.findByAddress(recipientId);
            claimWallet.balance = claimWallet.balance.plus(claimedBalance);
        }
    }
    async isActivated() {
        const milestone = crypto_1.Managers.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true;
    }
    dynamicFee(context) {
        // override dynamicFee calculation as this is a zero-fee transaction
        return crypto_1.Utils.BigNumber.ZERO;
    }
    async throwIfCannotBeApplied(transaction, sender) {
        var _a;
        await this.performGenericWalletChecks(transaction, sender);
        // Specific HTLC claim checks
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.claim);
        const claimAsset = transaction.data.asset.claim;
        const lockId = claimAsset.lockTransactionId;
        const lockWallet = this.walletRepository.findByIndex(core_kernel_1.Contracts.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new errors_1.HtlcLockTransactionNotFoundError();
        }
        const lock = lockWallet.getAttribute("htlc.locks", {})[lockId];
        const lastBlock = this.app
            .get(core_kernel_1.Container.Identifiers.StateStore)
            .getLastBlock();
        if (core_kernel_1.Utils.expirationCalculator.calculateLockExpirationStatus(lastBlock, lock.expiration)) {
            throw new errors_1.HtlcLockExpiredError();
        }
        const unlockSecretBytes = Buffer.from(claimAsset.unlockSecret, "hex");
        const unlockSecretHash = crypto_1.Crypto.HashAlgorithms.sha256(unlockSecretBytes).toString("hex");
        if (lock.secretHash !== unlockSecretHash) {
            throw new errors_1.HtlcSecretHashMismatchError();
        }
    }
    async throwIfCannotEnterPool(transaction) {
        var _a, _b;
        core_kernel_1.Utils.assert.defined((_b = (_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.claim) === null || _b === void 0 ? void 0 : _b.lockTransactionId);
        const lockId = transaction.data.asset.claim.lockTransactionId;
        const lockWallet = this.walletRepository.findByIndex(core_kernel_1.Contracts.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks", {})[lockId]) {
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`The associated lock transaction id "${lockId}" was not found`, "ERR_HTLCLOCKNOTFOUND");
        }
        const hasClaim = this.poolQuery
            .getAll()
            .whereKind(transaction)
            .wherePredicate((t) => { var _a, _b; return ((_b = (_a = t.data.asset) === null || _a === void 0 ? void 0 : _a.claim) === null || _b === void 0 ? void 0 : _b.lockTransactionId) === lockId; })
            .has();
        if (hasClaim) {
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`HtlcClaim for "${lockId}" already in the pool`, "ERR_PENDING");
        }
    }
    async applyToSender(transaction) {
        var _a, _b;
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const data = transaction.data;
        if (crypto_1.Utils.isException(data)) {
            this.logger.warning(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }
        await this.throwIfCannotBeApplied(transaction, sender);
        this.verifyTransactionNonceApply(sender, transaction);
        core_kernel_1.Utils.assert.defined(data.nonce);
        sender.nonce = data.nonce;
        core_kernel_1.Utils.assert.defined((_b = (_a = data.asset) === null || _a === void 0 ? void 0 : _a.claim) === null || _b === void 0 ? void 0 : _b.lockTransactionId);
        const lockId = data.asset.claim.lockTransactionId;
        const lockWallet = this.walletRepository.findByIndex(core_kernel_1.Contracts.State.WalletIndexes.Locks, lockId);
        assert_1.strict(lockWallet && lockWallet.getAttribute("htlc.locks")[lockId]);
        const locks = lockWallet.getAttribute("htlc.locks", {});
        const recipientId = locks[lockId].recipientId;
        core_kernel_1.Utils.assert.defined(recipientId);
        const recipientWallet = this.walletRepository.findByAddress(recipientId);
        const newBalance = recipientWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        recipientWallet.balance = newBalance;
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance");
        const newLockedBalance = lockedBalance.minus(locks[lockId].amount);
        assert_1.strict(!newLockedBalance.isNegative());
        if (newLockedBalance.isZero()) {
            lockWallet.forgetAttribute("htlc.lockedBalance");
            lockWallet.forgetAttribute("htlc.locks"); // zero lockedBalance means no pending locks
            lockWallet.forgetAttribute("htlc");
        }
        else {
            lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);
        }
        delete locks[lockId];
        this.walletRepository.index(sender);
        this.walletRepository.index(lockWallet);
        this.walletRepository.index(recipientWallet);
    }
    async revertForSender(transaction) {
        var _a, _b, _c;
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const data = transaction.data;
        this.verifyTransactionNonceRevert(sender, transaction);
        sender.nonce = sender.nonce.minus(1);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        core_kernel_1.Utils.assert.defined((_b = (_a = data.asset) === null || _a === void 0 ? void 0 : _a.claim) === null || _b === void 0 ? void 0 : _b.lockTransactionId);
        const lockId = data.asset.claim.lockTransactionId;
        // @ts-ignore - Type 'Transaction' is not assignable to type 'ITransactionData'.
        const lockTransaction = (await this.transactionRepository.findByIds([lockId]))[0];
        core_kernel_1.Utils.assert.defined(lockTransaction.recipientId);
        const recipientWallet = this.walletRepository.findByAddress(lockTransaction.recipientId);
        recipientWallet.balance = recipientWallet.balance.minus(lockTransaction.amount).plus(data.fee);
        core_kernel_1.Utils.assert.defined(lockTransaction.senderPublicKey);
        const lockWallet = this.walletRepository.findByPublicKey(lockTransaction.senderPublicKey);
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));
        const locks = lockWallet.getAttribute("htlc.locks", {});
        core_kernel_1.Utils.assert.defined((_c = lockTransaction.asset) === null || _c === void 0 ? void 0 : _c.lock);
        core_kernel_1.Utils.assert.defined(lockTransaction.id);
        locks[lockTransaction.id] = {
            amount: lockTransaction.amount,
            recipientId: lockTransaction.recipientId,
            timestamp: lockTransaction.timestamp,
            vendorField: lockTransaction.vendorField
                ? Buffer.from(lockTransaction.vendorField, "hex").toString("utf8")
                : undefined,
            ...lockTransaction.asset.lock,
        };
        lockWallet.setAttribute("htlc.locks", locks);
        this.walletRepository.index(sender);
        this.walletRepository.index(lockWallet);
        this.walletRepository.index(recipientWallet);
    }
    async applyToRecipient(transaction) { }
    async revertForRecipient(transaction) { }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionPoolQuery),
    __metadata("design:type", Object)
], HtlcClaimTransactionHandler.prototype, "poolQuery", void 0);
HtlcClaimTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], HtlcClaimTransactionHandler);
exports.HtlcClaimTransactionHandler = HtlcClaimTransactionHandler;
//# sourceMappingURL=htlc-claim.js.map