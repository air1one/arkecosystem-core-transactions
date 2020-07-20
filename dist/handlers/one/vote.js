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
exports.VoteTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
const delegate_registration_1 = require("./delegate-registration");
// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
let VoteTransactionHandler = class VoteTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [delegate_registration_1.DelegateRegistrationTransactionHandler];
    }
    walletAttributes() {
        return ["vote"];
    }
    getConstructor() {
        return crypto_1.Transactions.One.VoteTransaction;
    }
    async bootstrap() { }
    async isActivated() {
        return true;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        var _a;
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.votes);
        const vote = transaction.data.asset.votes[0];
        let walletVote;
        const delegatePublicKey = vote.slice(1);
        const delegateWallet = this.walletRepository.findByPublicKey(delegatePublicKey);
        if (wallet.hasAttribute("vote")) {
            walletVote = wallet.getAttribute("vote");
        }
        if (vote.startsWith("+")) {
            if (walletVote) {
                throw new errors_1.AlreadyVotedError();
            }
            if (delegateWallet.hasAttribute("delegate.resigned")) {
                throw new errors_1.VotedForResignedDelegateError(vote);
            }
        }
        else {
            if (!walletVote) {
                throw new errors_1.NoVoteError();
            }
            else if (walletVote !== vote.slice(1)) {
                throw new errors_1.UnvoteMismatchError();
            }
        }
        if (!delegateWallet.isDelegate()) {
            throw new errors_1.VotedForNonDelegateError(vote);
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }
    emitEvents(transaction, emitter) {
        var _a;
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.votes);
        const vote = transaction.data.asset.votes[0];
        emitter.dispatch(vote.startsWith("+") ? "wallet.vote" : "wallet.unvote", {
            delegate: vote,
            transaction: transaction.data,
        });
    }
    async throwIfCannotEnterPool(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const hasSender = this.poolQuery
            .getAllBySender(transaction.data.senderPublicKey)
            .whereKind(transaction)
            .has();
        if (hasSender) {
            throw new core_kernel_1.Contracts.TransactionPool.PoolError(`Sender ${transaction.data.senderPublicKey} already has a transaction of type '${crypto_1.Enums.TransactionType.Vote}' in the pool`, "ERR_PENDING");
        }
    }
    async applyToSender(transaction) {
        var _a;
        await super.applyToSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.votes);
        const vote = transaction.data.asset.votes[0];
        if (vote.startsWith("+")) {
            sender.setAttribute("vote", vote.slice(1));
        }
        else {
            sender.forgetAttribute("vote");
        }
    }
    async revertForSender(transaction) {
        var _a;
        await super.revertForSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.votes);
        const vote = transaction.data.asset.votes[0];
        if (vote.startsWith("+")) {
            sender.forgetAttribute("vote");
        }
        else {
            sender.setAttribute("vote", vote.slice(1));
        }
    }
    async applyToRecipient(transaction) { }
    async revertForRecipient(transaction) { }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionPoolQuery),
    __metadata("design:type", Object)
], VoteTransactionHandler.prototype, "poolQuery", void 0);
VoteTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], VoteTransactionHandler);
exports.VoteTransactionHandler = VoteTransactionHandler;
//# sourceMappingURL=vote.js.map