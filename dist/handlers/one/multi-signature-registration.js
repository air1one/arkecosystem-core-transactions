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
// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
let MultiSignatureRegistrationTransactionHandler = class MultiSignatureRegistrationTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["multiSignature", "multiSignature.legacy"];
    }
    getConstructor() {
        return crypto_1.Transactions.One.MultiSignatureRegistrationTransaction;
    }
    async bootstrap() {
        var _a;
        const criteria = {
            version: this.getConstructor().version,
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            core_kernel_1.Utils.assert.defined(transaction.senderPublicKey);
            core_kernel_1.Utils.assert.defined((_a = transaction.asset) === null || _a === void 0 ? void 0 : _a.multiSignatureLegacy);
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const multiSignatureLegacy = transaction.asset.multiSignatureLegacy;
            if (wallet.hasMultiSignature()) {
                throw new errors_1.MultiSignatureAlreadyRegisteredError();
            }
            wallet.setAttribute("multiSignature", multiSignatureLegacy);
            wallet.setAttribute("multiSignature.legacy", true);
            this.walletRepository.index(wallet);
        }
    }
    async isActivated() {
        return !crypto_1.Managers.configManager.getMilestone().aip11;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        const { data } = transaction;
        if (crypto_1.Utils.isException(data)) {
            return;
        }
        throw new errors_1.LegacyMultiSignatureError();
    }
    async throwIfCannotEnterPool(transaction) {
        throw new core_kernel_1.Contracts.TransactionPool.PoolError(`Deprecated multi-signature registration`, "ERR_DEPRECATED");
    }
    async applyToRecipient(transaction) { }
    async revertForRecipient(transaction) { }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionHistoryService),
    __metadata("design:type", Object)
], MultiSignatureRegistrationTransactionHandler.prototype, "transactionHistoryService", void 0);
MultiSignatureRegistrationTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], MultiSignatureRegistrationTransactionHandler);
exports.MultiSignatureRegistrationTransactionHandler = MultiSignatureRegistrationTransactionHandler;
//# sourceMappingURL=multi-signature-registration.js.map