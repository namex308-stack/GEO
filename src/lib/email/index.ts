export {
  isResendConfigured,
  resolveResendConfig,
  type ResendConfig,
} from "./config";
export {
  isAuthorizedEmailRecipient,
  normalizeEmailRecipient,
} from "./recipient";
export {
  sendTransactionalEmail,
  type SendEmailInput,
  type SendEmailResult,
} from "./resend";
