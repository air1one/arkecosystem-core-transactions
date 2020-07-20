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
const core_kernel_2 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const index_1 = require("../index");
let DelegateRegistrationTransactionHandler = class DelegateRegistrationTransactionHandler extends index_1.One.DelegateRegistrationTransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.Two.DelegateRegistrationTransaction;
    }
    async bootstrap() {
        var _a, _b;
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            core_kernel_1.Utils.assert.defined(transaction.senderPublicKey);
            core_kernel_1.Utils.assert.defined((_b = (_a = transaction.asset) === null || _a === void 0 ? void 0 : _a.delegate) === null || _b === void 0 ? void 0 : _b.username);
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            wallet.setAttribute("delegate", {
                username: transaction.asset.delegate.username,
                voteBalance: crypto_1.Utils.BigNumber.ZERO,
                forgedFees: crypto_1.Utils.BigNumber.ZERO,
                forgedRewards: crypto_1.Utils.BigNumber.ZERO,
                producedBlocks: 0,
                rank: undefined,
            });
            this.walletRepository.index(wallet);
        }
        const forgedBlocks = await this.blockRepository.getDelegatesForgedBlocks();
        const lastForgedBlocks = await this.blockRepository.getLastForgedBlocks();
        for (const block of forgedBlocks) {
            const wallet = this.walletRepository.findByPublicKey(block.generatorPublicKey);
            // Genesis wallet is empty
            if (!wallet.hasAttribute("delegate")) {
                continue;
            }
            const delegate = wallet.getAttribute("delegate");
            delegate.forgedFees = delegate.forgedFees.plus(block.totalFees);
            delegate.forgedRewards = delegate.forgedRewards.plus(block.totalRewards);
            delegate.producedBlocks += +block.totalProduced;
        }
        for (const block of lastForgedBlocks) {
            const wallet = this.walletRepository.findByPublicKey(block.generatorPublicKey);
            // Genesis wallet is empty
            if (!wallet.hasAttribute("delegate")) {
                continue;
            }
            wallet.setAttribute("delegate.lastBlock", block);
        }
    }
};
__decorate([
    core_kernel_2.Container.inject(core_kernel_2.Container.Identifiers.TransactionHistoryService),
    __metadata("design:type", Object)
], DelegateRegistrationTransactionHandler.prototype, "transactionHistoryService", void 0);
DelegateRegistrationTransactionHandler = __decorate([
    core_kernel_2.Container.injectable()
], DelegateRegistrationTransactionHandler);
exports.DelegateRegistrationTransactionHandler = DelegateRegistrationTransactionHandler;
//# sourceMappingURL=delegate-registration.js.map