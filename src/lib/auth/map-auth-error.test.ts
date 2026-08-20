import { describe, expect, it } from "vitest";
import { mapAuthErrorMessage } from "@/lib/auth/map-auth-error";
import { translate, type TranslationKey } from "@/lib/i18n";

const t = (key: TranslationKey) => translate(key);

describe("mapAuthErrorMessage", () => {
  it("maps invalid credential codes and messages", () => {
    expect(mapAuthErrorMessage({ code: "invalid_credentials", message: "" }, t)).toBe(
      translate("auth.error.invalidCredentials")
    );
    expect(mapAuthErrorMessage("Invalid login credentials", t)).toBe(
      translate("auth.error.invalidCredentials")
    );
  });

  it("falls back to a generic Arabic error when the provider message is empty", () => {
    expect(mapAuthErrorMessage({ message: "" }, t)).toBe(translate("auth.error.generic"));
  });

  it("keeps an unknown provider message so the user still sees feedback", () => {
    expect(mapAuthErrorMessage("Captcha check failed", t)).toBe("Captcha check failed");
  });
});
