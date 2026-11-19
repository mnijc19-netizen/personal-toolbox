"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { calculate } = require("../dist/stress-math.js");

const defaults = { cash: "24000", fund: "40000", living: "4000", contribution: "2000", drop: "40", months: "6" };

function run(overrides = {}) {
  const result = calculate({ ...defaults, ...overrides });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  return result;
}

test("示例独立核对继续与暂停定投的覆盖月数、缺口及基金浮亏", () => {
  const r = run();
  assert.equal(r.loss, 1_600_000);
  assert.equal(r.fundAfter, 2_400_000);
  assert.deepEqual(r.continuing, { monthlyCost: 600_000, fullMonths: 4, firstShortMonth: 5,
    required: 3_600_000, balance: 0, shortfall: 1_200_000 });
  assert.deepEqual(r.paused, { monthlyCost: 400_000, fullMonths: 6, firstShortMonth: 7,
    required: 2_400_000, balance: 0, shortfall: 0 });
  assert.deepEqual(r.rows.map(row => row.continuing.balance), [1_800_000, 1_200_000, 600_000, 0, 0, 0]);
  assert.deepEqual(r.rows.map(row => row.continuing.shortfall), [0, 0, 0, 0, 600_000, 1_200_000]);
  assert.deepEqual(r.rows[5], { month: 6, continuing: { balance: 0, shortfall: 1_200_000 },
    paused: { balance: 0, shortfall: 0 } });
});

test("停薪时长限定现金流水账期，不改变按同一开支测算的覆盖能力", () => {
  const uninterrupted = run({ months: "0" });
  assert.equal(uninterrupted.continuing.fullMonths, 4);
  assert.equal(uninterrupted.continuing.required, 0);
  assert.equal(uninterrupted.continuing.balance, uninterrupted.cash);
  assert.equal(uninterrupted.paused.shortfall, 0);
  assert.equal(uninterrupted.loss, 1_600_000);
  assert.deepEqual(uninterrupted.rows, []);
  const short = run({ months: "2" });
  assert.equal(short.continuing.fullMonths, 4);
  assert.equal(short.continuing.balance, 1_200_000);
  assert.equal(short.continuing.shortfall, 0);
});

test("基金在期初下跌一次，不卖基金时不会抵扣现金", () => {
  const noDrop = run({ drop: "0" });
  const totalLoss = run({ drop: "100" });
  assert.equal(noDrop.fundAfter, noDrop.fund);
  assert.equal(totalLoss.fundAfter, 0);
  assert.equal(totalLoss.loss, totalLoss.fund);
  assert.deepEqual(noDrop.rows, totalLoss.rows);
  assert.deepEqual(noDrop.continuing, totalLoss.continuing);
  assert.deepEqual(noDrop.paused, totalLoss.paused);
  assert.equal(run({ fund: "0" }).loss, 0);
});

test("整分、半分及略低于半分的资金变动精确处理", () => {
  const r = run({ cash: "0.29", fund: "0.01", living: ".1", contribution: "0.05", drop: "50" });
  assert.equal(r.loss, 1);
  assert.equal(r.fundAfter, 0);
  assert.equal(r.continuing.fullMonths, 1);
  assert.equal(r.rows[1].continuing.shortfall, 1);
  assert.equal(run({ fund: "0.01", drop: "49.99" }).loss, 0);
  assert.equal(run({ fund: "2.01", drop: "50" }).loss, 101);
  assert.equal(run({ cash: "０．３０", living: ".10", contribution: ".05" }).continuing.fullMonths, 2);
});

test("无开支的覆盖月数无上限；无现金有开支时第一月即有缺口", () => {
  const empty = run({ cash: "0", living: "0", contribution: "0" });
  assert.equal(empty.continuing.fullMonths, null);
  assert.equal(empty.continuing.firstShortMonth, null);
  assert.equal(empty.paused.fullMonths, null);
  assert.equal(empty.continuing.shortfall, 0);
  const investing = run({ cash: "0", living: "0", contribution: "1" });
  assert.equal(investing.continuing.fullMonths, 0);
  assert.equal(investing.continuing.firstShortMonth, 1);
  assert.equal(investing.continuing.shortfall, 600);
  assert.equal(investing.paused.fullMonths, null);
  assert.equal(investing.paused.shortfall, 0);
  const noInvestment = run({ contribution: "0" });
  assert.deepEqual(noInvestment.continuing, noInvestment.paused);
});

test("全部字段逐一验证，拒绝未填写、负数、超限及非十进制金额", () => {
  assert.deepEqual(Object.keys(calculate(null).errors), Object.keys(defaults));
  for (const [key, values] of Object.entries({
    cash: ["", " ", null, "Infinity", "1e3", "-1", "1.234", "100000000000.01"],
    fund: [false, "0x20", "1,000"], living: ["-0.1"], contribution: ["NaN"],
    drop: ["-0.01", "100.01", "1.001"], months: ["-1", "1.5", "1e1", "121"]
  })) {
    for (const value of values) {
      const invalid = calculate({ ...defaults, [key]: value });
      assert.equal(invalid.ok, false);
      assert.deepEqual(Object.keys(invalid.errors), [key]);
    }
  }
});

test("最大金额、最大停薪时长及大额浮亏的整数精度", () => {
  const r = run({ cash: "100000000000", fund: "99999999999.99", living: "100000000000",
    contribution: "100000000000", drop: "99.99", months: "120" });
  assert.equal(r.continuing.fullMonths, 0);
  assert.equal(r.paused.fullMonths, 1);
  assert.equal(r.continuing.required, 2_400_000_000_000_000);
  assert.equal(r.continuing.shortfall, 2_390_000_000_000_000);
  assert.equal(r.loss, 9_998_999_999_999);
  assert.equal(r.fundAfter, 1_000_000_000);
  assert.equal(r.rows.length, 120);
});

test("以逐月支付的独立方法核对余额、缺口和首次无法付清月份", () => {
  for (const cash of ["0", "0.01", "0.10", "1.00", "11.27", "43.60"]) {
    for (const living of ["0", "0.01", ".53", "2.17"]) {
      for (const contribution of ["0", ".03", "1.89"]) {
        const r = run({ cash, living, contribution, months: 120 });
        for (const strategy of ["continuing", "paused"]) {
          const cost = r[strategy].monthlyCost;
          let balance = r.cash, shortfall = 0, firstShort = null;
          for (const row of r.rows) {
            const paid = Math.min(balance, cost);
            balance -= paid;
            shortfall += cost - paid;
            if (shortfall > 0 && firstShort === null) firstShort = row.month;
            assert.deepEqual(row[strategy], { balance, shortfall });
          }
          assert.equal(r[strategy].balance, balance);
          assert.equal(r[strategy].shortfall, shortfall);
          if (firstShort !== null) assert.equal(r[strategy].firstShortMonth, firstShort);
          else assert.ok(cost === 0 || r[strategy].fullMonths >= 120);
        }
      }
    }
  }
});
