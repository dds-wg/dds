import { xrpcSafe } from '@atproto/lex'
import * as com from './lexicons/com.js'
import * as app from './lexicons/app.js'

async function runExperimentC() {
  const mockDidKey = 'did:key:z6MkhaXgBZDvotDkL5257faiztiuC2Q3hA4Kpm8o1eM3QGwk'
  const pdsUrl = 'https://bsky.social' 

  console.log(`\n==================================================`)
  console.log(`[Experiment C-1] Testing did:key natively against AT Protocol`)
  console.log(`==================================================\n`)

  console.log(`-> 1. Trying describeRepo with did:key...`)
  const describeResult = await xrpcSafe(pdsUrl, com.atproto.repo.describeRepo, {
    params: { repo: mockDidKey }
  })

  if (!describeResult.success) {
    console.log(`  [Rejected] Error: ${describeResult.error}`)
    console.log(`  [Message] ${describeResult.message}\n`)
  }

  console.log(`-> 2. Trying createRecord with did:key...`)
  const createResult = await xrpcSafe(pdsUrl, com.atproto.repo.createRecord, {
    data: {
      repo: mockDidKey,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text: 'Hello from did:key! Is this allowed?',
        createdAt: new Date().toISOString()
      }
    }
  })

  if (!createResult.success) {
    console.log(`  [Rejected] Error: ${createResult.error}`)
    console.log(`  [Message] ${createResult.message}\n`)
  }
}

async function runExperimentC2() {
  const mockDidKey = 'did:key:z6MkhaXgBZDvotDkL5257faiztiuC2Q3hA4Kpm8o1eM3QGwk'
  const pdsUrl = 'https://bsky.social'

  console.log(`\n==================================================`)
  console.log(`[Experiment C-2] Trying to CREATE AN ACCOUNT with did:key...`)
  console.log(`==================================================\n`)

  const createAccountResult = await xrpcSafe(pdsUrl, com.atproto.server.createAccount, {
    data: {
      did: mockDidKey,
      handle: 'didkey-test.bsky.social',
      email: 'dummy-didkey@example.com',
      password: 'SuperSecretPassword123!',
      inviteCode: 'dummy-code' // PDSによっては必要になるのでダミーを入れておきます
    }
  })

  if (!createAccountResult.success) {
    console.log(`  ❌ [Rejected] Error: ${createAccountResult.error}`)
    console.log(`  ❌ [Message] ${createAccountResult.message}\n`)
    console.log('💡 結論: あなたの予想通り、PDSは did:key での「アカウント作成」自体を明確に拒絶しました。')
  } else {
    console.log('🎉 成功!? サーバーが did:key でのアカウント作成を許可しました！')
  }
}

// 順番に実行するためのラッパー
async function main() {
  await runExperimentC()
  await runExperimentC2()
}

main()
