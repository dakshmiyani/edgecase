/**
 * @param {import('knex').Knex} knex
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('rules').del();
  await knex('decisions').del();
  await knex('policy_audit').del();

  // Inserts seed entries
  await knex('rules').insert([
    {
      name: 'SCORE_LOW',
      priority: 10,
      condition: JSON.stringify({
        all: [{
          fact: 'fraud_score',
          operator: 'lessThan',
          value: 30
        }]
      }),
      action: 'ALLOW'
    },
    {
      name: 'SCORE_MEDIUM',
      priority: 20,
      condition: JSON.stringify({
        all: [
          {
            fact: 'fraud_score',
            operator: 'greaterThanInclusive',
            value: 30
          },
          {
            fact: 'fraud_score',
            operator: 'lessThanInclusive',
            value: 70
          }
        ]
      }),
      action: 'OTP'
    },
    {
      name: 'SCORE_HIGH',
      priority: 30,
      condition: JSON.stringify({
        all: [{
          fact: 'fraud_score',
          operator: 'greaterThan',
          value: 70
        }]
      }),
      action: 'BLOCK'
    },
    {
      name: 'AMOUNT_LARGE',
      priority: 25,
      condition: JSON.stringify({
        all: [{
          fact: 'amount',
          operator: 'greaterThan',
          value: 50000
        }]
      }),
      action: 'OTP'
    },
    {
      name: 'MICRO_TXN',
      priority: 100, // Highest priority override
      condition: JSON.stringify({
        all: [{
          fact: 'amount',
          operator: 'lessThan',
          value: 100
        }]
      }),
      action: 'ALLOW'
    }
  ]);

  console.log('✅ Initial security rules seeded');
}
