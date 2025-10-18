const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

exports.createOrder = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed')
    return
  }

  const order = req.body
  if (!order || !order.items || !order.total) {
    res.status(400).send('Invalid order payload')
    return
  }

  try {
    const docRef = await db.collection('orders').add({
      ...order,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    })
    res.json({ id: docRef.id })
  } catch (err) {
    console.error(err)
    res.status(500).send('Failed to create order')
  }
})

exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Only allow admins
  const callerUid = context.auth && context.auth.uid
  if (!callerUid) throw new functions.https.HttpsError('permission-denied', 'Not authenticated')
  const caller = await admin.firestore().collection('users').doc(callerUid).get()
  if (!caller.exists || caller.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Not an admin')
  }

  const { uid, role } = data
  if (!uid || !role) throw new functions.https.HttpsError('invalid-argument', 'Missing uid or role')

  await admin.firestore().collection('users').doc(uid).set({ role }, { merge: true })
  return { success: true }
})
