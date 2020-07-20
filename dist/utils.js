"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecipientOnActiveNetwork = void 0;
const crypto_1 = require("@arkecosystem/crypto");
exports.isRecipientOnActiveNetwork = (recipientId) => crypto_1.Utils.Base58.decodeCheck(recipientId).readUInt8(0) === crypto_1.Managers.configManager.get("network.pubKeyHash");
//# sourceMappingURL=utils.js.map