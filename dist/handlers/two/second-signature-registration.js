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
const index_1 = require("../index");
let SecondSignatureRegistrationTransactionHandler = class SecondSignatureRegistrationTransactionHandler extends index_1.One.SecondSignatureRegistrationTransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.Two.SecondSignatureRegistrationTransaction;
    }
    async bootstrap() {
        var _a, _b;
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            core_kernel_1.Utils.assert.defined(transaction.senderPublicKey);
            core_kernel_1.Utils.assert.defined((_b = (_a = transaction.asset) === null || _a === void 0 ? void 0 : _a.signature) === null || _b === void 0 ? void 0 : _b.publicKey);
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            wallet.setAttribute("secondPublicKey", transaction.asset.signature.publicKey);
        }
    }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionHistoryService),
    __metadata("design:type", Object)
], SecondSignatureRegistrationTransactionHandler.prototype, "transactionHistoryService", void 0);
SecondSignatureRegistrationTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], SecondSignatureRegistrationTransactionHandler);
exports.SecondSignatureRegistrationTransactionHandler = SecondSignatureRegistrationTransactionHandler;
//# sourceMappingURL=second-signature-registration.js.map