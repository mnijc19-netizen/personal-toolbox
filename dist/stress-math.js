(function () {
  "use strict";

  // At 120 months, even two maximum-sized monthly payments still fit in a safe integer.
  const maxMoneyCents = 10_000_000_000_000;
  const maxMonths = 120;

  function decimalHundredths(text) {
    if (!/^\+?(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text)) return NaN;
    const [whole, fraction = ""] = text.replace(/^\+/, "").split(".");
    return Number(whole + fraction.padEnd(2, "0"));
  }

  function cashAtMonth(cash, monthlyCost, month) {
    const net = cash - monthlyCost * month;
    return { balance: Math.max(0, net), shortfall: Math.max(0, -net) };
  }

  function plan(cash, monthlyCost, months) {
    const fullMonths = monthlyCost === 0 ? null : Number(BigInt(cash) / BigInt(monthlyCost));
    return {
      monthlyCost,
      fullMonths,
      firstShortMonth: fullMonths === null ? null : fullMonths + 1,
      required: monthlyCost * months,
      ...cashAtMonth(cash, monthlyCost, months)
    };
  }

  function calculate(inputs = {}) {
    const errors = {};
    const values = {};
    for (const field of ["cash", "fund", "living", "contribution", "drop", "months"]) {
      const input = inputs?.[field];
      const text = (typeof input === "string" || typeof input === "number")
        ? String(input).normalize("NFKC").trim() : "";
      if (!text) {
        errors[field] = "请填写此项";
        continue;
      }
      if (field === "months") {
        const count = Number(text);
        if (!/^\+?\d+$/.test(text) || !Number.isInteger(count) || count > maxMonths) {
          errors[field] = "请输入 0 至 120 的整数月数";
        } else values.months = count;
        continue;
      }
      const value = decimalHundredths(text);
      if (field === "drop") {
        if (!Number.isSafeInteger(value) || value > 10000) {
          errors.drop = "跌幅须在 0% 至 100% 之间，最多两位小数";
        } else values.dropBps = value;
      } else if (!Number.isSafeInteger(value) || value > maxMoneyCents) {
        errors[field] = "请输入 0 至 1000 亿元的金额，最多两位小数";
      } else values[field] = value;
    }
    if (Object.keys(errors).length) return { ok: false, errors };

    const { cash, fund, living, contribution, dropBps, months } = values;
    // Fund size × basis points can exceed Number.MAX_SAFE_INTEGER before division.
    const loss = Number((BigInt(fund) * BigInt(dropBps) + 5000n) / 10000n);
    const continuing = plan(cash, living + contribution, months);
    const paused = plan(cash, living, months);
    const rows = Array.from({ length: months }, (_, index) => {
      const month = index + 1;
      return {
        month,
        continuing: cashAtMonth(cash, continuing.monthlyCost, month),
        paused: cashAtMonth(cash, paused.monthlyCost, month)
      };
    });
    return { ok: true, ...values, loss, fundAfter: fund - loss, continuing, paused, rows };
  }

  const api = Object.freeze({ calculate });
  if (typeof module === "object" && module.exports) module.exports = api;
  else window.StressMath = api;
})();
