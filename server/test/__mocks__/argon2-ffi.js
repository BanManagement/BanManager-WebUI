// Required due to https://github.com/facebook/jest/issues/3552#issuecomment-517686728
const hash = async function hash(buf, salt) {
  return Promise.resolve(buf);
};
module.exports = {
  argon2i: {
    verify: async (hashed, buf) => {
      return Promise.resolve(hashed === buf.toString());
    },
    hash,
  },
};
