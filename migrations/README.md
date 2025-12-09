# Database Migration Instructions

## Create Medical Reports Table

### Option 1: Using Drizzle Kit (Recommended)

Run the following command to generate and apply migrations:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

This will automatically create the `medical_reports` table based on the schema defined in `config/schema.tsx`.

### Option 2: Manual SQL (Alternative)

If you prefer to run SQL manually, execute the SQL in `create_medical_reports_table.sql` in your Neon database console.

**Note:** Make sure the column names match what Drizzle ORM expects. The schema uses camelCase in TypeScript but maps to snake_case or quoted identifiers in the database.

## Table Structure

The `medical_reports` table stores:
- Session information (sessionId, createdBy, agent, user)
- Report metadata (timestamp, createdOn)
- Medical data (chiefComplaint, summary, symptoms, duration, severity)
- Medications and recommendations (stored as JSON strings)

## Verification

After creating the table, you can verify it exists by running:

```sql
SELECT * FROM medical_reports LIMIT 1;
```


