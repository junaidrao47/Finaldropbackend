// Re-export Drizzle types for backward compatibility
import { ReceiveSelect, ReceiveInsert } from '../../db/schema/receives';
import { ReceiveWithRelations } from '../../drizzle/repositories/receives.repository';

export type ReceiveStatus = 'pending' | 'processing' | 'done' | 'failed';

// Legacy type alias for backward compatibility
export type Receive = ReceiveWithRelations;
export type { ReceiveSelect, ReceiveInsert, ReceiveWithRelations };
