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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionHandler = void 0;
const core_database_1 = require("@arkecosystem/core-database");
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
const errors_1 = require("../errors");
// todo: revisit the implementation, container usage and arguments after core-database rework
let TransactionHandler = class TransactionHandler {
    async verify(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const senderWallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        if (senderWallet.hasMultiSignature()) {
            transaction.isVerified = this.verifySignatures(senderWallet, transaction.data);
        }
        return transaction.isVerified;
    }
    dynamicFee({ addonBytes, satoshiPerByte, transaction, }) {
        addonBytes = addonBytes || 0;
        if (satoshiPerByte <= 0) {
            satoshiPerByte = 1;
        }
        const transactionSizeInBytes = Math.round(transaction.serialized.length / 2);
        return crypto_1.Utils.BigNumber.make(addonBytes + transactionSizeInBytes).times(satoshiPerByte);
    }
    async throwIfCannotBeApplied(transaction, sender) {
        const senderWallet = this.walletRepository.findByAddress(sender.address);
        core_kernel_1.Utils.assert.defined(sender.publicKey);
        if (!this.walletRepository.hasByPublicKey(sender.publicKey) && senderWallet.balance.isZero()) {
            throw new errors_1.ColdWalletError();
        }
        return this.performGenericWalletChecks(transaction, sender);
    }
    async apply(transaction) {
        await this.applyToSender(transaction);
        await this.applyToRecipient(transaction);
    }
    async revert(transaction) {
        await this.revertForSender(transaction);
        await this.revertForRecipient(transaction);
    }
    async applyToSender(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const data = transaction.data;
        if (crypto_1.Utils.isException(data)) {
            this.logger.warning(`Transaction forcibly applied as an exception: ${transaction.id}.`);
        }
        await this.throwIfCannotBeApplied(transaction, sender);
        // TODO: extract version specific code
        if (data.version && data.version > 1) {
            this.verifyTransactionNonceApply(sender, transaction);
            core_kernel_1.Utils.assert.defined(data.nonce);
            sender.nonce = data.nonce;
        }
        else {
            sender.nonce = sender.nonce.plus(1);
        }
        const newBalance = sender.balance.minus(data.amount).minus(data.fee);
        assert_1.default(crypto_1.Utils.isException(transaction.data) || !newBalance.isNegative());
        // negativeBalanceExceptions check is never executed, because performGenericWalletChecks already checks balance
        // if (process.env.CORE_ENV === "test") {
        //     assert(Utils.isException(transaction.data.id) || !newBalance.isNegative());
        // } else {
        //     if (newBalance.isNegative()) {
        //         const negativeBalanceExceptions: Record<string, Record<string, string>> =
        //             Managers.configManager.get("exceptions.negativeBalances") || {};
        //
        //         AppUtils.assert.defined<string>(sender.publicKey);
        //
        //         const negativeBalances: Record<string, string> = negativeBalanceExceptions[sender.publicKey] || {};
        //
        //         if (!newBalance.isEqualTo(negativeBalances[sender.nonce.toString()] || 0)) {
        //             throw new InsufficientBalanceError();
        //         }
        //     }
        // }
        sender.balance = newBalance;
    }
    async revertForSender(transaction) {
        core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
        const sender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const data = transaction.data;
        sender.balance = sender.balance.plus(data.amount).plus(data.fee);
        // TODO: extract version specific code
        this.verifyTransactionNonceRevert(sender, transaction);
        sender.nonce = sender.nonce.minus(1);
    }
    /**
     * Database Service
     */
    emitEvents(transaction, emitter) { }
    /**
     * Transaction Pool logic
     */
    async throwIfCannotEnterPool(transaction) { }
    /**
     * @param {Contracts.State.Wallet} wallet
     * @param {Interfaces.ITransactionData} transaction
     * @param {Interfaces.IMultiSignatureAsset} [multiSignature]
     * @returns {boolean}
     * @memberof TransactionHandler
     */
    verifySignatures(wallet, transaction, multiSignature) {
        return crypto_1.Transactions.Verifier.verifySignatures(transaction, multiSignature || wallet.getAttribute("multiSignature"));
    }
    async performGenericWalletChecks(transaction, sender) {
        const data = transaction.data;
        if (crypto_1.Utils.isException(data)) {
            return;
        }
        this.verifyTransactionNonceApply(sender, transaction);
        if (sender.balance.minus(data.amount).minus(data.fee).isNegative()) {
            throw new errors_1.InsufficientBalanceError();
        }
        if (data.senderPublicKey !== sender.publicKey) {
            throw new errors_1.SenderWalletMismatchError();
        }
        if (sender.hasSecondSignature()) {
            core_kernel_1.Utils.assert.defined(data.senderPublicKey);
            // Ensure the database wallet already has a 2nd signature, in case we checked a pool wallet.
            const dbSender = this.walletRepository.findByPublicKey(data.senderPublicKey);
            if (!dbSender.hasSecondSignature()) {
                throw new errors_1.UnexpectedSecondSignatureError();
            }
            if (!crypto_1.Transactions.Verifier.verifySecondSignature(data, dbSender.getAttribute("secondPublicKey"))) {
                throw new errors_1.InvalidSecondSignatureError();
            }
        }
        else if (data.secondSignature || data.signSignature) {
            const isException = crypto_1.Managers.configManager.get("network.name") === "devnet" &&
                crypto_1.Managers.configManager.getMilestone().ignoreInvalidSecondSignatureField;
            if (!isException) {
                throw new errors_1.UnexpectedSecondSignatureError();
            }
        }
        // Prevent legacy multi signatures from being used
        const isMultiSignatureRegistration = transaction.type === crypto_1.Enums.TransactionType.MultiSignature &&
            transaction.typeGroup === crypto_1.Enums.TransactionTypeGroup.Core;
        if (isMultiSignatureRegistration && !crypto_1.Managers.configManager.getMilestone().aip11) {
            throw new errors_1.UnexpectedMultiSignatureError();
        }
        if (sender.hasMultiSignature()) {
            core_kernel_1.Utils.assert.defined(transaction.data.senderPublicKey);
            // Ensure the database wallet already has a multi signature, in case we checked a pool wallet.
            const dbSender = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);
            if (!dbSender.hasMultiSignature()) {
                throw new errors_1.UnexpectedMultiSignatureError();
            }
            if (dbSender.hasAttribute("multiSignature.legacy")) {
                throw new errors_1.LegacyMultiSignatureError();
            }
            if (!this.verifySignatures(dbSender, data, dbSender.getAttribute("multiSignature"))) {
                throw new errors_1.InvalidMultiSignatureError();
            }
        }
        else if (transaction.data.signatures && !isMultiSignatureRegistration) {
            throw new errors_1.UnexpectedMultiSignatureError();
        }
    }
    /**
     * Verify that the transaction's nonce is the wallet nonce plus one, so that the
     * transaction can be applied to the wallet. Throw an exception if it is not.
     *
     * @param {Interfaces.ITransaction} transaction
     * @memberof Wallet
     */
    verifyTransactionNonceApply(wallet, transaction) {
        const version = transaction.data.version || 1;
        const nonce = transaction.data.nonce || core_kernel_1.Utils.BigNumber.ZERO;
        if (version > 1 && !wallet.nonce.plus(1).isEqualTo(nonce)) {
            throw new errors_1.UnexpectedNonceError(nonce, wallet, false);
        }
    }
    /**
     * Verify that the transaction's nonce is the same as the wallet nonce, so that the
     * transaction can be reverted from the wallet. Throw an exception if it is not.
     *
     * @param wallet
     * @param {Interfaces.ITransaction} transaction
     * @memberof Wallet
     */
    verifyTransactionNonceRevert(wallet, transaction) {
        const version = transaction.data.version || 1;
        const nonce = transaction.data.nonce || core_kernel_1.Utils.BigNumber.ZERO;
        if (version > 1 && !wallet.nonce.isEqualTo(nonce)) {
            throw new errors_1.UnexpectedNonceError(nonce, wallet, true);
        }
    }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.Application),
    __metadata("design:type", Object)
], TransactionHandler.prototype, "app", void 0);
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.DatabaseBlockRepository),
    __metadata("design:type", core_database_1.Repositories.BlockRepository)
], TransactionHandler.prototype, "blockRepository", void 0);
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.DatabaseTransactionRepository),
    __metadata("design:type", core_database_1.Repositories.TransactionRepository)
], TransactionHandler.prototype, "transactionRepository", void 0);
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.WalletRepository),
    __metadata("design:type", Object)
], TransactionHandler.prototype, "walletRepository", void 0);
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.LogService),
    __metadata("design:type", Object)
], TransactionHandler.prototype, "logger", void 0);
TransactionHandler = __decorate([
    core_kernel_1.Container.injectable()
], TransactionHandler);
exports.TransactionHandler = TransactionHandler;
//# sourceMappingURL=transaction.js.map