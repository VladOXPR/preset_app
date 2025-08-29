#!/usr/bin/env node

const bcrypt = require('bcryptjs');

// Test password verification
const storedHash = '$2b$10$48FYALR82GhcgkDqpf2wiuQYEmdXSxeeAXOqDEdK3raCvSY.zpEdG';

console.log('🔐 Testing password verification...');
console.log('📝 Stored hash:', storedHash);

// Test some common passwords
const testPasswords = [
  'test123',
  'password',
  '123456',
  'admin',
  'dePaul2024',
  'DePaul2024',
  'DePaul2025',
  'dePaul2025'
];

console.log('\n🧪 Testing passwords:');
testPasswords.forEach(password => {
  const isValid = bcrypt.compareSync(password, storedHash);
  console.log(`  ${password}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
});

// Generate a new hash for testing
console.log('\n🔄 Generating new hash for "test123":');
const newHash = bcrypt.hashSync('test123', 10);
console.log('  New hash:', newHash);

// Verify the new hash
const isNewValid = bcrypt.compareSync('test123', newHash);
console.log('  Verification:', isNewValid ? '✅ SUCCESS' : '❌ FAILED');

console.log('\n💡 If none of the test passwords work, you may need to reset the password.');
console.log('🔧 You can update the password in users.json or use the admin panel to reset it.');
