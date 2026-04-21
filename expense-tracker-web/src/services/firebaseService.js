import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

// ── Users ────────────────────────────────────────────────────────────────────

export async function createUserProfile(uid, { name, email }) {
  await updateDoc(doc(db, 'users', uid), {
    id: uid,
    name,
    email,
    createdAt: serverTimestamp(),
  }).catch(async () => {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', uid), {
      id: uid,
      name,
      email,
      createdAt: serverTimestamp(),
    });
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function findUserByEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function createGroup({ name, members, createdBy }) {
  const ref = await addDoc(collection(db, 'groups'), {
    name,
    members,
    createdBy,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getGroup(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserGroups(userId) {
  const q = query(
    collection(db, 'groups'),
    where('members', 'array-contains', userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUserGroupsWithMemberObjects(userId) {
  // Groups store members as objects — query by member id field
  const allGroupsSnap = await getDocs(collection(db, 'groups'));
  const groups = allGroupsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((g) => g.members?.some((m) => m.id === userId));
  return groups;
}

export async function updateGroup(groupId, updates) {
  await updateDoc(doc(db, 'groups', groupId), updates);
}

export async function addGroupMember(groupId, member) {
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayUnion(member),
  });
}

export async function removeGroupMember(groupId, memberId) {
  const group = await getGroup(groupId);
  if (!group) return;
  const updatedMembers = group.members.filter((m) => m.id !== memberId);
  await updateDoc(doc(db, 'groups', groupId), { members: updatedMembers });
}

export async function deleteGroup(groupId) {
  await deleteDoc(doc(db, 'groups', groupId));
}

// ── Expenses ─────────────────────────────────────────────────────────────────

export async function createExpense(expenseData) {
  const docRef = await addDoc(collection(db, 'expenses'), {
    ...expenseData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getGroupExpenses(groupId) {
  const q = query(
    collection(db, 'expenses'),
    where('groupId', '==', groupId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getExpense(expenseId) {
  const snap = await getDoc(doc(db, 'expenses', expenseId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateExpense(expenseId, updates) {
  await updateDoc(doc(db, 'expenses', expenseId), updates);
}

export async function deleteExpense(expenseId) {
  await deleteDoc(doc(db, 'expenses', expenseId));
}

// ── Receipt Images ────────────────────────────────────────────────────────────

export async function uploadReceiptImage(uri, expenseId) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `receipts/${expenseId}_${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
