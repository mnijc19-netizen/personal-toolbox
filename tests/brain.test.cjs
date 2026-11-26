const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve("../dist/brain-data.js"), "utf8"), context);
const {regions, networks, states, scenarios, sources} = context.window.BrainData;

function checkReferences(record) {
  assert.ok(record.refs.length, record.name);
  for (const id of record.refs) assert.equal(new URL(sources[id].url).protocol, "https:");
}

test("每个可选脑区都有分层、功能边界、行动与出处", () => {
  assert.equal(Object.keys(regions).length, 11);
  for (const region of Object.values(regions)) {
    assert.ok(["cortex","deep","base"].includes(region.layer));
    for (const key of ["name","function","limit","action","avoid"]) assert.ok(region[key].trim());
    checkReferences(region);
  }
});

test("生活状态可映射为有效脑区及两种时间尺度的行动", () => {
  assert.equal(new Set(states.map(s => s.id)).size, states.length);
  assert.ok(states.length >= 5);
  for (const state of states) {
    assert.ok(state.regions.length && state.regions.every(id => Object.hasOwn(regions,id)));
    assert.ok(state.now.trim() && state.later.trim() && state.mechanism.trim());
    checkReferences(state);
  }
});

test("场景的自然反应和干预路径均可播放，网络与来源可以解析", () => {
  assert.deepEqual(Object.keys(networks).sort(), ["cen","dmn","sn"]);
  Object.values(networks).forEach(checkReferences);
  assert.ok(scenarios.length >= 3);
  for (const scene of scenarios) {
    checkReferences(scene);
    assert.ok(scene.intervention.title && scene.intervention.text);
    for (const steps of [scene.steps, scene.intervention.steps]) {
      assert.ok(steps.length >= 2);
      for (const step of steps) {
        assert.ok(Object.hasOwn(regions,step.region));
        assert.ok(!step.network || Object.hasOwn(networks,step.network));
        assert.ok(step.title.trim() && step.text.trim());
      }
    }
  }
});
