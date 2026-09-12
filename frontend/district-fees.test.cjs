const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {window: {}, URLSearchParams};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'district-fees.js'), 'utf8'), context);
const load = context.window.BiumDistrictFees.load;
const row = (id, amount, size = '') => ({id, province:'서울특별시',district:'강서구',item_name:'의자',amount_krw:amount,size_label:size,reference_date:'2026-01-01'});
test('all pages retain dataset and missing price is not zero', async () => {
  const calls=[];
  const result=await load(async url=>{ calls.push(url); return {dataset:{id:2},total:2,items:[calls.length===1?row(1,null):row(2,3000,'일반')]}; },'강서구');
  assert.equal(calls.length,2); assert.match(calls[1],/import_id=2/); assert.match(calls[1],/offset=1/);
  assert.equal(result.total,2); assert.equal(result.lowest,3000); assert.equal(result.specCount,1);
});
test('empty dataset is a valid empty result',async()=>{
  const result=await load(async()=>({dataset:{id:2},total:0,items:[]}),'송파구');
  assert.equal(result.total,0); assert.equal(result.lowest,null);
});
test('partial pages and network failures are errors',async()=>{
  await assert.rejects(load(async()=>({dataset:{id:2},total:2,items:[]}),'강서구'));
  await assert.rejects(load(async()=>{throw new Error('network');},'강서구'));
});
test('wrong district or repeated rows are rejected',async()=>{
  await assert.rejects(load(async()=>({dataset:{id:2},total:1,items:[row(1,0)]}),'성북구'));
  await assert.rejects(load(async()=>({dataset:{id:2},total:2,items:[row(1,0)]}),'강서구'));
});
