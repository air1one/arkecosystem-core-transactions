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
exports.IpfsTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../../errors");
const transaction_1 = require("../transaction");
// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
let IpfsTransactionHandler = class IpfsTransactionHandler extends transaction_1.TransactionHandler {
    dependencies() {
        return [];
    }
    walletAttributes() {
        return ["ipfs", "ipfs.hashes"];
    }
    getConstructor() {
        return crypto_1.Transactions.Two.IpfsTransaction;
    }
    async bootstrap() {
        var _a;
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            core_kernel_1.Utils.assert.defined(transaction.senderPublicKey);
            core_kernel_1.Utils.assert.defined((_a = transaction.asset) === null || _a === void 0 ? void 0 : _a.ipfs);
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            if (!wallet.hasAttribute("ipfs")) {
                wallet.setAttribute("ipfs", { hashes: {} });
            }
            const ipfsHashes = wallet.getAttribute("ipfs.hashes");
            ipfsHashes[transaction.asset.ipfs] = true;
            this.walletRepository.index(wallet);
        }
    }
    async isActivated() {
        return crypto_1.Managers.configManager.getMilestone().aip11 === true;
    }
    async throwIfCannotBeApplied(transaction, wallet) {
        if (crypto_1.Utils.isException(transaction.data)) {
            return;
        }
        if (this.walletRepository.getIndex(core_kernel_1.Contracts.State.WalletIndexes.Ipfs).has(transaction.data.asset.ipfs)) {
            throw new errors_1.IpfsHashAlreadyExists();
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }
    async applyToSender(transaction) {
        var _a;
        await super.applyToSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        if (!sender.hasAttribute("ipfs")) {
            sender.setAttribute("ipfs", { hashes: {} });
        }
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.ipfs);
        sender.getAttribute("ipfs.hashes", {})[transaction.data.asset.ipfs] = true;
        this.walletRepository.index(sender);
    }
    async revertForSender(transaction) {
        var _a;
        await super.revertForSender(transaction);
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        core_kernel_1.Utils.assert.defined((_a = transaction.data.asset) === null || _a === void 0 ? void 0 : _a.ipfs);
        const ipfsHashes = sender.getAttribute("ipfs.hashes");
        delete ipfsHashes[transaction.data.asset.ipfs];
        if (!Object.keys(ipfsHashes).length) {
            sender.forgetAttribute("ipfs");
        }
        this.walletRepository.index(sender);
    }
    async applyToRecipient(transaction) { }
    async revertForRecipient(transaction) { }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionHistoryService),
    __metadata("design:type", Object)
], IpfsTransactionHandler.prototype, "transactionHistoryService", void 0);
IpfsTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], IpfsTransactionHandler);
exports.IpfsTransactionHandler = IpfsTransactionHandler;
//# sourceMappingURL=ipfs.js.map