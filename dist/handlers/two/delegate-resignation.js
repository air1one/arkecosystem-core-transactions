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
exports.DelegateResignationTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
const delegate_registration_1 = require("./delegate-registration");
// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
let DelegateResignationTransactionHandler = class DelegateResignationTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [delegate_registration_1.DelegateRegistrationTransactionHandler];
    }
    walletAttributes() {
        return ["delegate.resigned"];
    }
    getConstructor() {
        return crypto_1.Transactions.Two.DelegateResignationTransaction;
    }
    async bootstrap() {
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            core_kernel_1.Utils.assert.defined(transaction.senderPublicKey);
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            wallet.setAttribute("delegate.resigned", true);
            this.walletRepository.index(wallet);
        }
    }
    async isActivated() {
        return crypto_1.Managers.configManager.getMilestone().aip11 === true;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        if (!wallet.isDelegate()) {
            throw new errors_1.WalletNotADelegateError();
        }
        if (wallet.hasAttribute("delegate.resigned")) {
            throw new errors_1.WalletAlreadyResignedError();
        }
        const requiredDelegatesCount = crypto_1.Managers.configManager.getMilestone().activeDelegates;
        const currentDelegatesCount = this.walletRepository
            .allByUsername()
            .filter((w) => w.hasAttribute("delegate.resigned") === false).length;
        if (currentDelegatesCount - 1 < requiredDelegatesCount) {
            throw new errors_1.NotEnoughDelegatesError();
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }
    emitEvents(transaction, emitter) {
        emitter.dispatch(core_kernel_1.Enums.DelegateEvent.Resigned, transaction.data);
    }
    async throwIfCannotEnterPool(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const hasSender = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .has();
        if (hasSender) {
            const wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`Delegate resignation for "${wallet.getAttribute("delegate.username")}" already in the pool`, "ERR_PENDING");
        }
    }
    async applyToSender(transaction) {
        await super.applyToSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        senderWallet.setAttribute("delegate.resigned", true);
        this.walletRepository.index(senderWallet);
    }
    async revertForSender(transaction) {
        await super.revertForSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        this.walletRepository.findByPublicKey(transaction.data.senderPublicKey).forgetAttribute("delegate.resigned");
    }
    async applyToRecipient(transaction) { }
    async revertForRecipient(transaction) { }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionPoolQuery),
    __metadata("design:type", Object)
], DelegateResignationTransactionHandler.prototype, "poolQuery", void 0);
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionHistoryService),
    __metadata("design:type", Object)
], DelegateResignationTransactionHandler.prototype, "transactionHistoryService", void 0);
DelegateResignationTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], DelegateResignationTransactionHandler);
exports.DelegateResignationTransactionHandler = DelegateResignationTransactionHandler;
//# sourceMappingURL=delegate-resignation.js.map