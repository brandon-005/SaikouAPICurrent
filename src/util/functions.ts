import { Request, Response } from 'express';

import timebanData from '../models/ban';

/* API AUTHENTICATION MIDDLEWARE */
export function tokenAuth(request: Request, response: Response, next: any) {
	const token = request.get('X-API-KEY');

	if (!token || token !== process.env.API_TOKEN) return response.status(401).json({ errorCode: 5, message: 'Unathorised request, please pass through an API token.' });
	next();
}

/* INCORRECT METHOD CHECK */
export function methodCheck(request: Request, response: Response, validMethod: string) {
	response.set('Allow', validMethod);
	return response.status(405).json({ errorCode: 10, message: `The provided method ${request.method} is not allowed for this ${validMethod} endpoint.` });
}

/* EXPIRED TIMEBAN CHECK */
export async function expiredTimeban() {
	const bannedPlayers = await timebanData.find({ type: 'timeban' });

	bannedPlayers.forEach(async (player) => {
		if (player.Date!.getTime() + player.Duration! < Date.now()) {
			await timebanData.deleteOne({ RobloxID: player.RobloxID });
		}
	});
}
