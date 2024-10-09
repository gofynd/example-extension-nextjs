// jest.config.js
module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    transform: {
        "^.+\\.(js|jsx)$": "babel-jest"
      },
    moduleFileExtensions: ['js', 'json'],
    moduleNameMapper: {
      '\\.(css|scss)$': 'identity-obj-proxy', // Mock CSS imports
      "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/src/tests/__mocks__/fileMock.js"
    },
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom:[
        "**/pages/**/*.{js,jsx}",
        "**/components/**/*.{js,jsx}",
        "**/server.js",
        '!**/public/**',
      ],  
  };
  