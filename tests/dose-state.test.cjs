const test = require("node:test");
const assert = require("node:assert/strict");
const {compare} = require("../dist/dose-state.js");

test("未自评有别于明确选择零分", () => {
  for (const [want,like] of [[null,null],[10,null],[null,0]]) assert.equal(compare(want,like),null);
  assert.match(compare(0,0).title,/都低/);
});

test("阈值重合时先识别高渴望低满足，再比较有方向的三分之差", () => {
  assert.equal(compare(7,3).title,"很想继续，满足感偏低");
  assert.equal(compare(10,7).title,"继续意愿高于实际满足");
  assert.equal(compare(7,10).title,"满足感高于继续意愿");
  assert.match(compare(7,8).title,/都高/);
  assert.match(compare(3,2).title,/都低/);
  assert.match(compare(5,6).title,/接近/);
});

test("全部 121 种评分组合都能进入一个可操作的下一步", () => {
  for (let want=0; want<=10; want++) {
    for (let like=0; like<=10; like++) {
      const result = compare(want,like);
      assert.ok(result.title && result.hint);
      assert.ok(["friction","actions"].includes(result.next));
      if (want-like >= 3) assert.equal(result.next,"friction");
    }
  }
});
