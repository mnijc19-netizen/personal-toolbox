(function () {
  "use strict";

  function gcd(a, b) {
    while (b !== 0n) {
      const remainder = a % b;
      a = b;
      b = remainder;
    }
    return a < 0n ? -a : a;
  }

  class Rational {
    constructor(numerator, denominator = 1n) {
      if (denominator === 0n) throw new RangeError("分母不能为零");
      const common = gcd(numerator, denominator);
      const divisor = denominator < 0n ? -common : common;
      this.numerator = numerator / divisor;
      this.denominator = denominator / divisor;
      Object.freeze(this);
    }

    static from(value) {
      if (value instanceof Rational) return value;
      if (typeof value !== "string" && typeof value !== "number") {
        throw new TypeError("请输入数字");
      }
      const input = String(value).trim().normalize("NFKC");
      if (!input) throw new TypeError("请填写此项");
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input)) {
        throw new TypeError("请输入十进制数字，例如 0.5");
      }
      const [whole, decimals = ""] = input.replace(/^[+-]/, "").split(".");
      if (whole.length + decimals.length > 64) {
        throw new RangeError("最多支持 64 位数字");
      }
      const sign = input.startsWith("-") ? -1n : 1n;
      return new Rational(sign * BigInt(whole + decimals), 10n ** BigInt(decimals.length));
    }

    add(other) {
      return new Rational(this.numerator * other.denominator + other.numerator * this.denominator,
        this.denominator * other.denominator);
    }

    subtract(other) {
      return new Rational(this.numerator * other.denominator - other.numerator * this.denominator,
        this.denominator * other.denominator);
    }

    multiply(other) {
      return new Rational(this.numerator * other.numerator, this.denominator * other.denominator);
    }

    divide(other) {
      return new Rational(this.numerator * other.denominator, this.denominator * other.numerator);
    }

    compare(value) {
      const other = Rational.from(value);
      const delta = this.numerator * other.denominator - other.numerator * this.denominator;
      return delta > 0n ? 1 : delta < 0n ? -1 : 0;
    }

    toFixed(digits = 2) {
      if (!Number.isInteger(digits) || digits < 0 || digits > 100) throw new RangeError("小数位数超出范围");
      const magnitude = this.numerator < 0n ? -this.numerator : this.numerator;
      const scaled = magnitude * 10n ** BigInt(digits);
      const rounded = scaled / this.denominator + ((scaled % this.denominator) * 2n >= this.denominator ? 1n : 0n);
      const text = rounded.toString().padStart(digits + 1, "0");
      const sign = this.numerator < 0n && rounded !== 0n ? "-" : "";
      return sign + (digits === 0 ? text : text.slice(0, -digits) + "." + text.slice(-digits));
    }

    toDecimal(digits = 8) {
      const text = this.toFixed(digits);
      return digits > 0 ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
    }

    percent(digits = 2) {
      return this.multiply(HUNDRED).toFixed(digits) + "%";
    }

    toNumber() {
      return Number(this.numerator) / Number(this.denominator);
    }
  }

  const ZERO = new Rational(0n);
  const ONE = new Rational(1n);
  const HUNDRED = new Rational(100n);
  const fractions = ["1", "0.5", "0.25"].map(Rational.from);
  const constraints = {
    winProbability: [n => n.compare(ZERO) >= 0 && n.compare(HUNDRED) <= 0, "胜率须在 0% 到 100% 之间"],
    winAmount: [n => n.compare(ZERO) > 0, "获胜净收益须大于 0"],
    lossAmount: [n => n.compare(ZERO) > 0 && n.compare(ONE) <= 0, "亏损金额须大于 0 且不超过 1"],
    bankroll: [n => n.compare(ZERO) >= 0, "可用资金须大于或等于 0"],
    fraction: [n => fractions.some(fraction => n.compare(fraction) === 0), "请选择全凯利、半凯利或四分之一凯利"],
  };

  function calculate(inputs = {}) {
    const errors = {};
    const values = {};
    for (const [name, [valid, message]] of Object.entries(constraints)) {
      try {
        const value = Rational.from(inputs[name]);
        if (valid(value)) values[name] = value;
        else errors[name] = message;
      } catch (error) {
        errors[name] = error.message;
      }
    }
    if (Object.keys(errors).length > 0) return { ok: false, errors };

    const { winProbability, winAmount: win, lossAmount: loss, bankroll, fraction } = values;
    const p = winProbability.divide(HUNDRED);
    const q = ONE.subtract(p);
    const ev = p.multiply(win).subtract(q.multiply(loss));
    const breakEven = loss.divide(win.add(loss));
    const rawKelly = ev.divide(win.multiply(loss));
    const fullKelly = rawKelly.compare(ZERO) < 0 ? ZERO : rawKelly.compare(ONE) > 0 ? ONE : rawKelly;
    const allocation = fullKelly.multiply(fraction);
    const exactStake = bankroll.multiply(allocation);
    // 向下取整到整分，确保投入额始终在比例和可用资金上限内。
    const stake = new Rational(exactStake.numerator * 100n / exactStake.denominator, 100n);
    return { ok: true, p, q, win, loss, bankroll, fraction, ev, breakEven,
      rawKelly, fullKelly, allocation, stake, edgeSign: ev.compare(ZERO) };
  }

  const api = Object.freeze({ calculate });
  if (typeof module === "object" && module.exports) module.exports = api;
  else window.ToolboxMath = api;
})();
