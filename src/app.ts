import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { green } from 'chalk';
import { connect } from 'mongoose';
// import { writeFileSync } from 'fs';
// import moment from 'moment';
// import cron from 'node-cron';
// import removeFiles from 'find-remove';

// import robloxBans from './models/ban';

import { methodCheck, tokenAuth, expiredTimeban } from './util/functions';
import { JSONError } from './types/interfaces';
import { checkBan, addPermBan, addTimeBan, deleteBan, listAllBans } from './routes/ban-endpoints';
import { sendWebhookMessage } from './routes/proxy-endpoints';

config();
const app: express.Application = express();

/* ALLOWING API USE ON ALL ORIGINS */
app.use(cors({ origin: 'https://roblox.com' }));

/* EXTRA SECURITY */
app.use(helmet());

/* RATE LIMITING API REQUESTS */
const apiLimiter = rateLimit({
	windowMs: 1000,
	max: 1,
	// @ts-ignore
	message: { errorCode: 11, message: 'Too many requests, please try again later.' },
});
// app.use(apiLimiter);

/* USING AUTH MIDDLEWARE */
app.use(tokenAuth);

/* USE BODY PARSER */
app.use(express.json());

/* HANDLING INCORRECT JSON BODY */
app.use((err: JSONError, _request: express.Request, response: express.Response, next: any) => {
	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		return response.status(400).json({ errorCode: 12, message: 'The provided JSON is invalid or incorrectly formatted.' }); // Bad request
	}
	next();
});

/* USING ALL ROUTES */
app.use('/v1', checkBan).all('/v1/users/:userid/banned', (request, response) => methodCheck(request, response, 'GET'));
app.use('/v1', addPermBan).all('/v1/bans/create-new', (request, response) => methodCheck(request, response, 'POST'));
app.use('/v1', deleteBan).all('/v1/bans/delete/:RobloxID', (request, response) => methodCheck(request, response, 'DELETE'));
app.use('/v1', listAllBans).all('/v1/bans/list-bans', (request, response) => methodCheck(request, response, 'GET'));
app.use('/v1', addTimeBan).all('/v1/timebans/create-new', (request, response) => methodCheck(request, response, 'POST'));

/* PROXY ENDPOINTS */
app.use('/v1', sendWebhookMessage).all('/v1/webhook/:id/:token', (request, response) => methodCheck(request, response, 'POST'));

/* HANDLING ENDPOINTS THAT DON'T EXIST */
app.all('*', (request: express.Request, response: express.Response) => {
	response.status(404).json({ errorCode: 9, message: `The requested endpoint ${request.url} was not found.` });
});

app.listen(80, async (): Promise<void> => {
	try {
		/* Connecting to Mongo Database */
		const databaseOptions = {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			keepAlive: true,
		};

		await connect(`${process.env.MONGO_PASSWORD}`, databaseOptions).then((): void => console.log(green(`[mongo_database]: Connected to MongoDB successfully.`)));
		console.log(green('[api_server]: 🚀 Listening on port 80!'));
	} catch (err) {
		console.error(err);
	}
});

/* Checking if timebans expired every 10 seconds */
setInterval(expiredTimeban, 10000);

// cron.schedule('0 0 * * *', async () => {
// 	removeFiles('./dataBackups', {
// 		age: { seconds: 604800 },
// 		extensions: '.json',
// 	});

// 	writeFileSync(`./dataBackups/${moment(new Date()).format('DD-MM-YYYY[@]h-mma')}.json`, JSON.stringify(await robloxBans.find({}, '-_id -__v'), null, 2));
// })
