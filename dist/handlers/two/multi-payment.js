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
exports.MultiPaymentTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
let MultiPaymentTransactionHandler = class MultiPaymentTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [];
    }
    walletAttributes() {
        return [];
    }
    getConstructor() {
        return crypto_1.Transactions.Two.MultiPaymentTransaction;
    }
    async bootstrap() {
        var _a;
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            core_kernel_1.Utils.assert.defined(transaction.senderPublicKey);
            core_kernel_1.Utils.assert.defined((_a = transaction.asset) === null || _a === void 0 ? void 0 : _a.payments);
            const sender = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            for (const payment of transaction.asset.payments) {
                const recipient = this.walletRepository.findByAddress(payment.recipientId);
                recipient.balance = recipient.balance.plus(payment.amount);
                sender.balance = sender.balance.minus(payment.amount);
            }
        }
    }
    async isActivated() {
        return crypto_1.Managers.configManager.getMilestone().aip11 === true;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        var _a;
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.payments);
        const payments = transaction.data.asset.payments;
        const totalPaymentsAmount = payments.reduce((a, p) => a.plus(p.amount), crypto_1.Utils.BigNumber.ZERO);
        if (wallet.balance.minus(totalPaymentsAmount).minus(transaction.data.fee).isNegative()) {
            throw new errors_1.InsufficientBalanceError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }
    async applyToSender(transaction) {
        var _a;
        await super.applyToSender(transaction);
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.payments);
        const totalPaymentsAmount = transaction.data.asset.payments.reduce((a, p) => a.plus(p.amount), crypto_1.Utils.BigNumber.ZERO);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.minus(totalPaymentsAmount);
    }
    async revertForSender(transaction) {
        var _a;
        await super.revertForSender(transaction);
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.payments);
        const totalPaymentsAmount = transaction.data.asset.payments.reduce((a, p) => a.plus(p.amount), crypto_1.Utils.BigNumber.ZERO);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        sender.balance = sender.balance.plus(totalPaymentsAmount);
    }
    async applyToRecipient(transaction) {
        var _a;
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.payments);
        for (const payment of transaction.data.asset.payments) {
            const recipient = this.walletRepository.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.plus(payment.amount);
        }
    }
    async revertForRecipient(transaction) {
        var _a;
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.payments);
        for (const payment of transaction.data.asset.payments) {
            const recipient = this.walletRepository.findByAddress(payment.recipientId);
            recipient.balance = recipient.balance.minus(payment.amount);
        }
    }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionHistoryService),
    __metadata("design:type", Object)
], MultiPaymentTransactionHandler.prototype, "transactionHistoryService", void 0);
MultiPaymentTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], MultiPaymentTransactionHandler);
exports.MultiPaymentTransactionHandler = MultiPaymentTransactionHandler;
//# sourceMappingURL=multi-payment.js.map