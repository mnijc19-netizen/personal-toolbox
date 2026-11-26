const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve("../dist/sla-data.js"), "utf8"), context);
const {stages, skills, traps, sources} = context.window.SLAData;

test("阶段保留已存的进度键，五个训练板可独立切换", () => {
  assert.deepEqual(Array.from(stages, stage => stage.id), ["input", "sound", "recall", "output", "transfer"]);
  assert.deepEqual(Array.from(skills, skill => skill.id), ["listen", "speak", "read", "write", "advanced"]);
  assert.ok(traps.length >= 6 && traps.length <= 8);
  assert.equal(new Set(traps.map(trap => trap.id)).size, traps.length);
});

test("盲测的线索和答案独立，所附资料可以解析为来源链接", () => {
  const items = [...traps];
  for (const card of [...stages, ...skills]) {
    assert.ok(card.cue && card.items.length, card.id);
    items.push(...card.items);
  }
  for (const {q, a, source} of items) {
    assert.ok(q.trim() && a.trim());
    assert.ok(!q.includes(a), q);
    if (source) {
      assert.ok(sources[source]?.title, source);
      assert.equal(new URL(sources[source].url).protocol, "https:");
    }
  }
});
