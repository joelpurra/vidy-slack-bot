// NOTE: to use, put the contents of this file in the emulator-internal mocks.js.
// TODO: patch @google-cloud/functions-emulator to use a project path, detectable per-function root or something.
// ./node_modules/@google-cloud/functions-emulator/mocks.js
const sinon = require("sinon");

const stubbed = {};
const cloudFunctionsRuntimeConfigModuleName = "cloud-functions-runtime-config";

exports.onRequire = function(
    /* eslint-disable no-unused-vars */
    func,
    /* eslint-enable no-unused-vars */
    module
) {
    if (module === cloudFunctionsRuntimeConfigModuleName) {
        if (stubbed[cloudFunctionsRuntimeConfigModuleName] === true) {
            return undefined;
        }

        if (!stubbed[cloudFunctionsRuntimeConfigModuleName]) {
            stubbed[cloudFunctionsRuntimeConfigModuleName] = true;

            const cloudFunctionsRuntimeConfig = require(cloudFunctionsRuntimeConfigModuleName);
            stubbed[cloudFunctionsRuntimeConfigModuleName] = cloudFunctionsRuntimeConfig;

            const stub = sinon.stub(cloudFunctionsRuntimeConfig, "getVariable");

            stub.withArgs(sinon.match.string, "slackVerificationToken").returns(Promise.resolve("fake-slack-verification-token"));

            // TODO: stub the entire vidy library.
            stub.withArgs(sinon.match.string, "vidyAuthenticationKeyId").returns(Promise.resolve("sandbox"));
            stub.withArgs(sinon.match.string, "vidyAuthenticationKeySecret").returns(Promise.resolve("sandbox"));
            stub.withArgs(sinon.match.string, "vidyBaseUrlApi").returns(Promise.resolve("https://sandbox.vidy.com/"));
            stub.withArgs(sinon.match.string, "vidyBaseUrlClip").returns(Promise.resolve("https://vidy.com/v/"));
            stub.withArgs(sinon.match.string, "vidyBaseUrlSearch").returns(Promise.resolve("https://vidy.com/s/"));
            stub.withArgs(sinon.match.string, "vidyApplicationLocale").returns(Promise.resolve("en-US"));
            stub.withArgs(sinon.match.string, "vidyQueryLimit").returns(Promise.resolve("5"));
            stub.withArgs(sinon.match.string, "vidySystemUuid").returns(Promise.resolve("fake-system-uuid"));
        }

        return stubbed[cloudFunctionsRuntimeConfigModuleName];
    }

    return undefined;
};
