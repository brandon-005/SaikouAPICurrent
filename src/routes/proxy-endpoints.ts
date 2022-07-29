import express, { Router } from 'express';
import axios from 'axios';

import Ban from '../models/ban';

const router: Router = express.Router();

/* 
TITLE: Endpoint For Sending Webhook Message
URL: http://localhost/v1/webhook/{webhook.id}/{webhook.token}
HEADERS: X-API-KEY
*/

export const sendWebhookMessage = router.post('/webhook/:id/:token', async (request, response) => {
	const { id, token } = request.params;

	console.log(request.body);

	try {
		await axios({
			method: 'POST',
			url: `https://discord.com/api/webhooks/${id}/${token}`,
			data: request.body,
		});
	} catch (err) {
		// console.log(err);
		return response.status(400).json(err);
	}

	return response.json({ sucess: true });
});

export const test = router.get('/test', (request, response) => {
	response.json('test success');
});
