// scripts/migratePhones.ts
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { Client } from 'pg'  // ou ton ORM préféré

const client = new Client({
  connectionString: process.env.DATABASE_URL
})

async function migratePhones() {
  await client.connect()

  const res = await client.query('SELECT id, phone FROM users')
  for (const row of res.rows) {
    let { id, phone } = row

    // Si le numéro ne commence pas par +, on ajoute +221 par défaut
    if (!phone.startsWith('+')) {
      phone = '+221' + phone.replace(/\D/g,'')
    }

    const parsed = parsePhoneNumberFromString(phone)
    if (parsed?.isValid()) {
      await client.query('UPDATE users SET phone=$1 WHERE id=$2', [parsed.number, id])
      console.log(`User ${id} -> ${parsed.number}`)
    } else {
      console.log(`Numéro invalide pour user ${id}: ${phone}`)
    }
  }

  await client.end()
  console.log('Migration terminée ✅')
}

migratePhones().catch(console.error)
