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
exports.DelegateRegistrationTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
let DelegateRegistrationTransactionHandler = class DelegateRegistrationTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [];
    }
    walletAttributes() {
        return [
            "delegate.approval",
            "delegate.forgedFees",
            "delegate.forgedRewards",
            "delegate.forgedTotal",
            "delegate.lastBlock",
            "delegate.producedBlocks",
            "delegate.rank",
            "delegate.round",
            "delegate.username",
            "delegate.voteBalance",
            "delegate",
        ];
    }
    getConstructor() {
        return crypto_1.Transactions.One.DelegateRegistrationTransaction;
    }
    async bootstrap() { }
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        var _a, _b;
        const { data } = transaction;
        core_kernel_1.Utils.assert.defined(data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(data.senderPublicKey);
        if (sender.hasMultiSignature()) {
            throw new errors_1.NotSupportedForMultiSignatureWalletError();
        }
        core_kernel_1.Utils.assert.defined((_b = (_a = data.asset) === null || _a === void 0 ? void 0 : _a.delegate) === null || _b === void 0 ? void 0 : _b.username);
        const username = data.asset.delegate.username;
        if (wallet.isDelegate()) {
            throw new errors_1.WalletIsAlreadyDelegateError();
        }
        if (this.walletRepository.hasByUsername(username)) {
            throw new errors_1.WalletUsernameAlreadyRegisteredError(username);
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }
    emitEvents(transaction, emitter) {
        emitter.dispatch(core_kernel_1.Enums.DelegateEvent.Registered, transaction.data);
    }
    async throwIfCannotEnterPool(transaction) {
        var _a, _b;
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const hasSender = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .has();
        if (hasSender) {
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`Sender ${transaction.data.senderPublicKey} already has a transaction of type '${crypto_1.Enums.TransactionType.DelegateRegistration}' in the pool`, "ERR_PENDING");
        }
        core_kernel_1.Utils.assert.defined((_b = (_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.delegate) === null || _b === void 0 ? void 0 : _b.username);
        const username = transaction.data.asset.delegate.username;
        const hasUsername = this.poolQuery
            .getAll()
            .whereKind(transaction)
            .wherePredicate((t) => { var _a, _b; return ((_b = (_a = t.data.asset) === null || _a === void 0 ? void 0 : _a.delegate) === null || _b === void 0 ? void 0 : _b.username) === username; })
            .has();
        if (hasUsername) {
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`Delegate registration for "${username}" already in the pool`, "ERR_PENDING");
        }
    }
    async applyToSender(transaction) {
        var _a, _b;
        await super.applyToSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        core_kernel_1.Utils.assert.defined((_b = (_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.delegate) === null || _b === void 0 ? void 0 : _b.username);
        sender.setAttribute("delegate", {
            username: transaction.data.asset.delegate.username,
            voteBalance: crypto_1.Utils.BigNumber.ZERO,
            forgedFees: crypto_1.Utils.BigNumber.ZERO,
            forgedRewards: crypto_1.Utils.BigNumber.ZERO,
            producedBlocks: 0,
            round: 0,
        });
        this.walletRepository.index(sender);
    }
    async revertForSender(transaction) {
        await super.revertForSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        this.walletRepository.forgetByUsername(sender.getAttribute("delegate.username"));
        sender.forgetAttribute("delegate");
    }
    async applyToRecipient(transaction) { }
    async revertForRecipient(transaction) { }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionPoolQuery),
    __metadata("design:type", Object)
], DelegateRegistrationTransactionHandler.prototype, "poolQuery", void 0);
DelegateRegistrationTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], DelegateRegistrationTransactionHandler);
exports.DelegateRegistrationTransactionHandler = DelegateRegistrationTransactionHandler;
//# sourceMappingURL=delegate-registration.js.map