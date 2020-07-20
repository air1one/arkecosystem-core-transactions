"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferTransactionHandler = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const index_1 = require("../index");
let TransferTransactionHandler = class TransferTransactionHandler extends index_1.One.TransferTransactionHandler {
    getConstructor() {
        return crypto_1.Transactions.Two.TransferTransaction;
    }
    async bootstrap() {
        const transactions = await this.transactionRepository.findReceivedTransactions();
        for (const transaction of transactions) {
            const wallet = this.walletRepository.findByAddress(transaction.recipientId);
            wallet.balance = wallet.balance.plus(transaction.amount);
        }
    }
};
TransferTransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], TransferTransactionHandler);
exports.TransferTransactionHandler = TransferTransactionHandler;
//# sourceMappingURL=transfer.js.map