-- Create admin user for testing
INSERT OR REPLACE INTO User (
  id,
  email,
  password,
  username,
  name,
  role,
  referralCode,
  createdAt,
  updatedAt
) VALUES (
  'admin-user-id',
  'admin@ppcnews.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'admin',
  'Admin User',
  'ADMIN',
  'ADMIN123',
  datetime('now'),
  datetime('now')
);

-- Create wallet for admin
INSERT OR REPLACE INTO Wallet (
  id,
  userId,
  balance,
  earnings,
  investment,
  currency,
  createdAt,
  updatedAt
) VALUES (
  'admin-wallet-id',
  'admin-user-id',
  1000.00,
  0.00,
  0.00,
  'KES',
  datetime('now'),
  datetime('now')
);

-- Create user level for admin
INSERT OR REPLACE INTO UserLevel (
  id,
  userId,
  level,
  videosWatchedToday,
  lastWatchDate,
  createdAt,
  updatedAt
) VALUES (
  'admin-level-id',
  'admin-user-id',
  5,
  0,
  NULL,
  datetime('now'),
  datetime('now')
);