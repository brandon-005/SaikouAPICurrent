import { Document } from 'mongoose';

// --- Ban Schema ---
export interface BanTypes extends Document {
	RobloxUsername: string;
	RobloxID: number;
	Moderator: string;
	Reason: string;
	Place: string;
	Date: Date;
	Duration?: number;
	type: string;
}
// --- Error Interface ---
export interface JSONError {
	status?: number;
}
