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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtlcRefundTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
const htlc_lock_1 = require("./htlc-lock");
let HtlcRefundTransactionHandler = class HtlcRefundTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [htlc_lock_1.HtlcLockTransactionHandler];
    }
    walletAttributes() {
        return ["htlc", "htlc.locks", "htlc.lockedBalance"];
    }
    getConstructor() {
        return crypto_1.Transactions.Two.HtlcRefundTransaction;
    }
    async bootstrap() {
        const balances = await this.transactionRepository.getRefundedHtlcLockBalances();
        for (const { senderPublicKey, refundedBalance } of balances) {
            // sender is from the original lock
            const refundWallet = this.walletRepository.findByPublicKey(senderPublicKey);
            refundWallet.balance = refundWallet.balance.plus(refundedBalance);
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
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.refund);
        // Specific HTLC refund checks
        core_kernel_1.Utils.assert.defined(transaction.data.asset.refund);
        const lockId = transaction.data.asset.refund.lockTransactionId;
        const lockWallet = this.walletRepository.findByIndex(core_kernel_1.Contracts.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            throw new errors_1.HtlcLockTransactionNotFoundError();
        }
        const lock = lockWallet.getAttribute("htlc.locks", {})[lockId];
        const lastBlock = this.app
            .get(core_kernel_1.Container.Identifiers.StateStore)
            .getLastBlock();
        if (!core_kernel_1.Utils.expirationCalculator.calculateLockExpirationStatus(lastBlock, lock.expiration)) {
            throw new errors_1.HtlcLockNotExpiredError();
        }
    }
    async throwIfCannotEnterPool(transaction) {
        var _a, _b;
        core_kernel_1.Utils.assert.defined((_b = (_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.refund) === null || _b === void 0 ? void 0 : _b.lockTransactionId);
        const lockId = transaction.data.asset.refund.lockTransactionId;
        const lockWallet = this.walletRepository.findByIndex(core_kernel_1.Contracts.State.WalletIndexes.Locks, lockId);
        if (!lockWallet || !lockWallet.getAttribute("htlc.locks")[lockId]) {
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`The associated lock transaction id "${lockId}" was not found`, "ERR_HTLCLOCKNOTFOUND");
        }
        const hasRefund = this.poolQuery
            .getAll()
            .whereKind(transaction)
            .wherePredicate((t) => { var _a, _b; return ((_b = (_a = t.data.asset) === null || _a === void 0 ? void 0 : _a.refund) === null || _b === void 0 ? void 0 : _b.lockTransactionId) === lockId; })
            .has();
        if (hasRefund) {
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`HtlcRefund for "${lockId}" already in the pool`, "ERR_PENDING");
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
        core_kernel_1.Utils.assert.defined((_b = (_a = data.asset) === null || _a === void 0 ? void 0 : _a.refund) === null || _b === void 0 ? void 0 : _b.lockTransactionId);
        const lockId = data.asset.refund.lockTransactionId;
        const lockWallet = this.walletRepository.findByIndex(core_kernel_1.Contracts.State.WalletIndexes.Locks, lockId);
        assert_1.default(lockWallet && lockWallet.getAttribute("htlc.locks", {})[lockId]);
        const locks = lockWallet.getAttribute("htlc.locks", {});
        const newBalance = lockWallet.balance.plus(locks[lockId].amount).minus(data.fee);
        assert_1.default(!newBalance.isNegative());
        lockWallet.balance = newBalance;
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
        const newLockedBalance = lockedBalance.minus(locks[lockId].amount);
        assert_1.default(!newLockedBalance.isNegative());
        if (newLockedBalance.isZero()) {
            lockWallet.forgetAttribute("htlc.lockedBalance");
            lockWallet.forgetAttribute("htlc.locks"); // zero lockedBalance means no pending locks
            lockWallet.forgetAttribute("htlc");
        }
        else {
            lockWallet.setAttribute("htlc.lockedBalance", newLockedBalance);
        }
        delete locks[lockId];
        this.walletRepository.index(lockWallet);
    }
    async revertForSender(transaction) {
        var _a, _b, _c;
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        this.verifyTransactionNonceRevert(sender, transaction);
        sender.nonce = sender.nonce.minus(1);
        core_kernel_1.Utils.assert.defined((_b = (_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.refund) === null || _b === void 0 ? void 0 : _b.lockTransactionId);
        const lockId = transaction.data.asset.refund.lockTransactionId;
        // @ts-ignore - Type 'Transaction' is not assignable to type 'ITransactionData'.
        const lockTransaction = (await this.transactionRepository.findByIds([lockId]))[0];
        core_kernel_1.Utils.assert.defined(lockTransaction.senderPublicKey);
        const lockWallet = this.walletRepository.findByPublicKey(lockTransaction.senderPublicKey);
        lockWallet.balance = lockWallet.balance.minus(lockTransaction.amount).plus(transaction.data.fee);
        const lockedBalance = lockWallet.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
        lockWallet.setAttribute("htlc.lockedBalance", lockedBalance.plus(lockTransaction.amount));
        const locks = lockWallet.getAttribute("htlc.locks", {});
        core_kernel_1.Utils.assert.defined((_c = lockTransaction.asset) === null || _c === void 0 ? void 0 : _c.lock);
        if (locks) {
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
        }
        this.walletRepository.index(lockWallet);
    }
    async applyToRecipient(transaction) { }
    async revertForRecipient(transaction) { }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionPoolQuery),
    __metadata("design:type", Object)
], HtlcRefundTransactionHandler.prototype, "poolQuery", void 0);
HtlcRefundTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], HtlcRefundTransactionHandler);
exports.HtlcRefundTransactionHandler = HtlcRefundTransactionHandler;
//# sourceMappingURL=htlc-refund.js.map