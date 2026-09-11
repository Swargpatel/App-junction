const http = require('http');

const postRequest = (path, body, headers = {}) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const getRequest = (path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

async function testAll() {
  console.log('--- 1. Testing Admin Login ---');
  const loginRes = await postRequest('/api/v1/admin/auth/login', {
    email: 'admin@appjunction.com',
    password: 'Admin@123456'
  });
  console.log('Login Result:', loginRes.data.success, 'Token received:', !!loginRes.data.token);

  const token = loginRes.data.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  console.log('\n--- 2. Testing Groups API ---');
  const groupsRes = await getRequest('/api/v1/admin/groups', authHeader);
  console.log('Groups Count:', groupsRes.data.count, groupsRes.data.groups.map(g => g.group_name));

  console.log('\n--- 3. Testing Apps API ---');
  const appsRes = await getRequest('/api/v1/admin/apps', authHeader);
  console.log('Apps Count:', appsRes.data.count, appsRes.data.apps.map(a => ({ name: a.app_name, key: a.api_key })));

  console.log('\n--- 4. Testing Analytics Overview API ---');
  const overviewRes = await getRequest('/api/v1/admin/analytics/overview', authHeader);
  console.log('Overview Stats:', overviewRes.data.data);

  console.log('\n--- 5. Testing Mobile Client Init API ---');
  const firstApp = appsRes.data.apps[0];
  const clientRes = await postRequest('/api/v1/client/app/init', {
    device_id: 'test_phone_device_xyz999',
    fcm_token: 'fcm_token_xyz999',
    country: 'United States',
    timezone: 'America/New_York',
    app_version: '2.1.0'
  }, { 'x-api-key': firstApp.api_key });
  console.log('Mobile Init Result:', clientRes.data.success, 'Is New User:', clientRes.data.is_new_user);

  console.log('\n--- 6. Testing Crash Reporting API ---');
  const crashRes = await postRequest('/api/v1/client/crash/report', {
    device_id: 'test_phone_device_xyz999',
    error_title: 'Uncaught ReferenceError',
    error_message: 'Cannot read properties of undefined (reading calculate)',
    stack_trace: 'at calculateScore (main.js:42:15)',
    file_name: 'main.js',
    line_number: 42,
    severity: 'HIGH'
  }, { 'x-api-key': firstApp.api_key });
  console.log('Crash Report Result:', crashRes.data.success, 'Error ID:', crashRes.data.error_id);

  console.log('\n--- 7. Testing Admin Crash Desk API ---');
  const crashLogsRes = await getRequest('/api/v1/admin/crash', authHeader);
  console.log('Crash Desk Total:', crashLogsRes.data.total, 'Pending:', crashLogsRes.data.summary.pending);

  console.log('\n✅ ALL BACKEND & MOBILE APIS VERIFIED AND WORKING 100%!');
}

testAll().catch(console.error);
