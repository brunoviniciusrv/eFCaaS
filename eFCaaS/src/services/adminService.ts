import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, AuditLog } from '../types';

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'auditLogs';

export const adminService = {
  async getUsers(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, USERS_COLLECTION));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
      return [];
    }
  },

  async createUser(userData: Omit<UserProfile, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, USERS_COLLECTION));
      const newUser = {
        ...userData,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
      };
      await setDoc(docRef, newUser);
      
      await this.logAction({
        action: 'create_user',
        userId: auth.currentUser?.uid || 'system',
        userName: auth.currentUser?.displayName || 'System',
        target: userData.email,
        details: `Created user ${userData.name} with role ${userData.role}`
      });

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, USERS_COLLECTION);
      throw error;
    }
  },

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, updates);

      if (updates.permissions) {
        await this.logAction({
          action: 'update_permissions',
          userId: auth.currentUser?.uid || 'system',
          userName: auth.currentUser?.displayName || 'System',
          target: userId,
          details: `Updated permissions for user ${userId}`
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
      throw error;
    }
  },

  async toggleUserStatus(userId: string, currentStatus: 'active' | 'suspended'): Promise<void> {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      await updateDoc(userRef, { status: newStatus });

      await this.logAction({
        action: newStatus === 'suspended' ? 'suspend_user' : 'activate_user',
        userId: auth.currentUser?.uid || 'system',
        userName: auth.currentUser?.displayName || 'System',
        target: userId,
        details: `${newStatus === 'suspended' ? 'Suspended' : 'Activated'} user access`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
      throw error;
    }
  },

  async getLogs(startDate?: string, endDate?: string, userId?: string): Promise<AuditLog[]> {
    try {
      let q = query(collection(db, LOGS_COLLECTION), orderBy('timestamp', 'desc'));
      
      // Note: Firestore limited filtering without indexes. 
      // For simplicity in this env, we'll fetch and filter client-side if needed, 
      // or just provide basic query. In real app, we'd add complex filters.
      const querySnapshot = await getDocs(q);
      let logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));

      if (userId) {
        logs = logs.filter(l => l.userId === userId);
      }
      if (startDate) {
        logs = logs.filter(l => l.timestamp >= startDate);
      }
      if (endDate) {
        logs = logs.filter(l => l.timestamp <= endDate);
      }

      return logs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
      return [];
    }
  },

  async logAction(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, LOGS_COLLECTION), {
        ...logData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }
};
