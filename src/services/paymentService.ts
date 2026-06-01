import { db } from "../lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Pago } from "../types";

const PAGOS_COLLECTION = "pagos";

export async function registrarPago(pago: Omit<Pago, "id">) {
    try {
        const docRef = await addDoc(collection(db, PAGOS_COLLECTION), pago);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

export async function obtenerPagos(): Promise<Pago[]> {
    const q = query(collection(db, PAGOS_COLLECTION), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Pago[];
}

export async function updatePago(id: string, pago: Partial<Pago>) {
    const docRef = doc(db, PAGOS_COLLECTION, id);
    await setDoc(docRef, pago, { merge: true });
}

export async function deletePago(id: string) {
    const docRef = doc(db, PAGOS_COLLECTION, id);
    await deleteDoc(docRef);
}
