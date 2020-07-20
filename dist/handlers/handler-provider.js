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
exports.TransactionHandlerProvider = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
let TransactionHandlerProvider = class TransactionHandlerProvider {
    constructor() {
        this.registered = false;
    }
    isRegistrationRequired() {
        return this.registered === false;
    }
    registerHandlers() {
        for (const handler of this.handlers) {
            this.registerHandler(handler);
        }
        this.registered = true;
    }
    registerHandler(handler) {
        const transactionConstructor = handler.getConstructor();
        core_kernel_1.Utils.assert.defined(transactionConstructor.type);
        core_kernel_1.Utils.assert.defined(transactionConstructor.typeGroup);
        const internalType = crypto_1.Transactions.InternalTransactionType.from(transactionConstructor.type, transactionConstructor.typeGroup);
        if (this.hasOtherHandlerHandling(handler, internalType, transactionConstructor.version)) {
            throw new errors_1.AlreadyRegisteredError(internalType);
        }
        for (const dependency of handler.dependencies()) {
            if (this.hasOtherHandlerInstance(handler, dependency) === false) {
                throw new errors_1.UnsatisfiedDependencyError(internalType);
            }
        }
        for (const attribute of handler.walletAttributes()) {
            if (!this.attributeSet.has(attribute)) {
                this.attributeSet.set(attribute);
            }
        }
        if (transactionConstructor.typeGroup !== crypto_1.Enums.TransactionTypeGroup.Core) {
            crypto_1.Transactions.TransactionRegistry.registerTransactionType(transactionConstructor);
        }
    }
    hasOtherHandlerHandling(handler, internalType, version) {
        for (const otherHandler of this.handlers) {
            if (otherHandler === handler)
                continue;
            const otherTransactionConstructor = otherHandler.getConstructor();
            core_kernel_1.Utils.assert.defined(otherTransactionConstructor.type);
            core_kernel_1.Utils.assert.defined(otherTransactionConstructor.typeGroup);
            const otherInternalType = crypto_1.Transactions.InternalTransactionType.from(otherTransactionConstructor.type, otherTransactionConstructor.typeGroup);
            if (otherInternalType === internalType && otherTransactionConstructor.version === version) {
                return true;
            }
        }
        return false;
    }
    hasOtherHandlerInstance(handler, dependency) {
        return this.handlers.some((otherHandler) => {
            return otherHandler !== handler && otherHandler.constructor === dependency;
        });
    }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.WalletAttributes),
    __metadata("design:type", core_kernel_1.Services.Attributes.AttributeSet)
], TransactionHandlerProvider.prototype, "attributeSet", void 0);
__decorate([
    core_kernel_1.Container.multiInject(core_kernel_1.Container.Identifiers.TransactionHandler),
    core_kernel_1.Container.tagged("state", "null"),
    __metadata("design:type", Array)
], TransactionHandlerProvider.prototype, "handlers", void 0);
TransactionHandlerProvider = __decorate([
    core_kernel_1.Container.injectable()
], TransactionHandlerProvider);
exports.TransactionHandlerProvider = TransactionHandlerProvider;
//# sourceMappingURL=handler-provider.js.map