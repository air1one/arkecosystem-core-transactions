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
const index_1 = require("../index");
const delegate_registration_1 = require("./delegate-registration");
let VoteTransactionHandler = class VoteTransactionHandler extends index_1.One.VoteTransactionHandler {
    dependencies() {
        return [delegate_registration_1.DelegateRegistrationTransactionHandler];
    }
    getConstructor() {
        return crypto_1.Transactions.Two.VoteTransaction;
    }
    async bootstrap() {
        var _a;
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            core_kernel_1.Utils.assert.defined(transaction.senderPublicKey);
            core_kernel_1.Utils.assert.defined((_a = transaction.asset) === null || _a === void 0 ? void 0 : _a.votes);
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const vote = transaction.asset.votes[0];
            const hasVoted = wallet.hasAttribute("vote");
            if (vote.startsWith("+")) {
                if (hasVoted) {
                    throw new errors_1.AlreadyVotedError();
                }
                wallet.setAttribute("vote", vote.slice(1));
            }
            else {
                if (!hasVoted) {
                    throw new errors_1.NoVoteError();
                }
                else if (wallet.getAttribute("vote") !== vote.slice(1)) {
                    throw new errors_1.UnvoteMismatchError();
                }
                wallet.forgetAttribute("vote");
            }
        }
    }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionHistoryService),
    __metadata("design:type", Object)
], VoteTransactionHandler.prototype, "transactionHistoryService", void 0);
VoteTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], VoteTransactionHandler);
exports.VoteTransactionHandler = VoteTransactionHandler;
//# sourceMappingURL=vote.js.map