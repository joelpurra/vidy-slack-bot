const {
    name: packageJsonName,
    version: packageJsonVersion,
} = require("./package.json");

const runtimeConfig = require("cloud-functions-runtime-config");

const buildFunctionsConfigurationName = (functionName) => `functions-${functionName}`;
const configValueGetter = (functionName, key) => runtimeConfig.getVariable(buildFunctionsConfigurationName(functionName), key);
const slackCommandConfigValueGetter = (key) => configValueGetter("slackCommand", key);

const {
    create: createVidy,
} = require("vidy");

const createVidyObject = () => {
    return Promise.resolve()
        .then(() => Promise.all([
            slackCommandConfigValueGetter("vidyAuthenticationKeyId"),
            slackCommandConfigValueGetter("vidyAuthenticationKeySecret"),
            slackCommandConfigValueGetter("vidyBaseUrlApi"),
            slackCommandConfigValueGetter("vidyBaseUrlClip"),
            slackCommandConfigValueGetter("vidyBaseUrlSearch"),
            slackCommandConfigValueGetter("vidyApplicationLocale"),
            slackCommandConfigValueGetter("vidySystemUuid"),
        ]))
        .then(([
            vidyAuthenticationKeyId,
            vidyAuthenticationKeySecret,
            vidyBaseUrlApi,
            vidyBaseUrlClip,
            vidyBaseUrlSearch,
            vidyApplicationLocale,
            vidySystemUuid,
        ]) => {
            const vidyConfig = {
                application: {
                    name: packageJsonName,
                    locale: vidyApplicationLocale,
                    uuid: vidySystemUuid,
                    version: packageJsonVersion,
                },
                authentication: {
                    keyId: vidyAuthenticationKeyId,
                    keySecret: vidyAuthenticationKeySecret,
                },
                urls: {
                    api: vidyBaseUrlApi,
                    clip: vidyBaseUrlClip,
                    search: vidyBaseUrlSearch,
                },
            };

            const vidy = createVidy(vidyConfig);

            return vidy;
        });
};

const createVidyResponse = (incomingSlackCommand) => {
    return Promise.resolve()
        .then(() => Promise.all([
            Promise.all([
                createVidyObject(),

                slackCommandConfigValueGetter("vidyQueryLimit"),
            ])
                // TODO: check text format?
                .then(([
                    vidy,
                    vidyQueryLimit,
                ]) => {
                    const vidySearchObject = {
                        q: incomingSlackCommand.text,
                        limits: [
                            parseInt(vidyQueryLimit, 10),
                        ],
                        types: [
                            "clips",
                        ],
                        files: [
                            // TODO: enable portraits?
                            "landscapeImage240",
                            // "portraitImage240",
                        ],
                    };

                    return vidy.search(vidySearchObject);
                }),

            slackCommandConfigValueGetter("vidyBaseUrlClip"),

            slackCommandConfigValueGetter("vidyBaseUrlSearch"),
        ]))
        .then(([
            vidySearchResult,
            vidyBaseUrlClip,
            vidyBaseUrlSearch,
        ]) => {
            let response = null;

            const gotQueryResults = vidySearchResult
                && vidySearchResult.clips
                && Array.isArray(vidySearchResult.clips.results)
                && vidySearchResult.clips.results.length > 0;

            if (gotQueryResults) {
                const rnd = Math.floor(Math.random() * vidySearchResult.clips.results.length);
                const randomResult = vidySearchResult.clips.results[rnd];

                // TODO: configuration and/or url builder.
                const vidyUrl = `${vidyBaseUrlClip}${randomResult.id}`;
                const vidySearchUrl = `${vidyBaseUrlSearch}${encodeURIComponent(incomingSlackCommand.text)}`;

                response = {
                    // NOTE: public response.
                    response_type: "in_channel",
                    text: `<${vidyUrl}|VIDY result #${rnd + 1}> for: <${vidySearchUrl}|*${incomingSlackCommand.text}*>`,
                    unfurl_links: true,
                    unfurl_media: true,
                };
            } else {
                response = {
                    text: `Sorry, no VIDY results for: *${incomingSlackCommand.text}*`,
                };
            }

            return response;
        });
};

module.exports = {
    slackCommand: (req, res) => {
        return Promise.resolve()
            .then(() => {
                if (req.method !== "POST") {
                    const error = new Error("Only POST requests are accepted");
                    error.code = 405;
                    throw error;
                }

                return undefined;
            })
            // TODO: create a config key watcher, keep latest value in a provider function?
            // TODO: memoize?
            .then(() => slackCommandConfigValueGetter("slackVerificationToken"))
            .then((slackVerificationToken) => {
                if (!req.body || req.body.token !== slackVerificationToken) {
                    const error = new Error("Invalid credentials");
                    error.code = 401;
                    throw error;
                }

                const incomingSlackCommand = Object.assign(
                    {},
                    req.body,
                    {
                        token: "<overwritten>",
                    }
                );

                return createVidyResponse(incomingSlackCommand)
                    // TODO: use req.body.response_url for delayed (3000+ ms) responses?
                    .then((response) => res.json(response));
            })
            .catch((error) => {
                /* eslint-disable no-console */
                console.error(error);
                /* eslint-enable no-console */

                const code = error.code || 500;

                const formattedErrorMessage = `${error.code} ${JSON.stringify(error.message)} ${JSON.stringify(error)}`;

                res.status(code).send(formattedErrorMessage);

                throw error;
            });
    },
};
