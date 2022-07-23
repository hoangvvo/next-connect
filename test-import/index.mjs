import assert from "assert";
import nc from "next-connect";

assert.equal(typeof nc(), "function");

console.log("passed mjs test");