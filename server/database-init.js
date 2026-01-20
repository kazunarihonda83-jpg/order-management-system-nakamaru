import Database from 'better-sqlite3';
import { tmpdir } from 'os';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import { existsSync } from 'fs';

export function initDatabase() {
  // Vercel環境では/tmpディレクトリを使用
  const dbPath = process.env.VERCEL 
    ? join(tmpdir(), 'order_management.db')
    : join(process.cwd(), 'order_management.db');
  
  console.log('Initializing database at:', dbPath);
  
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Create administrators table
  db.exec(`
    CREATE TABLE IF NOT EXISTS administrators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      permissions TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if admin user exists
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM administrators WHERE username = ?').get('鉄板焼き居酒屋なかまる');
  
  if (adminExists.count === 0) {
    console.log('Creating default admin user...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO administrators (username, password, email, permissions) VALUES (?, ?, ?, ?)').run(
      '鉄板焼き居酒屋なかまる',
      hashedPassword,
      'info@nakamaru.com',
      'all'
    );
    console.log('Default admin user created successfully');
  }

  // Create other tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_type TEXT NOT NULL,
      name TEXT NOT NULL,
      postal_code TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      payment_terms INTEGER DEFAULT 30,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      department TEXT,
      position TEXT,
      email TEXT,
      phone TEXT,
      postal_code TEXT,
      address TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_number TEXT UNIQUE NOT NULL,
      document_type TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE,
      payment_date DATE,
      status TEXT DEFAULT 'draft',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (created_by) REFERENCES administrators (id)
    );

    CREATE TABLE IF NOT EXISTS document_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      description TEXT,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 10.0,
      amount REAL NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_type TEXT NOT NULL,
      name TEXT NOT NULL,
      postal_code TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      payment_terms INTEGER DEFAULT 30,
      bank_name TEXT,
      branch_name TEXT,
      account_type TEXT,
      account_number TEXT,
      account_holder TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supplier_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      department TEXT,
      position TEXT,
      email TEXT,
      phone TEXT,
      postal_code TEXT,
      address TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      supplier_id INTEGER NOT NULL,
      order_date DATE NOT NULL,
      expected_delivery_date DATE,
      actual_delivery_date DATE,
      status TEXT DEFAULT 'ordered',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
      FOREIGN KEY (created_by) REFERENCES administrators (id)
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      description TEXT,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 10.0,
      amount REAL NOT NULL,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_code TEXT UNIQUE NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      parent_account_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_account_id) REFERENCES accounts (id)
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date DATE NOT NULL,
      entry_number TEXT UNIQUE NOT NULL,
      description TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES administrators (id)
    );

    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal_entry_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      debit_amount REAL DEFAULT 0,
      credit_amount REAL DEFAULT 0,
      description TEXT,
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries (id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts (id)
    );

    CREATE TABLE IF NOT EXISTS operation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id INTEGER,
      operation_detail TEXT,
      operated_by INTEGER,
      operated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operated_by) REFERENCES administrators (id)
    );

    -- 在庫管理テーブル
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category TEXT,
      supplier_id INTEGER,
      unit TEXT DEFAULT '個',
      current_stock REAL DEFAULT 0,
      reorder_point REAL DEFAULT 0,
      optimal_stock REAL DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      expiry_date DATE,
      storage_location TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    );

    -- 在庫移動履歴テーブル
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL,
      reference_type TEXT,
      reference_id INTEGER,
      notes TEXT,
      performed_by INTEGER,
      performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES administrators (id)
    );

    -- 在庫アラートテーブル
    CREATE TABLE IF NOT EXISTS stock_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      alert_level TEXT DEFAULT 'warning',
      message TEXT NOT NULL,
      is_resolved INTEGER DEFAULT 0,
      resolved_at DATETIME,
      resolved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES administrators (id)
    );
  `);

  // Create default accounts if they don't exist
  const accountsCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
  if (accountsCount.count === 0) {
    console.log('Creating default accounts...');
    const defaultAccounts = [
      ['1000', '現金', 'asset'],
      ['1100', '売掛金', 'asset'],
      ['2000', '買掛金', 'liability'],
      ['3000', '資本金', 'equity'],
      ['4000', '売上高', 'revenue'],
      ['5000', '仕入高', 'expense'],
      ['6000', '給料', 'expense'],
      ['7000', '地代家賃', 'expense']
    ];

    const stmt = db.prepare('INSERT INTO accounts (account_code, account_name, account_type) VALUES (?, ?, ?)');
    for (const [code, name, type] of defaultAccounts) {
      stmt.run(code, name, type);
    }
    console.log('Default accounts created successfully');
  }

  // Create default suppliers if they don't exist
  const suppliersCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  if (suppliersCount.count === 0) {
    console.log('Creating default suppliers...');
    const defaultSuppliers = [
      {
        supplier_type: '精肉',
        name: '相模原精肉センター',
        postal_code: '252-0239',
        address: '神奈川県相模原市中央区中央2-11-15',
        phone: '042-755-1234',
        email: 'info@sagamihara-meat.co.jp',
        payment_terms: 30,
        bank_name: 'みずほ銀行',
        branch_name: '相模原支店',
        account_type: '普通',
        account_number: '1234567',
        account_holder: 'カ）サガミハラセイニクセンター',
        notes: '毎朝8時配送'
      },
      {
        supplier_type: '鮮魚・シーフード',
        name: '神奈川鮮魚市場',
        postal_code: '252-0231',
        address: '神奈川県相模原市中央区相模原3-4-10',
        phone: '042-758-2345',
        email: 'sales@kanagawa-fish.co.jp',
        payment_terms: 30,
        bank_name: '横浜銀行',
        branch_name: '相模原支店',
        account_type: '普通',
        account_number: '2345678',
        account_holder: 'カ）カナガワセンギョイチバ',
        notes: '毎朝7時配送、鮮度抜群'
      },
      {
        supplier_type: '青果',
        name: '横山台青果',
        postal_code: '252-0242',
        address: '神奈川県相模原市中央区横山台1-2-3',
        phone: '042-704-3456',
        email: 'info@yokoyamadai-seika.co.jp',
        payment_terms: 30,
        bank_name: 'きらぼし銀行',
        branch_name: '相模原中央支店',
        account_type: '普通',
        account_number: '3456789',
        account_holder: 'カ）ヨコヤマダイセイカ',
        notes: '地元野菜中心、毎朝8時配送'
      },
      {
        supplier_type: '酒類',
        name: '相模原酒類販売',
        postal_code: '252-0236',
        address: '神奈川県相模原市中央区富士見1-5-8',
        phone: '042-752-4567',
        email: 'sales@sagamihara-sake.co.jp',
        payment_terms: 30,
        bank_name: '三井住友銀行',
        branch_name: '相模大野支店',
        account_type: '普通',
        account_number: '4567890',
        account_holder: 'カ）サガミハラシュルイハンバイ',
        notes: '翌日配送、ビール・日本酒・焼酎'
      }
    ];

    const supplierStmt = db.prepare(`
      INSERT INTO suppliers (
        supplier_type, name, postal_code, address, phone, email, payment_terms,
        bank_name, branch_name, account_type, account_number, account_holder, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const supplier of defaultSuppliers) {
      supplierStmt.run(
        supplier.supplier_type,
        supplier.name,
        supplier.postal_code,
        supplier.address,
        supplier.phone,
        supplier.email,
        supplier.payment_terms,
        supplier.bank_name,
        supplier.branch_name,
        supplier.account_type,
        supplier.account_number,
        supplier.account_holder,
        supplier.notes
      );
    }
    console.log('Default suppliers created successfully');
  }

  // Create default purchase orders if they don't exist
  const purchaseOrdersCount = db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get();
  if (purchaseOrdersCount.count === 0) {
    console.log('Creating default purchase orders...');
    
    // Get supplier IDs
    const meat = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('相模原精肉センター');
    const fish = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('神奈川鮮魚市場');
    const yasai = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('横山台青果');
    const sake = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('相模原酒類販売');
    
    // Get admin user ID
    const admin = db.prepare('SELECT id FROM administrators WHERE username = ?').get('鉄板焼き居酒屋なかまる');
    
    if (fish && sake && yasai && meat && admin) {
      const defaultOrders = [
        {
          order_number: 'PO-2025-001',
          supplier_id: fish.id,
          order_date: '2025-01-15',
          expected_delivery_date: '2025-01-16',
          status: 'delivered',
          created_by: admin.id,
          items: [
            { item_name: '本マグロ（刺身用）', description: '1kg', quantity: 2, unit_price: 8500, tax_rate: 10.0 },
            { item_name: 'サーモン刺身', description: '500g×4', quantity: 4, unit_price: 2800, tax_rate: 10.0 },
            { item_name: 'ホタテ貝柱', description: '500g', quantity: 3, unit_price: 3200, tax_rate: 10.0 },
            { item_name: 'イカ（刺身用）', description: '1kg', quantity: 2, unit_price: 1800, tax_rate: 10.0 }
          ]
        },
        {
          order_number: 'PO-2025-002',
          supplier_id: sake.id,
          order_date: '2025-01-15',
          expected_delivery_date: '2025-01-17',
          status: 'delivered',
          created_by: admin.id,
          items: [
            { item_name: '獺祭 純米大吟醸', description: '720ml×6本', quantity: 6, unit_price: 3500, tax_rate: 10.0 },
            { item_name: '八海山 純米吟醸', description: '1.8L×3本', quantity: 3, unit_price: 4200, tax_rate: 10.0 },
            { item_name: 'サッポロクラシック', description: '瓶ビール 500ml×24本', quantity: 1, unit_price: 9600, tax_rate: 10.0 },
            { item_name: '芋焼酎 魔王', description: '1.8L×2本', quantity: 2, unit_price: 5800, tax_rate: 10.0 }
          ]
        },
        {
          order_number: 'PO-2025-003',
          supplier_id: yasai.id,
          order_date: '2025-01-16',
          expected_delivery_date: '2025-01-17',
          status: 'ordered',
          created_by: admin.id,
          items: [
            { item_name: '北海道産じゃがいも', description: '10kg', quantity: 2, unit_price: 1800, tax_rate: 10.0 },
            { item_name: '玉ねぎ', description: '10kg', quantity: 2, unit_price: 1200, tax_rate: 10.0 },
            { item_name: 'アスパラガス', description: '1kg', quantity: 3, unit_price: 2500, tax_rate: 10.0 },
            { item_name: '大根', description: '1本×10', quantity: 10, unit_price: 180, tax_rate: 10.0 }
          ]
        },
        {
          order_number: 'PO-2025-004',
          supplier_id: meat.id,
          order_date: '2025-01-17',
          expected_delivery_date: '2025-01-18',
          status: 'ordered',
          created_by: admin.id,
          items: [
            { item_name: 'ラム肉（ジンギスカン用）', description: '1kg×5', quantity: 5, unit_price: 2800, tax_rate: 10.0 },
            { item_name: '豚バラ肉', description: '2kg', quantity: 3, unit_price: 1600, tax_rate: 10.0 },
            { item_name: '鶏もも肉', description: '2kg×2', quantity: 2, unit_price: 1400, tax_rate: 10.0 },
            { item_name: '牛タン（焼肉用）', description: '500g×2', quantity: 2, unit_price: 4500, tax_rate: 10.0 }
          ]
        },
        {
          order_number: 'PO-2025-005',
          supplier_id: fish.id,
          order_date: '2025-01-18',
          expected_delivery_date: '2025-01-19',
          status: 'ordered',
          created_by: admin.id,
          items: [
            { item_name: '活ホッケ', description: '1尾×5', quantity: 5, unit_price: 800, tax_rate: 10.0 },
            { item_name: 'カニ（ズワイガニ）', description: '500g×3', quantity: 3, unit_price: 4200, tax_rate: 10.0 },
            { item_name: 'ウニ', description: '100g×5', quantity: 5, unit_price: 2800, tax_rate: 10.0 }
          ]
        }
      ];

      for (const order of defaultOrders) {
        // Calculate totals
        let subtotal = 0;
        for (const item of order.items) {
          subtotal += item.quantity * item.unit_price;
        }
        const tax_amount = Math.round(subtotal * 0.1);
        const total_amount = subtotal + tax_amount;

        // Insert purchase order
        const result = db.prepare(`
          INSERT INTO purchase_orders (
            order_number, supplier_id, order_date, expected_delivery_date, 
            status, subtotal, tax_amount, total_amount, created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          order.order_number,
          order.supplier_id,
          order.order_date,
          order.expected_delivery_date,
          order.status,
          subtotal,
          tax_amount,
          total_amount,
          order.created_by
        );

        // Insert order items
        const itemStmt = db.prepare(`
          INSERT INTO purchase_order_items (
            purchase_order_id, item_name, description, quantity, unit_price, tax_rate, amount
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of order.items) {
          const amount = item.quantity * item.unit_price;
          itemStmt.run(
            result.lastInsertRowid,
            item.item_name,
            item.description,
            item.quantity,
            item.unit_price,
            item.tax_rate,
            amount
          );
        }
      }
      
      console.log('Default purchase orders created successfully');
    }
  }

  // Create default inventory if it doesn't exist
  const inventoryCount = db.prepare('SELECT COUNT(*) as count FROM inventory').get();
  if (inventoryCount.count === 0) {
    console.log('Creating default inventory...');
    
    const meat = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('相模原精肉センター');
    const fish = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('神奈川鮮魚市場');
    const vegetables = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('横山台青果');
    const sake = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('相模原酒類販売');

    const defaultInventory = [
      // 牛肉
      { item_name: 'サーロインステーキ', category: '牛肉', supplier_id: meat.id, unit: 'kg', current_stock: 4, reorder_point: 2, optimal_stock: 8, unit_cost: 5800, expiry_date: '2025-01-27', storage_location: '冷蔵庫A' },
      { item_name: 'リブロース', category: '牛肉', supplier_id: meat.id, unit: 'kg', current_stock: 3.5, reorder_point: 2, optimal_stock: 7, unit_cost: 6200, expiry_date: '2025-01-27', storage_location: '冷蔵庫A' },
      { item_name: 'カルビ', category: '牛肉', supplier_id: meat.id, unit: 'kg', current_stock: 6, reorder_point: 3, optimal_stock: 10, unit_cost: 3800, expiry_date: '2025-01-28', storage_location: '冷蔵庫A' },
      { item_name: '牛タン（焼肉用）', category: '牛肉', supplier_id: meat.id, unit: 'kg', current_stock: 2, reorder_point: 1.5, optimal_stock: 5, unit_cost: 4500, expiry_date: '2025-01-26', storage_location: '冷蔵庫A' },
      
      // シーフード
      { item_name: 'エビ（大）', category: 'シーフード', supplier_id: fish.id, unit: 'kg', current_stock: 3, reorder_point: 2, optimal_stock: 6, unit_cost: 3200, expiry_date: '2025-01-25', storage_location: '冷蔵庫B' },
      { item_name: 'イカ', category: 'シーフード', supplier_id: fish.id, unit: 'kg', current_stock: 2.5, reorder_point: 2, optimal_stock: 5, unit_cost: 1800, expiry_date: '2025-01-25', storage_location: '冷蔵庫B' },
      { item_name: 'ホタテ', category: 'シーフード', supplier_id: fish.id, unit: 'kg', current_stock: 2, reorder_point: 1.5, optimal_stock: 4, unit_cost: 3000, expiry_date: '2025-01-24', storage_location: '冷蔵庫B' },
      { item_name: 'タコ', category: 'シーフード', supplier_id: fish.id, unit: 'kg', current_stock: 1.5, reorder_point: 1, optimal_stock: 3, unit_cost: 2400, expiry_date: '2025-01-26', storage_location: '冷蔵庫B' },
      
      // 野菜
      { item_name: 'キャベツ', category: '野菜', supplier_id: vegetables.id, unit: '玉', current_stock: 15, reorder_point: 10, optimal_stock: 25, unit_cost: 180, expiry_date: '2025-01-30', storage_location: '冷蔵庫C' },
      { item_name: 'もやし', category: '野菜', supplier_id: vegetables.id, unit: 'kg', current_stock: 8, reorder_point: 5, optimal_stock: 15, unit_cost: 80, expiry_date: '2025-01-24', storage_location: '冷蔵庫C' },
      { item_name: 'ニンニク', category: '野菜', supplier_id: vegetables.id, unit: 'kg', current_stock: 2, reorder_point: 1, optimal_stock: 4, unit_cost: 800, expiry_date: '2025-02-10', storage_location: '倉庫' },
      { item_name: '玉ねぎ', category: '野菜', supplier_id: vegetables.id, unit: 'kg', current_stock: 10, reorder_point: 5, optimal_stock: 20, unit_cost: 150, expiry_date: '2025-02-15', storage_location: '倉庫' },
      
      // ソース・調味料
      { item_name: 'お好み焼きソース', category: 'ソース・調味料', supplier_id: vegetables.id, unit: '本', current_stock: 5, reorder_point: 3, optimal_stock: 10, unit_cost: 450, storage_location: '倉庫' },
      { item_name: '焼肉のタレ', category: 'ソース・調味料', supplier_id: meat.id, unit: '本', current_stock: 8, reorder_point: 4, optimal_stock: 15, unit_cost: 380, storage_location: '倉庫' },
      { item_name: '塩コショウ', category: 'ソース・調味料', supplier_id: vegetables.id, unit: '本', current_stock: 10, reorder_point: 5, optimal_stock: 20, unit_cost: 250, storage_location: '倉庫' },
      { item_name: 'サラダ油（大）', category: 'ソース・調味料', supplier_id: vegetables.id, unit: '本', current_stock: 6, reorder_point: 3, optimal_stock: 12, unit_cost: 680, storage_location: '倉庫' }
    ];

    const invStmt = db.prepare(`
      INSERT INTO inventory (
        item_name, category, supplier_id, unit, current_stock, 
        reorder_point, optimal_stock, unit_cost, expiry_date, storage_location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const admin = db.prepare('SELECT id FROM administrators WHERE username = ?').get('鉄板焼き居酒屋なかまる');
    const movementStmt = db.prepare(`
      INSERT INTO inventory_movements (
        inventory_id, movement_type, quantity, unit_cost, reference_type, notes, performed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of defaultInventory) {
      const result = invStmt.run(
        item.item_name,
        item.category,
        item.supplier_id,
        item.unit,
        item.current_stock,
        item.reorder_point,
        item.optimal_stock,
        item.unit_cost,
        item.expiry_date || null,
        item.storage_location
      );

      // 初期在庫の移動履歴を記録
      movementStmt.run(
        result.lastInsertRowid,
        'initial',
        item.current_stock,
        item.unit_cost,
        'initial_setup',
        '初期在庫登録',
        admin.id
      );
    }

    console.log('Default inventory created successfully');

    // 在庫アラートをチェック
    console.log('Checking inventory alerts...');
    const lowStockItems = db.prepare(`
      SELECT id, item_name, current_stock, reorder_point 
      FROM inventory 
      WHERE current_stock <= reorder_point
    `).all();

    const alertStmt = db.prepare(`
      INSERT INTO stock_alerts (inventory_id, alert_type, alert_level, message)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of lowStockItems) {
      alertStmt.run(
        item.id,
        'low_stock',
        'warning',
        `${item.item_name}の在庫が発注点（${item.reorder_point}${item.unit}）以下です。現在在庫：${item.current_stock}${item.unit}`
      );
    }

    const expiringItems = db.prepare(`
      SELECT id, item_name, expiry_date
      FROM inventory
      WHERE expiry_date IS NOT NULL 
      AND date(expiry_date) <= date('now', '+7 days')
    `).all();

    for (const item of expiringItems) {
      alertStmt.run(
        item.id,
        'expiry_warning',
        'urgent',
        `${item.item_name}の賞味期限が近づいています（${item.expiry_date}）`
      );
    }

    console.log('Inventory alerts created successfully');
  }

  return db;
}
