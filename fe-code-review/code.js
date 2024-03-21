app.post('/api/extract', upload.single('file'), async (req, res) => {
    logInfo('POST /api/extract',req.body);
    // Logging an entire file's buffer can be a bottleneck for both disk and CPU
    logInfo('FILE=',req.file);

    // A lot of ifs are nested together, it's hard too read, wouldn't it be prettier if we use negative conditions with return statement:
    // Example:
    // if (!req.body) {
    //     return res.status(500).json({requestID: '', message: 'Missing requried input (form data)'});
    // }

    // Also, we're using async/await but there's no try/catch clause to wrap entire request and send res.status(500) if some random exception occurs

    if (req.body) {
        const file = req.file;
        // Spread operator { ... } would look awesome here
        // Do we trust enough the user to let him decidie on requestID?
        const requestID = req.body.requestID;
        const project = req.body.project;
        // I think we should keep naming consistent and userID (as in requestID) would fit better, don't you think?
        const idUser = req.body.userID;
        // Wouldn't it be better to fetch user after we validated userID? (then return appropriate status for missing user)
        const user = await User.findOne(idUser);

        // Is this validation enough? How would system behave if I'd send values other than strings here
        if (requestID && project && idUser && user) {
            // No need to log entire user, ID would be enough, aren't we logging user's password?
            logDebug('User with role '+user.role, user);
            // Isn't === statement useless if we use indexOf anyway?
            if (user.role === 'ADVISOR' || user.role.indexOf('ADVISOR') > -1)
                // Wouldn't it be cleaner for developers using API to set Forbidden status for this one?
                return res.json({requestID, step: 999, status: 'DONE', message: 'Nothing to do for ADVISOR role'});

            // What are we resetting exactly, shouldn't requestID (any ID in general) be unique?
            // I'm not sure what an empty string is for, we could just define a default value for that
            // Also, status (3) could be in some enum so is it's clear what status is being used
            /* reset status variables */
            await db.updateStatus(requestID, 1, '');

            logDebug('CONFIG:', config.projects);
            // We don't really do anything other than logging and status update if project isn't 'inkasso', shouldn't we validate it before?
            // What's the purpose of config.projects property check if we have handle only one, hard-coded project
            if (project === 'inkasso' && config.projects.hasOwnProperty(project) && file) {
                // This variable isn't used anywhere
                const hashSum = crypto.createHash('sha256');
                // Correct me if I'm wrong but I don't think file hash is user ID
                const fileHash = idUser;
                // Won't there be any conflicts if we use the same filename for every request?
                const fileName = 'fullmakt';
                // We could move validation to the first validation if block, if we keep it in one place it'll be easier to debug and read
                const fileType = mime.getExtension(file.mimetype);
                if (fileType !== 'pdf')
                    // I think 4xx status is more appropriate in this case as 500 is used for server errors, not user based errors
                    return res.status(500).json({requestID, message: 'Missing pdf file'});

                await db.updateStatus(requestID, 3, '');

                // Do we really trust user to let him define project/idUser directly from req.body?
                const folder = `${project}-signed/${idUser}`;
                // Why are we logging the entire file on more time?
                logDebug('FILE2=', file);
                await uploadToGCSExact(folder, fileHash, fileName, fileType, file.mimetype, file.buffer);
                await db.updateStatus(requestID, 4, '');
                // Shouldn't we keep some file reference in DB instead of storing the entire buffer? It looks like it's being uploaded two times
                const ret = await db.updateUploadedDocs(idUser, requestID, fileName, fileType, file.buffer);
                logDebug('DB UPLOAD:', ret);

                await db.updateStatus(requestID, 5, '');

                // This variable isn't used anywhere
                let sent = true;
                // It would be wise to move it right before for loop, if next if (hasUserRequestKey) matches then this block is waste of CPU and Networking resources
                const debtCollectors = await db.getDebtCollectors();
                logDebug('debtCollectors=', debtCollectors);
                if (!debtCollectors)
                    // Again, inappropriate status
                    return res.status(500).json({requestID, message: 'Failed to get debt collectors'});

                // It would be good to decide whether to open {} for one line if statements (some places have it, some not)
                // If there is a fix needed it would be wise to comment following lines
                if (!!(await db.hasUserRequestKey(idUser))) { //FIX: check age, not only if there's a request or not
                    // Wouldn't it be cleaner for developers using API to set Conflict status for this one?
                    return res.json({requestID, step: 999, status: 'DONE', message: 'Emails already sent'});
                }

                const sentStatus = {};
                // That could be a huge bottleneck if there's plenty of debtCollectors, I can see using Promise.all here to reduce request time
                for (let i = 0; i < debtCollectors.length ; i++) {
                    await db.updateStatus(requestID, 10+i, '');
                    // Again, spread operator and ID naming
                    const idCollector = debtCollectors[i].id;
                    const collectorName = debtCollectors[i].name;
                    const collectorEmail = debtCollectors[i].email;
                    const hashSum = crypto.createHash('sha256');
                    const hashInput = `${idUser}-${idCollector}-${(new Date()).toISOString()}`;
                    logDebug('hashInput=', hashInput);
                    hashSum.update(hashInput);
                    // Why don't we use requestID (we can't retrieve hashed user/collector ID anyway)
                    const requestKey = hashSum.digest('hex');
                    logDebug('REQUEST KEY:', requestKey);

                    // I'm a bit confused as why hashSum, hashInput is not related to hash but requestKey, we could improve naming here
                    const hash = Buffer.from(`${idUser}__${idCollector}`, 'utf8').toString('base64')

                    // Why are we checking if some functions (that as a name suggest should set something) is boolean (success) returned? Shouldn't it be handled in try/catch clause?
                    if (!!(await db.setUserRequestKey(requestKey, idUser))
                        && !!(await db.setUserCollectorRequestKey(requestKey, idUser, idCollector))) {

                        /* prepare email */
                        const sendConfig = {
                            // config.projects[project] is repeated over and over, it would be easier to look at if there's a variable definied projectConfig
                            sender: config.projects[project].email.sender,
                            replyTo: config.projects[project].email.replyTo,
                            subject: 'Email subject',
                            templateId: config.projects[project].email.template.collector,
                            params: {
                                // We could use encodeURIComponent to prevent encoding errors
                                // There's some place for refactoring since string stays the some for the most part, only download/upload/confirm differs
                                downloadUrl: `https://url.go/download?requestKey=${requestKey}&hash=${hash}`,
                                uploadUrl: `https://url.go/upload?requestKey=${requestKey}&hash=${hash}`,
                                confirmUrl: `https://url.go/confirm?requestKey=${requestKey}&hash=${hash}`
                            },
                            tags: ['request'],
                            to: [{ email: collectorEmail , name: collectorName }],
                        };
                        logDebug('Send config:', sendConfig);

                        try {
                            // Isn't logDebug enough? Why do we have multiple logging destinations?
                            await db.setEmailLog({collectorEmail, idCollector, idUser, requestKey})
                        } catch (e) {
                            logDebug('extract() setEmailLog error=', e);
                        }

                        /* send email */
                        const resp = await email.send(sendConfig, config.projects[project].email.apiKey);
                        logDebug('extract() resp=', resp);

                        // What would happen to user state if something in-between setUserCollectorRequestKey fails?
                        // update DB with result
                        await db.setUserCollectorRequestKeyRes(requestKey, idUser, idCollector, resp);

                        if (!sentStatus[collectorName])
                            sentStatus[collectorName] = {};
                        sentStatus[collectorName][collectorEmail] = resp;

                        if (!resp) {
                            logError('extract() Sending email failed: ', resp);
                        }
                    }
                }
                await db.updateStatus(requestID, 100, '');

                logDebug('FINAL SENT STATUS:');
                // Since we have logDebug, why are we using log from console API?
                // We could just combine logDebug with JSON.stringify
                console.dir(sentStatus, {depth: null});

                //if (!allSent)
                //return res.status(500).json({requestID, message: 'Failed sending email'});

                // I think this line should be commented as well (nothing happened from the previous status update)
                await db.updateStatus(requestID, 500, '');

                /* prepare summary email */
                const summaryConfig = {
                    //bcc: [{ email: 'unknown@domain.com', name: 'Tomas' }],
                    sender: config.projects[project].email.sender,
                    replyTo: config.projects[project].email.replyTo,
                    subject: 'Oppsummering Kravsforespørsel',
                    templateId: config.projects[project].email.template.summary,
                    params: {
                        collectors: sentStatus,
                    },
                    tags: ['summary'],
                    to: [{ email: 'unknown@otherdomain.no' , name: 'Tomas' }], // FIXXX: config.projects[project].email.sender
                };
                logDebug('Summary config:', summaryConfig);

                /* send email */
                //const respSummary = await email.send(sendConfig, config.projects[project].email.apiKey);
                //logDebug('extract() summary resp=', respSummary);

                // I think this line should be commented as well (nothing happened from the previous status update)
                await db.updateStatus(requestID, 900, '');
            }
            await db.updateStatus(requestID, 999, '');
            // I think step is used only for debugging purposes, I'm not sure if it's necessary here
            // Also step is always 999 in response so it's useless, same goes for status
            return res.json({requestID, step: 999, status: 'DONE', message: 'Done sending emails...'});
        } else
            // Again, inappropriate status
            return res.status(500).json({requestID, message: 'Missing requried input (requestID, project, file)'});
        }
    // Again, inappropriate status
    res.status(500).json({requestID: '', message: 'Missing requried input (form data)'});
});
