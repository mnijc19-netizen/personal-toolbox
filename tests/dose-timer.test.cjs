const test = require("node:test");
const assert = require("node:assert/strict");
const {empty,readState,remaining,transition} = require("../dist/dose-actions.js");

test("倒计时按截止时间恢复，暂停保留精确的剩余毫秒", () => {
  let state = transition(empty(),"start","first",1000,"abc");
  assert.equal(remaining(state.timer,3200),297800);
  state = transition(state,"pause","abc",3200);
  const restored = readState(JSON.stringify(state));
  assert.equal(remaining(restored.timer,500000),297800);
  state = transition(restored,"resume","abc",500000);
  assert.equal(remaining(state.timer,797799),1);
  assert.equal(remaining(state.timer,797800),0);
});

test("到时需确认完成才会打卡，重复确认或旧标签页命令不会改写新行动", () => {
  let state = transition(empty(),"start","first",0,"one");
  assert.equal(transition(state,"start","paper",100,"other"),state);
  assert.equal(transition(state,"check","one",299999),state);
  assert.equal(state.history.length,0);
  state = transition(state,"check","one",300000);
  assert.equal(state.history.length,1);
  assert.equal(state.timer,null);
  assert.equal(transition(state,"check","one",301000),state);
  state = transition(state,"start","paper",310000,"two");
  assert.equal(transition(state,"end","one",310001),state);
  state = transition(state,"end","two",311000);
  assert.equal(state.history.length,1);
  assert.equal(state.timer,null);
});

test("恢复存储时拒绝未知行动和非法时间，无记录以空状态开始", () => {
  assert.deepEqual(readState(null),empty());
  let state = transition(empty(),"start","first",0,"t");
  assert.throws(() => readState(JSON.stringify({...state,timer:{...state.timer,deadline:-1}})));
  assert.throws(() => readState(JSON.stringify({...state,timer:{...state.timer,action:"?"}})));
  assert.equal(transition(state,"pause","old",100),state);
});
