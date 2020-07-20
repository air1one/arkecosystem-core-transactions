"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceProvider = void 0;
const core_kernel_1 = require("@arkecosystem/core-kernel");
const handlers_1 = require("./handlers");
const handler_provider_1 = require("./handlers/handler-provider");
const handler_registry_1 = require("./handlers/handler-registry");
class ServiceProvider extends core_kernel_1.Providers.ServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    async register() {
        this.app
            .bind(core_kernel_1.Container.Identifiers.WalletAttributes)
            .to(core_kernel_1.Services.Attributes.AttributeSet)
            .inSingletonScope();
        this.app
            .bind(core_kernel_1.Container.Identifiers.TransactionHandlerProvider)
            .to(handler_provider_1.TransactionHandlerProvider)
            .inSingletonScope();
        this.app
            .bind(core_kernel_1.Container.Identifiers.WalletRepository)
            .toConstantValue(null)
            .when(core_kernel_1.Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "null"));
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.One.TransferTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.TransferTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.One.SecondSignatureRegistrationTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.SecondSignatureRegistrationTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.One.DelegateRegistrationTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.DelegateRegistrationTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.One.VoteTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.VoteTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.One.MultiSignatureRegistrationTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.MultiSignatureRegistrationTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.IpfsTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.MultiPaymentTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.DelegateResignationTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.HtlcLockTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.HtlcClaimTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandler).to(handlers_1.Two.HtlcRefundTransactionHandler);
        this.app.bind(core_kernel_1.Container.Identifiers.TransactionHandlerRegistry).to(handler_registry_1.TransactionHandlerRegistry);
    }
    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    async required() {
        return true;
    }
}
exports.ServiceProvider = ServiceProvider;
//# sourceMappingURL=service-provider.js.map