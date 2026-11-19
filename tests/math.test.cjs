"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { calculate } = require("../dist/math.js");

const defaults = { winProbability: "55", winAmount: "1", lossAmount: "1", bankroll: "1000", fraction: "1" };

function run(overrides = {}) {
  const result = calculate({ ...defaults, ...overrides });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result;
}

test("55% 等额盈亏的全、半、四分之一凯利", () => {
  for (const [fraction, percent, stake] of [["1", "10.00%", "100.00"],
    ["0.5", "5.00%", "50.00"], ["0.25", "2.50%", "25.00"]]) {
    const r = run({ fraction });
    assert.equal(r.p.percent(), "55.00%");
    assert.equal(r.q.percent(), "45.00%");
    assert.equal(r.ev.toDecimal(), "0.1");
    assert.equal(r.breakEven.percent(), "50.00%");
    assert.equal(r.fullKelly.percent(), "10.00%");
    assert.equal(r.allocation.percent(), percent);
    assert.equal(r.stake.toFixed(), stake);
    assert.equal(r.edgeSign, 1);
  }
});

test("非对称盈亏和部分损失采用每元净盈亏", () => {
  const r = run({ winProbability: "40", winAmount: "2", lossAmount: "0.5" });
  assert.equal(r.ev.toFixed(), "0.50");
  assert.equal(r.breakEven.percent(), "20.00%");
  assert.equal(r.rawKelly.percent(), "50.00%");
  assert.equal(r.stake.toFixed(), "500.00");
});

test("负期望、盈亏平衡、确定性事件和无杠杆上限", () => {
  const loss = run({ winProbability: "0" });
  assert.equal(loss.ev.compare(-1), 0);
  assert.equal(loss.rawKelly.compare(-1), 0);
  assert.equal(loss.edgeSign, -1);
  assert.equal(loss.stake.compare(0), 0);
  const fair = run({ winProbability: "20", winAmount: "2", lossAmount: "0.5" });
  assert.equal(fair.edgeSign, 0);
  assert.equal(fair.stake.compare(0), 0);
  const certain = run({ winProbability: "100", lossAmount: "0.2", bankroll: "0" });
  assert.equal(certain.rawKelly.compare(5), 0);
  assert.equal(certain.fullKelly.compare(1), 0);
  assert.equal(certain.stake.compare(0), 0);
  const capped = run({ winProbability: "80", winAmount: "2", lossAmount: "0.25", fraction: "0.25" });
  assert.equal(capped.rawKelly.compare("3.1"), 0);
  assert.equal(capped.allocation.compare("0.25"), 0);
});

test("精确识别盈亏平衡点两侧的微小差异", () => {
  const small = run({ winProbability: "50.000000000000000001" });
  assert.equal(small.ev.compare("0.00000000000000000002"), 0);
  assert.equal(small.edgeSign, 1);
  const negative = run({ winProbability: "49.999999999999999999" });
  assert.equal(negative.ev.compare("-0.00000000000000000002"), 0);
  assert.equal(negative.edgeSign, -1);
  assert.equal(negative.stake.toFixed(), "0.00");
});

test("金额按分向下取整，包括小于一分、分数交界和超过安全整数的资金", () => {
  for (const [bankroll, stake] of [["0.099", "0.00"], ["0.10", "0.01"], ["29.90", "2.99"],
    ["29.999", "2.99"], ["9007199254740993.9", "900719925474099.39"]]) {
    assert.equal(run({ bankroll }).stake.toFixed(), stake);
  }
});

test("展示层四舍五入不进入后续运算并去掉尾零", () => {
  const plus = run({ winProbability: "50.75" }).ev;
  const minus = run({ winProbability: "49.25" }).ev;
  assert.equal(plus.toFixed(), "0.02");
  assert.equal(minus.toFixed(), "-0.02");
  assert.equal(plus.toDecimal(), "0.015");
  assert.equal(minus.toFixed(0), "0");
  assert.equal(plus.toNumber(), 0.015);
  assert.equal(run({ winAmount: "１０.００" }).win.toDecimal(), "10");
  assert.equal(run({ winAmount: ".5", bankroll: "+2." }).win.toDecimal(), "0.5");
});

test("输入域和小数格式校验产生对应字段错误", () => {
  const bad = { winProbability: ["", "NaN", "Infinity", "-0.1", "100.01", "5e1"],
    winAmount: ["0", "-1", "2x", "1".repeat(65)], lossAmount: ["0", "1.01", "."],
    bankroll: [null, "-1", "1,234", "1.2.3"], fraction: ["0", "0.3", "2"] };
  for (const [field, values] of Object.entries(bad)) {
    for (const value of values) {
      const r = calculate({ ...defaults, [field]: value });
      assert.equal(r.ok, false);
      assert.deepEqual(Object.keys(r.errors), [field]);
    }
  }
  assert.deepEqual(Object.keys(calculate().errors).sort(), Object.keys(defaults).sort());
});

test("独立整分公式核对 2,280 组金额，无中间舍入", () => {
  const bankrollCents = 100123n;
  for (let p = 0; p <= 95; p += 5) {
    for (const w of [1, 2, 5, 9, 10, 13, 17, 21, 30, 100, 127, 200, 218, 323, 410, 512, 789, 900, 999]) {
      for (const l of [3, 10]) {
        for (const [fraction, divisor] of [["1", 1n], ["0.5", 2n], ["0.25", 4n]]) {
          const r = run({ winProbability: String(p), winAmount: String(w / 10),
            lossAmount: String(l / 10), bankroll: "1001.23", fraction });
          const numerator = BigInt(10 * (p * w - (100 - p) * l));
          const denominator = BigInt(100 * w * l);
          const capped = numerator < 0n ? 0n : numerator > denominator ? denominator : numerator;
          const cents = bankrollCents * capped / (denominator * divisor);
          assert.equal(r.stake.toFixed(), String(cents / 100n) + "." + String(cents % 100n).padStart(2, "0"));
        }
      }
    }
  }
});

test("数值核对凯利解最大化期望对数增长率", () => {
  for (const p of [0.08, 0.31, 0.5, 0.67, 0.92]) {
    for (const w of [0.2, 1, 2.3, 13]) {
      for (const l of [0.15, 0.6, 1]) {
        const r = run({ winProbability: String(Math.round(100 * p)), winAmount: String(w), lossAmount: String(l) });
        const growth = f => p * Math.log1p(w * f) + (1 - p) * Math.log1p(-l * f);
        const optimalGrowth = growth(r.fullKelly.toNumber());
        for (let i = 0; i <= 1000; i++) {
          assert.ok(growth(i / 1000) <= optimalGrowth + 1e-14);
        }
      }
    }
  }
});
