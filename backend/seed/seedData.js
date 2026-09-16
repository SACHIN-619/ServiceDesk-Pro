import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'node:dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config();

import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import SLAPolicy from '../models/SLAPolicy.js';
import Asset from '../models/Asset.js';
import KnowledgeArticle from '../models/KnowledgeArticle.js';
import AuditLog from '../models/AuditLog.js';
import Category from '../models/Category.js';
import Notification from '../models/Notification.js';

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/servicedesk_db';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    try {
      await mongoose.connect(mongoUri);
    } catch (connErr) {
      console.warn(`[Warning]: Connection to ${mongoUri} failed (${connErr.message}). Falling back to local MongoDB...`);
      await mongoose.connect('mongodb://127.0.0.1:27017/serviceDesk');
    }

    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await SLAPolicy.deleteMany({});
    await Asset.deleteMany({});
    await KnowledgeArticle.deleteMany({});
    await AuditLog.deleteMany({});
    await Category.deleteMany({});
    await Notification.deleteMany({});

    console.log('Seeding Users (5 Roles)...');
    const users = await User.create([
      {
        name: 'Sarah Connor (System Admin)',
        email: 'admin@servicedesk.com',
        password: 'admin123',
        role: 'ADMIN',
        department: 'Executive IT',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
      },
      {
        name: 'David Vance (IT Manager)',
        email: 'manager@servicedesk.com',
        password: 'manager123',
        role: 'IT_MANAGER',
        department: 'IT Operations',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'
      },
      {
        name: 'Arjun Sharma (Technician)',
        email: 'tech@servicedesk.com',
        password: 'tech123',
        role: 'TECHNICIAN',
        department: 'Infrastructure Support',
        skills: ['VPN', 'Networking', 'Windows Server', 'Hardware Repair'],
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      },
      {
        name: 'Rahul Patel (Employee)',
        email: 'employee@servicedesk.com',
        password: 'employee123',
        role: 'EMPLOYEE',
        department: 'Engineering',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      {
        name: 'Elena Rostova (Asset Manager)',
        email: 'assetmanager@servicedesk.com',
        password: 'asset123',
        role: 'ASSET_MANAGER',
        department: 'Procurement & IT Assets',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
      },
      {
        name: 'Michael Scott (Pending Approval)',
        email: 'pending.employee@servicedesk.com',
        password: 'employee123',
        role: 'EMPLOYEE',
        department: 'Sales & Regional',
        status: 'PENDING',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
      }
    ]);

    const admin = users[0];
    const manager = users[1];
    const tech = users[2];
    const employee = users[3];
    const assetMgr = users[4];

    console.log('Seeding SLA Policies...');
    await SLAPolicy.create([
      { priority: 'Critical', responseSLAHours: 0.25, resolutionSLAHours: 2, description: '15 Min Response / 2 Hour Resolution for Major Outages', escalationTarget: 'IT Director' },
      { priority: 'High', responseSLAHours: 0.5, resolutionSLAHours: 4, description: '30 Min Response / 4 Hour Resolution for High Impact', escalationTarget: 'IT Manager' },
      { priority: 'Medium', responseSLAHours: 2, resolutionSLAHours: 8, description: '2 Hour Response / 8 Hour Resolution for Standard Issues', escalationTarget: 'Lead Tech' },
      { priority: 'Low', responseSLAHours: 4, resolutionSLAHours: 24, description: '4 Hour Response / 24 Hour Resolution for Minor Requests', escalationTarget: 'Support Desk' }
    ]);

    console.log('Seeding Categories...');
    await Category.create([
      { name: 'Network & Connectivity', description: 'VPN, Wi-Fi, Router, Switch issues', defaultPriority: 'High' },
      { name: 'Hardware & Devices', description: 'Laptops, Desktops, Battery, Screens', defaultPriority: 'High' },
      { name: 'Access & Identity', description: 'Active Directory, Passwords, MFA, SSO', defaultPriority: 'Medium' },
      { name: 'Software & SaaS', description: 'Outlook, Slack, Jira, Office 365', defaultPriority: 'Medium' },
      { name: 'Peripherals', description: 'Printers, Scanners, Monitors, Keyboards', defaultPriority: 'Low' }
    ]);

    console.log('Seeding IT Assets...');
    const assets = await Asset.create([
      {
        assetTag: 'LAP-2045',
        name: 'Rahul Latitude Workstation',
        type: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 5440',
        serialNumber: 'DL-99887711',
        assignedTo: employee._id,
        department: 'Engineering',
        purchaseDate: new Date('2025-06-12'),
        warrantyExpiry: new Date('2028-06-12'),
        status: 'ASSIGNED',
        cost: 1450,
        specifications: 'Intel Core i7-1370P, 32GB DDR5 RAM, 1TB NVMe SSD, Windows 11 Pro'
      },
      {
        assetTag: 'LAP-2046',
        name: 'MacBook Pro 16 M3',
        type: 'Laptop',
        brand: 'Apple',
        model: 'MacBook Pro 16"',
        serialNumber: 'AP-33221199',
        assignedTo: tech._id,
        department: 'Infrastructure Support',
        purchaseDate: new Date('2025-01-10'),
        warrantyExpiry: new Date('2027-01-10'),
        status: 'ASSIGNED',
        cost: 2499,
        specifications: 'Apple M3 Pro, 36GB Unified Memory, 512GB SSD, macOS Sonoma'
      },
      {
        assetTag: 'DSK-1002',
        name: 'Finance Workstation Desktop',
        type: 'Desktop',
        brand: 'HP',
        model: 'EliteDesk 800 G9',
        serialNumber: 'HP-55443322',
        assignedTo: null,
        department: 'Finance',
        status: 'IN_STOCK',
        cost: 1100,
        specifications: 'Intel i5-13500, 16GB RAM, 512GB SSD'
      },
      {
        assetTag: 'SVR-9001',
        name: 'Primary Domain Controller Active Directory',
        type: 'Server',
        brand: 'Dell',
        model: 'PowerEdge R760',
        serialNumber: 'SVR-DELL-8899',
        department: 'IT',
        status: 'ASSIGNED',
        cost: 8500,
        specifications: 'Dual Xeon Gold 6430, 256GB ECC RAM, RAID 10 NVMe Storage'
      }
    ]);

    console.log('Seeding Knowledge Base Articles...');
    await KnowledgeArticle.create([
      {
        title: 'How to troubleshoot VPN connection & disconnect timeouts',
        category: 'Network & Connectivity',
        problem: 'Employee cannot establish VPN connection or gets disconnected after 5 minutes.',
        symptoms: 'Error: "TLS Handshake Failed" or "Session Timeout Exceeded". VPN disconnects randomly.',
        solution: '1. Open Cisco AnyConnect / Palo Alto GlobalProtect client.\n2. Go to Preferences -> Security and check "Allow untrusted servers" if on guest network.\n3. Run PowerShell as Admin: ipconfig /flushdns & netsh winsock reset.\n4. Restart the VPN service and clear saved credentials in Credential Manager.\n5. Re-authenticate using Duo MFA code.',
        tags: ['VPN', 'Network', 'Cisco', 'Timeout', 'GlobalProtect'],
        author: tech._id,
        views: 142,
        helpfulVotes: 38
      },
      {
        title: 'Wi-Fi 802.1X Corporate Certificate Reset',
        category: 'Network & Connectivity',
        problem: 'Laptop connects to Guest Wi-Fi but fails to authenticate with Corporate Wi-Fi.',
        symptoms: 'Prompting for domain credentials repeatedly or showing "Cannot connect to network".',
        solution: '1. Forget the "Corp-Secure-WiFi" network in Windows Wi-Fi Settings.\n2. Open Enterprise Portal app and select "Re-install Device Wi-Fi Certificate".\n3. Re-select Corp-Secure-WiFi and input domain credentials (DOMAIN\\username).\n4. Confirm identity certificate prompt.',
        tags: ['Wi-Fi', 'Certificate', 'Network', '802.1X'],
        author: tech._id,
        views: 89,
        helpfulVotes: 21
      },
      {
        title: 'Laptop Random Thermal Shutdowns & Thermal Throttling',
        category: 'Hardware & Devices',
        problem: 'Laptop fan spins rapidly and powers off suddenly during high CPU load.',
        symptoms: 'Bottom casing is hot to touch, Windows Event Log displays Kernel-Power ID 41.',
        solution: '1. Ensure laptop ventilation grilles are unblocked.\n2. Update Dell Command | Update BIOS driver to version 1.14.0+.\n3. Open Dell Power Manager and set Thermal Management profile to "Ultra Performance" or "Cool".\n4. If thermal paste degradation is suspected, submit laptop for internal heatsink dust cleaning.',
        tags: ['Hardware', 'Laptop', 'Overheating', 'Dell', 'Shutdown'],
        author: tech._id,
        views: 110,
        helpfulVotes: 29
      }
    ]);

    console.log('Seeding Tickets...');
    const now = Date.now();
    await Ticket.create([
      {
        ticketId: 'SD-1024',
        title: 'Laptop connected to Wi-Fi but cannot access office VPN tunnel',
        description: 'My laptop connects to office Wi-Fi without problem, but when I try launching the VPN client to access staging servers, it fails with connection timeout after 15 seconds.',
        requester: employee._id,
        department: 'Engineering',
        category: 'Network & Connectivity',
        priority: 'High',
        status: 'IN_PROGRESS',
        assignedTechnician: tech._id,
        asset: assets[0]._id,
        responseDeadline: new Date(now + 30 * 60 * 1000),
        resolutionDeadline: new Date(now + 3.5 * 60 * 60 * 1000),
        respondedAt: new Date(now - 10 * 60 * 1000),
        aiClassification: {
          category: 'Network & Connectivity',
          priority: 'High',
          probableIssue: 'VPN Client Authentication or Tunnel Timeout',
          confidence: 0.94,
          suggestedKeywords: ['VPN', 'Network', 'Wi-Fi']
        },
        comments: [
          {
            author: employee._id,
            text: 'I have attached my VPN log output. Pls check!',
            isInternal: false
          },
          {
            author: tech._id,
            text: 'Hi Rahul, I am reviewing your route table. It appears a local IP collision is blocking the gateway.',
            isInternal: false
          },
          {
            author: tech._id,
            text: 'Internal Note: Pushed new subnet profile via Active Directory GPO.',
            isInternal: true
          }
        ],
        workLogs: [
          {
            technician: tech._id,
            timeSpentMinutes: 30,
            notes: 'Inspected VPN gateway firewall logs and verified client certificate status.'
          }
        ]
      },
      {
        ticketId: 'SD-1025',
        title: 'Primary Domain Controller Active Directory High CPU & Auth Failure',
        description: 'Multiple users in London office report Active Directory password prompt failures and slow single sign-on authentication.',
        requester: manager._id,
        department: 'IT Operations',
        category: 'Access & Identity',
        priority: 'Critical',
        status: 'OPEN',
        assignedTechnician: null,
        asset: assets[3]._id,
        responseDeadline: new Date(now - 5 * 60 * 1000),
        resolutionDeadline: new Date(now + 1.5 * 60 * 60 * 1000),
        slaResponseBreached: true,
        aiClassification: {
          category: 'Access & Identity',
          priority: 'Critical',
          probableIssue: 'Active Directory Domain Controller CPU Overload',
          confidence: 0.97,
          suggestedKeywords: ['Active Directory', 'Domain Controller', 'Authentication']
        }
      },
      {
        ticketId: 'SD-1026',
        title: 'Printer spooler error on HP Laserjet Floor 3',
        description: 'Documents sent to Floor 3 network printer remain stuck in queued status.',
        requester: employee._id,
        department: 'Engineering',
        category: 'Peripherals',
        priority: 'Low',
        status: 'RESOLVED',
        assignedTechnician: tech._id,
        respondedAt: new Date(now - 2 * 3600 * 1000),
        resolvedAt: new Date(now - 1 * 3600 * 1000),
        resolutionNotes: 'Restarted Print Spooler service on print server and cleared corrupt driver cache.',
        responseDeadline: new Date(now + 4 * 3600 * 1000),
        resolutionDeadline: new Date(now + 24 * 3600 * 1000)
      }
    ]);

    console.log('Seeding Audit Logs...');
    await AuditLog.create([
      {
        actor: employee._id,
        actorName: employee.name,
        actorRole: employee.role,
        action: 'TICKET_CREATED',
        target: 'Ticket #SD-1024',
        details: 'Created ticket "Laptop connected to Wi-Fi but cannot access office VPN tunnel"'
      },
      {
        actor: manager._id,
        actorName: manager.name,
        actorRole: manager.role,
        action: 'TECHNICIAN_ASSIGNED',
        target: 'Ticket #SD-1024',
        details: 'Assigned ticket to Arjun Sharma (Technician)'
      },
      {
        actorName: 'SLA Monitoring Engine',
        actorRole: 'SYSTEM',
        action: 'SLA_RESPONSE_BREACHED',
        target: 'Ticket #SD-1025',
        details: 'Ticket #SD-1025 (Critical priority) failed 15 min response SLA deadline.'
      }
    ]);

    console.log('\n======================================================');
    console.log('SUCCESS! ServiceDesk Pro database seeded cleanly!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
