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
exports.SecondSignatureRegistrationTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
let SecondSignatureRegistrationTransactionHandler = class SecondSignatureRegistrationTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["secondPublicKey"];
    }
    getConstructor() {
        return crypto_1.Transactions.One.SecondSignatureRegistrationTransaction;
    }
    async bootstrap() { }
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        if (wallet.hasSecondSignature()) {
            throw new errors_1.SecondSignatureAlreadyRegisteredError();
        }
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        if (senderWallet.hasMultiSignature()) {
            throw new errors_1.NotSupportedForMultiSignatureWalletError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }
    async throwIfCannotEnterPool(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const hasSender = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .has();
        if (hasSender) {
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`Sender ${transaction.data.senderPublicKey} already has a transaction of type '${crypto_1.Enums.TransactionType.SecondSignature}' in the pool`, "ERR_PENDING");
        }
    }
    async applyToSender(transaction) {
        var _a, _b;
        await super.applyToSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        core_kernel_1.Utils.assert.defined((_b = (_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.signature) === null || _b === void 0 ? void 0 : _b.publicKey);
        senderWallet.setAttribute("secondPublicKey", transaction.data.asset.signature.publicKey);
    }
    async revertForSender(transaction) {
        await super.revertForSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        this.walletRepository.findByPublicKey(transaction.data.senderPublicKey).forgetAttribute("secondPublicKey");
    }
    async applyToRecipient(transaction) { }
    async revertForRecipient(transaction) { }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionPoolQuery),
    __metadata("design:type", Object)
], SecondSignatureRegistrationTransactionHandler.prototype, "poolQuery", void 0);
SecondSignatureRegistrationTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], SecondSignatureRegistrationTransactionHandler);
exports.SecondSignatureRegistrationTransactionHandler = SecondSignatureRegistrationTransactionHandler;
//# sourceMappingURL=second-signature-registration.js.map