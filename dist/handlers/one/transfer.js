"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const utils_1 = require("../../utils");
const transaction_1 = require("../transaction");
// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
let TransferTransactionHandler = class TransferTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [];
    }
    walletAttributes() {
        return [];
    }
    getConstructor() {
        return crypto_1.Transactions.One.TransferTransaction;
    }
    async bootstrap() { }
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, sender) {
        return super.throwIfCannotBeApplied(transaction, sender);
    }
    hasVendorField() {
        return true;
    }
    async throwIfCannotEnterPool(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.recipientId);
        const recipientId = transaction.data.recipientId;
        if (!utils_1.isRecipientOnActiveNetwork(recipientId)) {
            const network = crypto_1.Managers.configManager.get("network.pubKeyHash");
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`Recipient ${recipientId} is not on the same network: ${network} `, "ERR_INVALID_RECIPIENT");
        }
    }
    async applyToRecipient(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.recipientId);
        const recipient = this.walletRepository.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.plus(transaction.data.amount);
    }
    async revertForRecipient(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.recipientId);
        const recipient = this.walletRepository.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
};
TransferTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], TransferTransactionHandler);
exports.TransferTransactionHandler = TransferTransactionHandler;
//# sourceMappingURL=transfer.js.map