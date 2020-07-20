"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtlcLockTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
let HtlcLockTransactionHandler = class HtlcLockTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["htlc", "htlc.locks", "htlc.lockedBalance"];
    }
    getConstructor() {
        return crypto_1.Transactions.Two.HtlcLockTransaction;
    }
    async bootstrap() {
        const transactions = await this.transactionRepository.getOpenHtlcLocks();
        const walletsToIndex = {};
        for (const transaction of transactions) {
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const locks = wallet.getAttribute("htlc.locks", {});
            let lockedBalance = wallet.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
            locks[transaction.id] = {
                amount: crypto_1.Utils.BigNumber.make(transaction.amount),
                recipientId: transaction.recipientId,
                timestamp: transaction.timestamp,
                vendorField: transaction.vendorField
                    ? Buffer.from(transaction.vendorField, "hex").toString("utf8")
                    : undefined,
                ...transaction.asset.lock,
            };
            lockedBalance = lockedBalance.plus(transaction.amount);
            const recipientWallet = this.walletRepository.findByAddress(transaction.recipientId);
            walletsToIndex[wallet.address] = wallet;
            walletsToIndex[recipientWallet.address] = recipientWallet;
            wallet.setAttribute("htlc.locks", locks);
            wallet.setAttribute("htlc.lockedBalance", lockedBalance);
        }
        this.walletRepository.index(Object.values(walletsToIndex));
    }
    async isActivated() {
        const milestone = crypto_1.Managers.configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        var _a;
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.lock);
        const lock = transaction.data.asset.lock;
        const lastBlock = this.app.get(core_kernel_1.Container.Identifiers.StateStore).getLastBlock();
        let { activeDelegates } = crypto_1.Managers.configManager.getMilestone();
        let blocktime = crypto_1.Utils.calculateBlockTime(lastBlock.data.height);
        const expiration = lock.expiration;
        // TODO: find a better way to alter minimum lock expiration
        if (process.env.CORE_ENV === "test") {
            blocktime = 0;
            activeDelegates = 0;
        }
        if ((expiration.type === crypto_1.Enums.HtlcLockExpirationType.EpochTimestamp &&
            expiration.value <= lastBlock.data.timestamp + blocktime * activeDelegates) ||
            (expiration.type === crypto_1.Enums.HtlcLockExpirationType.BlockHeight &&
                expiration.value <= lastBlock.data.height + activeDelegates)) {
            throw new errors_1.HtlcLockExpiredError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }
    async applyToSender(transaction) {
        await super.applyToSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const lockedBalance = sender.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.plus(transaction.data.amount));
        this.walletRepository.index(sender);
    }
    async revertForSender(transaction) {
        await super.revertForSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const lockedBalance = sender.getAttribute("htlc.lockedBalance", crypto_1.Utils.BigNumber.ZERO);
        sender.setAttribute("htlc.lockedBalance", lockedBalance.minus(transaction.data.amount));
        this.walletRepository.index(sender);
    }
    async applyToRecipient(transaction) {
        // It may seem that htlc-lock doesn't have recipient because it only updates sender's wallet.
        // But actually applyToSender applies state changes that only affect sender.
        // While applyToRecipient applies state changes that can affect others.
        // It is simple technique to isolate different senders in pool.
        var _a;
        core_kernel_1.Utils.assert.defined(transaction.id);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.lock);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const locks = sender.getAttribute("htlc.locks", {});
        locks[transaction.id] = {
            amount: transaction.data.amount,
            recipientId: transaction.data.recipientId,
            timestamp: transaction.timestamp,
            vendorField: transaction.data.vendorField,
            ...transaction.data.asset.lock,
        };
        sender.setAttribute("htlc.locks", locks);
        this.walletRepository.index(sender);
    }
    async revertForRecipient(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.id);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const locks = sender.getAttribute("htlc.locks", {});
        delete locks[transaction.id];
        sender.setAttribute("htlc.locks", locks);
        this.walletRepository.index(sender);
    }
};
HtlcLockTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], HtlcLockTransactionHandler);
exports.HtlcLockTransactionHandler = HtlcLockTransactionHandler;
//# sourceMappingURL=htlc-lock.js.map