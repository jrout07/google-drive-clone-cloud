export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  aws: {
    region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
    userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-west-2_GyEF1dW0E',
    clientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '75jjtldus9ru2pqjq8mt6jqgc3',
  },
};
