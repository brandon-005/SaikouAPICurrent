import express, { Router } from 'express';
import axios from 'axios';

import Ban from '../models/ban';

const router: Router = express.Router();

/* 
TITLE: Endpoint For Checking Bans
URL: http://localhost/v1/users/{userID}/banned
HEADERS: X-API-KEY
*/

export const checkBan = router.get('/users/:userid/banned', async (request, response) => {
	const { userid } = request.params;

	if (Number.isNaN(Number(userid))) {
		return response.status(400).json({ errorCode: 1, message: 'Roblox ID contains alphabetic characters.' });
	}

	/* Checking if they have a permanent ban */
	const permbanPlayer = await Ban.findOne({ RobloxID: Number(userid), type: 'permban' }, '-__v -_id');

	if (permbanPlayer) {
		return response.json({ banned: true, type: 'permban', player: permbanPlayer });
	}

	/* Checking if they have a temporary ban */
	const timebanPlayer = await Ban.findOne({ RobloxID: Number(userid), type: 'timeban' }, '-__v -_id');

	if (timebanPlayer) {
		return response.json({ banned: true, type: 'timeban', player: timebanPlayer });
	}

	/* If user doesn't have either a temp or perm ban, return false */
	return response.json({ banned: false });
});

/* 
TITLE: Endpoint For Adding Perm Bans
URL: http://localhost/v1/bans/create-new
HEADERS: X-API-KEY
*/

export const addPermBan = router.post('/bans/create-new', async (request, response) => {
	const { RobloxUsername, RobloxID, Moderator, Reason, Place } = request.body;
	let validMod = false;
	let moderatorID;

	if (!RobloxUsername || !RobloxID || !Moderator || !Reason || !Place) {
		return response.status(400).json({ errorCode: 6, message: 'Some required fields were missing.' });
	}

	if (typeof RobloxUsername !== 'string' || typeof RobloxID !== 'number' || typeof Moderator !== 'string' || typeof Reason !== 'string' || typeof Place !== 'string') {
		return response.status(400).json({ errorCode: 7, message: 'Inputted values lacked the correct data type (string, number).' });
	}

	/* Checking if they are a Saikou Mod+ */
	await axios({
		method: 'post',
		url: 'https://users.roblox.com/v1/usernames/users',
		data: {
			usernames: [Moderator],
		},
	})
		.then((robloxResponse) => {
			moderatorID = robloxResponse.data.data.map((value: any) => value.id);
			if (robloxResponse.data.data.length === 0) moderatorID = undefined;
		})
		.catch((error) => {
			console.error(error);
		});

	if (moderatorID) {
		await axios({
			method: 'get',
			url: `https://groups.roblox.com/v2/users/${moderatorID}/groups/roles`,
		})
			.then((robloxResponse) => {
				robloxResponse.data.data.forEach((userGroup: any) => {
					if (userGroup.group.name === 'Saikou' && userGroup.role.rank >= 40) {
						validMod = true;
					}
				});
			})
			.catch((error) => {
				console.error(error);
			});
	}

	if (validMod !== false || Moderator === 'SaikouDev') {
		if (await Ban.findOne({ RobloxID, type: 'permban' })) {
			return response.status(409).json({ errorCode: 8, message: 'Inputted Roblox user already exists in the database.' });
		}

		try {
			const player = new Ban({
				RobloxUsername,
				RobloxID,
				Moderator,
				Reason,
				Date: Date.now(),
				Place,
				type: 'permban',
			});

			await player.save();
			return response.status(200).json({ status: 'ok', message: 'New ban added!' });
		} catch (err: any) {
			return response.status(500).json({ error: err.toString() });
		}
	}
	return response.status(403).json({ errorCode: 13, message: "The provided Moderator name isn't a Saikou Staff Member." });
});

/* 
TITLE: Endpoint For Adding Time Bans
URL: http://localhost/v1/timebans/create-new
HEADERS: X-API-KEY
*/

export const addTimeBan = router.post('/timebans/create-new', async (request, response) => {
	const { RobloxUsername, RobloxID, Moderator, Reason, Duration, Place } = request.body;
	let validMod = false;
	let moderatorID;

	if (!RobloxUsername || !RobloxID || !Moderator || !Reason || !Duration) {
		return response.status(400).json({ errorCode: 6, message: 'Some required fields were missing.' });
	}

	if (typeof RobloxUsername !== 'string' || typeof RobloxID !== 'number' || typeof Moderator !== 'string' || typeof Reason !== 'string' || typeof Duration !== 'number' || typeof Place !== 'string') {
		return response.status(400).json({ errorCode: 7, message: 'Inputted values lacked the correct data type (string, number).' });
	}

	/* Checking if they are a Saikou Mod+ */
	await axios({
		method: 'post',
		url: 'https://users.roblox.com/v1/usernames/users',
		data: {
			usernames: [Moderator],
		},
	})
		.then((robloxResponse) => {
			moderatorID = robloxResponse.data.data.map((value: any) => value.id);
			if (robloxResponse.data.data.length === 0) moderatorID = undefined;
		})
		.catch((error) => {
			console.error(error);
		});

	if (moderatorID) {
		await axios({
			method: 'get',
			url: `https://groups.roblox.com/v2/users/${moderatorID}/groups/roles`,
		})
			.then((robloxResponse) => {
				robloxResponse.data.data.forEach((userGroup: any) => {
					if (userGroup.group.name === 'Saikou' && userGroup.role.rank >= 40) {
						validMod = true;
					}
				});
			})
			.catch((error) => {
				console.error(error);
			});
	}

	if (validMod !== false || Moderator === 'SaikouDev') {
		if (await Ban.findOne({ RobloxID, type: 'timeban' })) {
			return response.status(409).json({ errorCode: 8, message: 'Inputted Roblox user already exists in the database.' });
		}

		try {
			const player = new Ban({
				RobloxUsername,
				RobloxID,
				Moderator,
				Reason,
				Date: Date.now(),
				Duration,
				Place,
				type: 'timeban',
			});

			await player.save();
			return response.status(200).json({ status: 'ok', message: 'New timeban added!' });
		} catch (err: any) {
			return response.status(500).json({ error: err.toString() });
		}
	}
	return response.status(403).json({ errorCode: 13, message: "The provided Moderator name isn't a Saikou Staff Member." });
});

/* 
TITLE: Endpoint For Deleting Bans
URL: http://localhost/v1/bans/delete/${userID}
HEADERS: X-API-KEY
*/

export const deleteBan = router.delete('/bans/delete/:RobloxID', async (request, response) => {
	const { RobloxID } = request.params;

	try {
		if (Number.isNaN(Number(RobloxID))) {
			return response.status(400).json({ errorCode: 1, message: 'Roblox ID contains alphabetic characters.' });
		}

		/* Checking if there is a perm ban, if there is, delete it */
		const permbanPlayer = await Ban.findOne({ RobloxID: Number(RobloxID), type: 'permban' });

		if (permbanPlayer) {
			return await Ban.deleteOne({ RobloxID: Number(RobloxID), type: 'permban' }).then(() => {
				response.json({ status: 'ok', message: 'Player unbanned!' });
			});
		}

		/* Checking if there is a time ban, if there is, delete it */
		const timebanPlayer = await Ban.findOne({ RobloxID: Number(RobloxID), type: 'timeban' });

		if (timebanPlayer) {
			return await Ban.deleteOne({ RobloxID: Number(RobloxID), type: 'timeban' }).then(() => {
				response.json({ status: 'ok', message: 'Player unbanned!' });
			});
		}

		/* If no permanent or time ban was found, return an error */
		return response.status(404).json({ errorCode: 2, message: "Roblox player doesn't exist or isn't banned." });
	} catch (err) {
		return response.status(500).json(err);
	}
});

/* 
TITLE: Endpoint For Listing All Bans
URL: http://localhost/v1/bans/list-bans
HEADERS: X-API-KEY
*/

export const listAllBans = router.get('/bans/list-bans', async (request, response) => {
	const { sortOrder, limit } = request.query;

	if (!Object.keys(request.query).length || (!sortOrder && !limit)) {
		try {
			return response.json(await Ban.find({}, '-__v -_id'));
		} catch (err) {
			return response.json({ message: err });
		}
	}

	if (sortOrder && limit) {
		try {
			if (Number.isNaN(Number(limit))) return response.status(400).json({ errorCode: 4, message: 'Limit parameter must be an integer.' });
			return response.json(await Ban.find({}, '-__v -_id').sort({ Date: sortOrder }).limit(Number(limit)));
		} catch (err: any) {
			if (err.message.includes('Invalid sort value')) {
				return response.status(400).json({ errorCode: 3, message: 'SortOrder allowed values: Asc, Desc' });
			}
			return response.status(500).json({ message: err });
		}
	}

	if (sortOrder) {
		try {
			response.json(await Ban.find({}, '-__v -_id').sort({ Date: sortOrder }));
		} catch (err: any) {
			if (err.message.includes('Invalid sort value')) {
				return response.status(400).json({ errorCode: 3, message: 'SortOrder allowed values: Asc, Desc' });
			}
			return response.status(500).json({ message: err });
		}
	}

	if (limit) {
		try {
			if (Number.isNaN(Number(limit))) return response.status(400).json({ errorCode: 4, message: 'Limit parameter must be an integer.' });
			response.json(await Ban.find({}, '-__v -_id').limit(Number(limit)));
		} catch (err) {
			return response.status(500).json({ message: err });
		}
	}
});
