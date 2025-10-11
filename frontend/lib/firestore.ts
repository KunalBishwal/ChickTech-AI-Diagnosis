import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";

export async function saveDiagnosis(uid: string, result: string, confidence: number) {
  const docRef = await addDoc(collection(db, "diagnosisHistory"), {
    uid,
    result,
    confidence,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getDiagnosisHistory(uid: string) {
  const q = query(collection(db, "diagnosisHistory"), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
