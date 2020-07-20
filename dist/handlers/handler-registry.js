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
exports.TransactionHandlerRegistry = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const crypto_1 = require("@arkecosystem/crypto");
const errors_1 = require("../errors");
const handler_provider_1 = require("./handler-provider");
let TransactionHandlerRegistry = class TransactionHandlerRegistry {
    initialize() {
        if (this.provider.isRegistrationRequired()) {
            this.provider.registerHandlers();
        }
    }
    getRegisteredHandlers() {
        return this.handlers;
    }
    getRegisteredHandlerByType(internalType, version = 1) {
        for (const handler of this.handlers) {
            const transactionConstructor = handler.getConstructor();
            core_kernel_1.Utils.assert.defined(transactionConstructor.type);
            core_kernel_1.Utils.assert.defined(transactionConstructor.typeGroup);
            const handlerInternalType = crypto_1.Transactions.InternalTransactionType.from(transactionConstructor.type, transactionConstructor.typeGroup);
            if (handlerInternalType === internalType && transactionConstructor.version === version) {
                return handler;
            }
        }
        throw new errors_1.InvalidTransactionTypeError(internalType);
    }
    async getActivatedHandlers() {
        const promises = this.handlers.map(async (handler) => {
            return [handler, await handler.isActivated()];
        });
        const results = await Promise.all(promises);
        const activated = results.filter(([_, activated]) => activated);
        return activated.map(([handler, _]) => handler);
    }
    async getActivatedHandlerByType(internalType, version = 1) {
        const handler = this.getRegisteredHandlerByType(internalType, version);
        if (await handler.isActivated()) {
            return handler;
        }
        throw new errors_1.DeactivatedTransactionHandlerError(internalType);
    }
    async getActivatedHandlerForData(transactionData) {
        const internalType = crypto_1.Transactions.InternalTransactionType.from(transactionData.type, transactionData.typeGroup);
        return this.getActivatedHandlerByType(internalType, transactionData.version);
    }
};
__decorate([
    core_kernel_1.Container.inject(core_kernel_1.Container.Identifiers.TransactionHandlerProvider),
    __metadata("design:type", handler_provider_1.TransactionHandlerProvider)
], TransactionHandlerRegistry.prototype, "provider", void 0);
__decorate([
    core_kernel_1.Container.multiInject(core_kernel_1.Container.Identifiers.TransactionHandler),
    __metadata("design:type", Array)
], TransactionHandlerRegistry.prototype, "handlers", void 0);
__decorate([
    core_kernel_1.Container.postConstruct(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TransactionHandlerRegistry.prototype, "initialize", null);
TransactionHandlerRegistry = __decorate([
    core_kernel_1.Container.injectable()
], TransactionHandlerRegistry);
exports.TransactionHandlerRegistry = TransactionHandlerRegistry;
//# sourceMappingURL=handler-registry.js.map