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
exports.MultiSignatureRegistrationTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
let MultiSignatureRegistrationTransactionHandler = class MultiSignatureRegistrationTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["multiSignature"];
    }
    getConstructor() {
        return crypto_1.Transactions.Two.MultiSignatureRegistrationTransaction;
    }
    async bootstrap() {
        var _a;
        const criteria = {
            version: this.getConstructor().version,
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            core_kernel_1.Utils.assert.defined((_a = transaction.asset) === null || _a === void 0 ? void 0 : _a.multiSignature);
            const multiSignature = transaction.asset.multiSignature;
            const wallet = this.walletRepository.findByPublicKey(crypto_1.Identities.PublicKey.fromMultiSignatureAsset(multiSignature));
            if (wallet.hasMultiSignature()) {
                throw new errors_1.MultiSignatureAlreadyRegisteredError();
            }
            wallet.setAttribute("multiSignature", multiSignature);
            this.walletRepository.index(wallet);
        }
    }
    async isActivated() {
        return crypto_1.Managers.configManager.getMilestone().aip11 === true;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        var _a;
        const { data } = transaction;
        core_kernel_1.Utils.assert.defined((_a = data.asset) === null || _a === void 0 ? void 0 : _a.multiSignature);
        const { publicKeys, min } = data.asset.multiSignature;
        if (min < 1 || min > publicKeys.length || min > 16) {
            throw new errors_1.MultiSignatureMinimumKeysError();
        }
        core_kernel_1.Utils.assert.defined(data.signatures);
        if (publicKeys.length !== data.signatures.length) {
            throw new errors_1.MultiSignatureKeyCountMismatchError();
        }
        core_kernel_1.Utils.assert.defined(data.asset.multiSignature);
        const multiSigPublicKey = crypto_1.Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature);
        const recipientWallet = this.walletRepository.findByPublicKey(multiSigPublicKey);
        if (recipientWallet.hasMultiSignature()) {
            throw new errors_1.MultiSignatureAlreadyRegisteredError();
        }
        if (!this.verifySignatures(wallet, data, data.asset.multiSignature)) {
            throw new errors_1.InvalidMultiSignatureError();
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
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`Sender ${transaction.data.senderPublicKey} already has a transaction of type '${crypto_1.Enums.TransactionType.MultiSignature}' in the pool`, "ERR_PENDING");
        }
    }
    async applyToSender(transaction) {
        var _a;
        await super.applyToSender(transaction);
        // Create the multi sig wallet
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.multiSignature);
        this.walletRepository
            .findByPublicKey(crypto_1.Identities.PublicKey.fromMultiSignatureAsset(transaction.data.asset.multiSignature))
            .setAttribute("multiSignature", transaction.data.asset.multiSignature);
    }
    async revertForSender(transaction) {
        await super.revertForSender(transaction);
        // Nothing else to do for the sender since the recipient wallet
        // is made into a multi sig wallet.
    }
    async applyToRecipient(transaction) {
        var _a;
        const { data } = transaction;
        core_kernel_1.Utils.assert.defined((_a = data.asset) === null || _a === void 0 ? void 0 : _a.multiSignature);
        const recipientWallet = this.walletRepository.findByPublicKey(crypto_1.Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature));
        recipientWallet.setAttribute("multiSignature", data.asset.multiSignature);
    }
    async revertForRecipient(transaction) {
        var _a;
        const { data } = transaction;
        core_kernel_1.Utils.assert.defined((_a = data.asset) === null || _a === void 0 ? void 0 : _a.multiSignature);
        const recipientWallet = this.walletRepository.findByPublicKey(crypto_1.Identities.PublicKey.fromMultiSignatureAsset(data.asset.multiSignature));
        recipientWallet.forgetAttribute("multiSignature");
    }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionPoolQuery),
    __metadata("design:type", Object)
], MultiSignatureRegistrationTransactionHandler.prototype, "poolQuery", void 0);
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionHistoryService),
    __metadata("design:type", Object)
], MultiSignatureRegistrationTransactionHandler.prototype, "transactionHistoryService", void 0);
MultiSignatureRegistrationTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], MultiSignatureRegistrationTransactionHandler);
exports.MultiSignatureRegistrationTransactionHandler = MultiSignatureRegistrationTransactionHandler;
//# sourceMappingURL=multi-signature-registration.js.map