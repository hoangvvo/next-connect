const nc = require("next-connect");
const assert = require("assert");

assert.equal(typeof nc(), "function");

console.log("passed cjs test");