import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

const request = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

async function runE2ETests() {
  console.log('===========================================================');
  console.log('🚀 RUNNING SERVICEDESK PRO COMPREHENSIVE E2E & SECURITY TESTS');
  console.log('===========================================================\n');

  let adminToken, managerToken, techToken, employeeToken, assetMgrToken;
  let createdUserId, createdTicketId, createdAssetId, createdKbId;

  // 1. LOGIN DEFAULT SEED USERS
  console.log('▶ [TEST 1]: Authenticating Seed Personas...');
  const adminLogin = await request('/auth/login', 'POST', { email: 'admin@servicedesk.com', password: 'admin123' });
  assert.strictEqual(adminLogin.status, 200, 'Admin login failed');
  adminToken = adminLogin.data.token;
  console.log('  ✔ Admin authenticated (JWT acquired)');

  const mgrLogin = await request('/auth/login', 'POST', { email: 'manager@servicedesk.com', password: 'manager123' });
  assert.strictEqual(mgrLogin.status, 200, 'Manager login failed');
  managerToken = mgrLogin.data.token;
  console.log('  ✔ IT Manager authenticated (JWT acquired)');

  const techLogin = await request('/auth/login', 'POST', { email: 'tech@servicedesk.com', password: 'tech123' });
  assert.strictEqual(techLogin.status, 200, 'Tech login failed');
  techToken = techLogin.data.token;
  console.log('  ✔ Technician authenticated (JWT acquired)');

  const empLogin = await request('/auth/login', 'POST', { email: 'employee@servicedesk.com', password: 'employee123' });
  assert.strictEqual(empLogin.status, 200, 'Employee login failed');
  employeeToken = empLogin.data.token;
  console.log('  ✔ Employee authenticated (JWT acquired)');

  const assetMgrLogin = await request('/auth/login', 'POST', { email: 'assetmanager@servicedesk.com', password: 'asset123' });
  assert.strictEqual(assetMgrLogin.status, 200, 'Asset Manager login failed');
  assetMgrToken = assetMgrLogin.data.token;
  console.log('  ✔ Asset Manager authenticated (JWT acquired)');

  // 2. GET /api/auth/me VERIFICATION
  console.log('\n▶ [TEST 2]: Verifying GET /api/auth/me Database Record...');
  const meRes = await request('/auth/me', 'GET', null, employeeToken);
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.data.role, 'EMPLOYEE');
  assert.strictEqual(meRes.data.email, 'employee@servicedesk.com');
  console.log('  ✔ /auth/me returns authentic user document');

  // 3. REGISTRATION WORKFLOW & STATUS GATING
  console.log('\n▶ [TEST 3]: Public Registration & Admin Approval Flow...');
  const uniqueEmail = `test.emp.${Date.now()}@servicedesk.com`;
  const regRes = await request('/auth/register', 'POST', {
    name: 'Test Newhire Employee',
    email: uniqueEmail,
    password: 'password123',
    department: 'Marketing',
    role: 'ADMIN' // Trying to self-promote (must be forced to EMPLOYEE)
  });
  assert.strictEqual(regRes.status, 201, 'Registration failed');
  assert.strictEqual(regRes.data.user.role, 'EMPLOYEE', 'Self-promotion was not blocked!');
  assert.strictEqual(regRes.data.user.status, 'PENDING', 'New registration was not set to PENDING!');
  createdUserId = regRes.data.user._id;
  console.log('  ✔ Self-registration forced to role=EMPLOYEE, status=PENDING');

  // Attempt login before approval (must fail 403)
  const pendingLogin = await request('/auth/login', 'POST', { email: uniqueEmail, password: 'password123' });
  assert.strictEqual(pendingLogin.status, 403, 'Pending user was able to log in!');
  console.log('  ✔ Pending account login correctly rejected with 403');

  // Admin approves account
  const approveRes = await request(`/users/${createdUserId}/approve`, 'PUT', {}, adminToken);
  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveRes.data.user.status, 'ACTIVE');
  console.log('  ✔ Administrator approved account (status -> ACTIVE)');

  // Now login succeeds
  const approvedLogin = await request('/auth/login', 'POST', { email: uniqueEmail, password: 'password123' });
  assert.strictEqual(approvedLogin.status, 200, 'Approved user login failed');
  assert.ok(approvedLogin.data.token, 'Token missing');
  const newEmpToken = approvedLogin.data.token;
  console.log('  ✔ Approved employee successfully authenticated');

  // 4. SECURITY NEGATIVE TESTING
  console.log('\n▶ [TEST 4]: Security & RBAC Negative Testing...');
  
  // A. Unauthenticated access
  const unauthTickets = await request('/tickets', 'GET', null, null);
  assert.strictEqual(unauthTickets.status, 401, 'Unauthenticated access was allowed!');
  console.log('  ✔ Unauthenticated access blocked (401)');

  // B. Employee attempting admin operations
  const empPendingUsers = await request('/users/pending', 'GET', null, employeeToken);
  assert.strictEqual(empPendingUsers.status, 403, 'Employee could access pending users!');
  console.log('  ✔ Employee blocked from viewing pending registrations (403)');

  const empAudit = await request('/audit', 'GET', null, employeeToken);
  assert.strictEqual(empAudit.status, 403, 'Employee could access audit logs!');
  console.log('  ✔ Employee blocked from audit logs (403)');

  const empSlaUpdate = await request('/sla/policies/123456789012345678901234', 'PUT', { responseSLAHours: 1 }, employeeToken);
  assert.strictEqual(empSlaUpdate.status, 403, 'Employee could modify SLA policy!');
  console.log('  ✔ Employee blocked from SLA policy configuration (403)');

  // C. Technician attempting user provisioning
  const techCreateUser = await request('/users', 'POST', { name: 'Fake', email: 'fake@test.com', password: '123' }, techToken);
  assert.strictEqual(techCreateUser.status, 403, 'Technician could provision users!');
  console.log('  ✔ Technician blocked from provisioning users (403)');

  // D. Asset Manager attempting user approval
  const assetApprove = await request(`/users/${createdUserId}/approve`, 'PUT', {}, assetMgrToken);
  assert.strictEqual(assetApprove.status, 403, 'Asset Manager could approve users!');
  console.log('  ✔ Asset Manager blocked from approving users (403)');

  // 5. AI CLASSIFICATION & RAG ENDPOINTS
  console.log('\n▶ [TEST 5]: AI Classification & Grounded RAG Recommendations...');
  const aiClassifyRes = await request('/ai/classify', 'POST', {
    title: 'VPN connection dropping repeatedly on laptop',
    description: 'When I start Cisco AnyConnect on office Wi-Fi, it fails with TLS handshake timeout.'
  }, employeeToken);
  assert.strictEqual(aiClassifyRes.status, 200);
  assert.strictEqual(aiClassifyRes.data.category, 'Network & Connectivity');
  assert.ok(aiClassifyRes.data.confidence > 0.7);
  console.log(`  ✔ AI Classification: Category="${aiClassifyRes.data.category}", Priority="${aiClassifyRes.data.priority}", Provider="${aiClassifyRes.data.provider}"`);

  const aiRagRes = await request('/ai/recommend', 'POST', {
    title: 'Wi-Fi 802.1X certificate issue on corporate laptop',
    description: 'Cannot authenticate with Corporate Wi-Fi network certificate'
  }, employeeToken);
  assert.strictEqual(aiRagRes.status, 200);
  assert.ok(Array.isArray(aiRagRes.data.articles));
  assert.ok(aiRagRes.data.articles.length > 0, 'No KB articles retrieved for Wi-Fi query');
  console.log(`  ✔ Grounded RAG: Retrieved ${aiRagRes.data.articles.length} KB articles ("${aiRagRes.data.articles[0].title}")`);

  // Test RAG with no matching article
  const emptyRagRes = await request('/ai/recommend', 'POST', {
    title: 'Quantum flux capacitor calibration error 998877',
    description: 'Completely unknown fictional hardware malfunction with no KB match'
  }, employeeToken);
  assert.strictEqual(emptyRagRes.status, 200);
  assert.strictEqual(emptyRagRes.data.articles.length, 0);
  console.log('  ✔ Grounded RAG with no match returns empty articles list honestly without hallucination');

  // 6. COMPLETE TICKET LIFECYCLE & SLA ENGINE
  console.log('\n▶ [TEST 6]: Complete Multi-Role Ticket Lifecycle Flow...');
  
  // A. Employee creates ticket
  const ticketCreateRes = await request('/tickets', 'POST', {
    title: 'TEST E2E - Office Wi-Fi and VPN disconnect issue',
    description: 'My laptop connects to Wi-Fi but drops VPN connection every 5 minutes.',
    category: 'Network & Connectivity',
    priority: 'High'
  }, employeeToken);
  assert.strictEqual(ticketCreateRes.status, 201, 'Ticket creation failed');
  createdTicketId = ticketCreateRes.data._id;
  const createdTicketNum = ticketCreateRes.data.ticketId;
  assert.strictEqual(ticketCreateRes.data.status, 'OPEN');
  assert.ok(ticketCreateRes.data.responseDeadline, 'responseDeadline missing');
  assert.ok(ticketCreateRes.data.resolutionDeadline, 'resolutionDeadline missing');
  console.log(`  ✔ Ticket #${createdTicketNum} created (Status: OPEN, Resp SLA: ${new Date(ticketCreateRes.data.responseDeadline).toLocaleTimeString()})`);

  // B. IT Manager views and assigns ticket to Technician
  const techList = await request('/users/technicians', 'GET', null, managerToken);
  assert.strictEqual(techList.status, 200);
  const techUser = techList.data[0];

  const assignRes = await request(`/tickets/${createdTicketId}/assign`, 'PATCH', {
    technicianId: techUser._id
  }, managerToken);
  assert.strictEqual(assignRes.status, 200);
  assert.strictEqual(assignRes.data.status, 'ASSIGNED');
  assert.strictEqual(assignRes.data.assignedTechnician._id.toString(), techUser._id.toString());
  console.log(`  ✔ IT Manager assigned ticket #${createdTicketNum} to ${techUser.name} (Status: ASSIGNED)`);

  // C. Technician views assigned ticket, logs work, and moves to IN_PROGRESS
  const techTickets = await request('/tickets?myAssigned=true', 'GET', null, techToken);
  assert.strictEqual(techTickets.status, 200);
  const foundTicket = techTickets.data.find(t => t._id === createdTicketId);
  assert.ok(foundTicket, 'Assigned ticket did not appear in technician queue');

  const startWorkRes = await request(`/tickets/${createdTicketId}/status`, 'PATCH', {
    status: 'IN_PROGRESS'
  }, techToken);
  assert.strictEqual(startWorkRes.status, 200);
  assert.strictEqual(startWorkRes.data.status, 'IN_PROGRESS');
  console.log(`  ✔ Technician started work on ticket #${createdTicketNum} (Status: IN_PROGRESS)`);

  const workLogRes = await request(`/tickets/${createdTicketId}/worklog`, 'POST', {
    timeSpentMinutes: 30,
    notes: 'Flushed client DNS cache, verified gateway firewall rules, and reset 802.1X certificate.'
  }, techToken);
  assert.strictEqual(workLogRes.status, 200);
  assert.strictEqual(workLogRes.data.workLogs.length, 1);
  console.log('  ✔ Technician logged 30 minutes of troubleshooting work');

  // Technician resolves ticket
  const resolveRes = await request(`/tickets/${createdTicketId}/status`, 'PATCH', {
    status: 'RESOLVED',
    note: 'Resolved by refreshing Active Directory network adapter certificate.'
  }, techToken);
  assert.strictEqual(resolveRes.status, 200);
  assert.strictEqual(resolveRes.data.status, 'RESOLVED');
  console.log(`  ✔ Technician resolved ticket #${createdTicketNum} (Status: RESOLVED)`);

  // D. Employee reviews, reopens ticket, then technician resolves and employee closes
  const reopenRes = await request(`/tickets/${createdTicketId}/status`, 'PATCH', {
    status: 'REOPENED',
    note: 'Issue re-occurred once after rebooting laptop.'
  }, employeeToken);
  assert.strictEqual(reopenRes.status, 200);
  assert.strictEqual(reopenRes.data.status, 'REOPENED');
  console.log(`  ✔ Employee reopened ticket #${createdTicketNum} (Status: REOPENED)`);

  // Tech resolves again
  await request(`/tickets/${createdTicketId}/status`, 'PATCH', {
    status: 'RESOLVED',
    note: 'Permanently resolved by applying Windows update patch.'
  }, techToken);

  // Employee closes ticket
  const closeRes = await request(`/tickets/${createdTicketId}/status`, 'PATCH', {
    status: 'CLOSED',
    note: 'Confirmed working perfectly now.'
  }, employeeToken);
  assert.strictEqual(closeRes.status, 200);
  assert.strictEqual(closeRes.data.status, 'CLOSED');
  console.log(`  ✔ Employee confirmed resolution and closed ticket #${createdTicketNum} (Status: CLOSED)`);

  // 7. NOTIFICATIONS SYSTEM
  console.log('\n▶ [TEST 7]: Persistent Notifications & Real-Time Events...');
  const notifRes = await request('/notifications', 'GET', null, techToken);
  assert.strictEqual(notifRes.status, 200);
  assert.ok(Array.isArray(notifRes.data.notifications));
  assert.ok(notifRes.data.notifications.length > 0, 'Technician has no persistent notifications in DB');
  console.log(`  ✔ Technician has ${notifRes.data.notifications.length} persistent notifications in MongoDB (Unread: ${notifRes.data.unreadCount})`);

  // Mark first notification as read
  const firstNotifId = notifRes.data.notifications[0]._id;
  const readRes = await request(`/notifications/${firstNotifId}/read`, 'PUT', {}, techToken);
  assert.strictEqual(readRes.status, 200);
  assert.strictEqual(readRes.data.read, true);
  console.log('  ✔ Notification marked as read');

  // 8. ASSET MANAGEMENT WORKFLOW
  console.log('\n▶ [TEST 8]: IT Asset Management & Incident Linking...');
  const newAssetRes = await request('/assets', 'POST', {
    name: 'Executive ThinkPad X1 Carbon',
    type: 'Laptop',
    brand: 'Lenovo',
    model: 'ThinkPad X1 Gen 11',
    serialNumber: `LN-SN-${Date.now()}`,
    cost: 1850,
    specifications: 'Core i7-1365U, 32GB LPDDR5, 1TB SSD',
    assignedTo: empLogin.data._id
  }, assetMgrToken);
  assert.strictEqual(newAssetRes.status, 201);
  createdAssetId = newAssetRes.data._id;
  assert.strictEqual(newAssetRes.data.status, 'ASSIGNED');
  console.log(`  ✔ Asset created: ${newAssetRes.data.assetTag} ("${newAssetRes.data.name}", Assigned to Employee)`);

  // Log maintenance
  const maintRes = await request(`/assets/${createdAssetId}/maintenance`, 'POST', {
    description: 'Replaced battery and upgraded BIOS firmware to v1.22',
    cost: 120,
    technician: 'Arjun Sharma'
  }, assetMgrToken);
  assert.strictEqual(maintRes.status, 200);
  assert.strictEqual(maintRes.data.status, 'UNDER_REPAIR');
  assert.strictEqual(maintRes.data.maintenanceHistory.length, 1);
  console.log('  ✔ Logged maintenance record on asset (Status -> UNDER_REPAIR)');

  // 9. AUDIT TRAIL VERIFICATION
  console.log('\n▶ [TEST 9]: System Audit Trail Verification...');
  const auditRes = await request('/audit', 'GET', null, adminToken);
  assert.strictEqual(auditRes.status, 200);
  assert.ok(Array.isArray(auditRes.data));
  assert.ok(auditRes.data.length >= 5, 'Audit trail should have multiple captured events');
  console.log(`  ✔ Audit Trail has ${auditRes.data.length} immutable records capturing system actions`);

  // 10. DYNAMIC ANALYTICS
  console.log('\n▶ [TEST 10]: Dynamic ITSM Analytics & Dashboard Aggregation...');
  const analyticsRes = await request('/analytics/dashboard', 'GET', null, adminToken);
  assert.strictEqual(analyticsRes.status, 200);
  assert.ok(analyticsRes.data.summary.totalTickets > 0);
  assert.ok(Array.isArray(analyticsRes.data.monthlyTrends));
  assert.strictEqual(analyticsRes.data.monthlyTrends.length, 6, 'Monthly trends should cover last 6 months');
  console.log(`  ✔ Dynamic Analytics: Total Tickets=${analyticsRes.data.summary.totalTickets}, Open=${analyticsRes.data.summary.openTickets}, Resolved=${analyticsRes.data.summary.resolvedTickets}`);

  console.log('\n===========================================================');
  console.log('🎉 ALL COMPREHENSIVE E2E & SECURITY INTEGRATION TESTS PASSED!');
  console.log('===========================================================\n');
}

runE2ETests().catch(err => {
  console.error('\n❌ TEST FAILED WITH ERROR:', err);
  process.exit(1);
});
