export default {
  assert(condition) {
    console.assert(condition);
  },
  assertInstanceof(object, type) {
    console.assert(object instanceof type);
  },
  fail() {
    console.fail();
  },
  assertNumber(number) {
    console.assert(typeof number === 'number');
  }
};
