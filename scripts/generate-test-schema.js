/**
 * Generate SQLite-compatible test schema from main Prisma schema
 * This script strips PostgreSQL-specific type decorators that aren't supported by SQLite
 */

const fs = require('fs')
const path = require('path')

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
const testSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.test.prisma')

// Read the main schema
let schema = fs.readFileSync(schemaPath, 'utf8')

// Strip PostgreSQL-specific type decorators for SQLite compatibility
schema = schema
  // Remove @db.Uuid
  .replace(/@db\.Uuid/g, '')
  // Remove @db.VarChar(n)
  .replace(/@db\.VarChar\(\d+\)/g, '')
  // Remove @db.Timestamptz(n)
  .replace(/@db\.Timestamptz\(\d+\)/g, '')
  // Remove @db.JsonB and all Json defaults (SQLite doesn't handle them well)
  .replace(/@db\.JsonB/g, '')
  .replace(/Json\s+@default\("[^"]*"\)/g, 'Json')
  .replace(/Json\s+@default\(\{\}\)/g, 'Json')
  // Replace PostgreSQL UUID generation with cuid()
  .replace(/@default\(dbgenerated\("gen_random_uuid\(\)"\)\)/g, '@default(cuid())')
  // Remove @db.Text
  .replace(/@db\.Text/g, '')
  // Remove @db.Decimal
  .replace(/@db\.Decimal\([^)]+\)/g, '')
  // Convert array fields to Json (SQLite doesn't support primitive arrays)
  // First, remove array defaults as they'll be incompatible with Json type
  .replace(
    /(\w+)\s+(String|Int|Boolean|Float|Decimal|DateTime)\[\]\s+@default\(\[.*?\]\)/g,
    '$1 Json'
  )
  // Then convert remaining array fields
  .replace(/(\w+)\s+String\[\]/g, '$1 Json')
  .replace(/(\w+)\s+Int\[\]/g, '$1 Json')
  .replace(/(\w+)\s+Boolean\[\]/g, '$1 Json')
  .replace(/(\w+)\s+Float\[\]/g, '$1 Json')
  .replace(/(\w+)\s+Decimal\[\]/g, '$1 Json')
  .replace(/(\w+)\s+DateTime\[\]/g, '$1 Json')
  // Remove any remaining @db.* decorators
  .replace(/@db\.\w+(\([^)]*\))?/g, '')
  // Clean up multiple spaces
  .replace(/  +/g, ' ')
  // Clean up spaces before line breaks
  .replace(/ +$/gm, '')

// Write the test schema
fs.writeFileSync(testSchemaPath, schema, 'utf8')

console.log('✅ Generated SQLite-compatible test schema at prisma/schema.test.prisma')
