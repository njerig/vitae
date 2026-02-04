// __tests__/simple.test.js
// Your first test file!

describe('My First Tests', () => {
  
  // Test 1: Super simple math test
  test('simple math test', () => {
    expect(1 + 1).toBe(2)
  })
  
  // Test 2: Check if strings match
  test('string test', () => {
    const greeting = 'Hello Vitae'
    expect(greeting).toBe('Hello Vitae')
  })
  
  // Test 3: Check if something exists
  test('check if value exists', () => {
    const user = { name: 'Test User' }
    expect(user.name).toBeDefined()
  })
})
