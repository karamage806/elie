const bcrypt = require('bcryptjs');

const hashPassword = async (plain) => {
  return bcrypt.hash(plain, 12);
};

const comparePassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};

module.exports = { hashPassword, comparePassword };
